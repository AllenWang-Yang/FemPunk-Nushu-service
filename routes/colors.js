const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ethers } = require("ethers");
const { wallet } = require("../utils/wallet");
const colorsAbi = require("../abi/FemColors.json");
const colorsContract = new ethers.Contract(process.env.COLORS_CONTRACT_ADDRESS, colorsAbi, wallet);

// get total colors
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM colors WHERE is_deleted=0");
    res.json({ success: true, colors: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// users buy colors
router.post("/buy", async (req, res) => {
  const { address, color_id } = req.body;
  try {
    const color = await pool.query("SELECT * FROM colors WHERE color_id=$1", [color_id]);
    if (color.rows.length === 0) return res.status(404).json({ success: false, error: "Color not found" });

    const metadataURI = color.rows[0].metadata_uri;
    // step1: update db
    await pool.query("UPDATE colors SET owner_address=$1,updated_ts=extract(epoch from now())*1000 WHERE color_id=$2", [address, color_id]);
    // step2: call contract
    const tx = await colorsContract.buyCodlor(color_id, { value: metadataURI });
    await tx.wait();
    // step3: update db with tx hash
    await pool.query("UPDATE colors SET owner_address=$1, updated_ts=extract(epoch from now())*1000 WHERE color_id=$2", [address, color_id]);

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// reword colors to users
router.post("/reward", async (req, res) => {
  const { address, color_id } = req.body;

  console.log('Reward request received:', { address, color_id, body: req.body });
  // check information
  if (!address || !color_id) {
    console.log('Validation failed - missing parameters:', { address: !!address, color_id: !!color_id });
    return res.status(400).json({
      success: false,
      error: "Wallet address and color code are required"
    });
  }

  try {
    // 确保 color_id 是数字类型
    const colorIdNum = parseInt(color_id);
    if (isNaN(colorIdNum)) {
      return res.status(400).json({ success: false, error: "Invalid color_id format" });
    }

    const color = await pool.query("SELECT * FROM colors WHERE color_id=$1", [colorIdNum]);
    if (color.rows.length === 0) return res.status(404).json({ success: false, error: "Color not found" });

    const metadataURI = color.rows[0].metadata_uri;
    const color_code = color.rows[0].color_code;

    console.log('Calling contract with:', { address, colorId: colorIdNum, metadataURI });

    // step1: update db
    await pool.query("UPDATE colors SET owner_address=$1,updated_ts=extract(epoch from now())*1000 WHERE color_id=$2", [address, colorIdNum]);

    // step2: call contract - rewardColor(to, colorId, metadataURI)
    const tx = await colorsContract.rewardColor(address, colorIdNum, metadataURI);
    await tx.wait();
    const txHash = tx.hash;
    console.log("Tx sent:", txHash);

    // step3: update tx_hash in db
    await pool.query("UPDATE colors SET tx_hash=$1, updated_ts=extract(epoch from now())*1000 WHERE color_id=$2", [txHash, colorIdNum]);


    res.json({ success: true, txHash: txHash, color_code: color_code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/owner/:address", async (req, res) => {
  const { address } = req.params;
  try {
    const result = await pool.query("SELECT * FROM colors WHERE owner_address=$1 AND is_deleted=0", [address]);
    res.json({ success: true, colors: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;