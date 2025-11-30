const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ethers } = require("ethers");
const { wallet } = require("../utils/wallet");
const contributionsAbi = require("../abi/FemContributions.json");
const contributionsContract = new ethers.Contract(process.env.CONTRIBUITION_CONTRACT_ADDRESS, contributionsAbi, wallet);

// record user contributions to a canvas
router.post("/record", async (req, res) => {
  const { canvas_id, contributor, _contributions,tx_hash } = req.body;
  try {
    // step 1: check if record exists
    const result = await pool.query(
      "SELECT contributions FROM contributions WHERE canvas_id=$1 AND contributor=$2",
      [canvas_id, contributor]
    );
    // step 2: insert or update record
    if(result.rows.length > 0) {
        // update existing record
        const newContributions = Number(result.rows[0].contributions) + _contributions;
        await pool.query(
          "UPDATE contributions SET contributions=$3,tx_hash=$4, updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$1 AND contributor=$2",
          [canvas_id, contributor,tx_hash, newContributions]
        );
        return res.json({ success: true });
    }else{
      // insert new record
      const result = await pool.query(
        "INSERT INTO contributions(canvas_id, contributor, contributions,tx_hash, created_ts, updated_ts) VALUES ($1,$2,$3,extract(epoch from now())*1000,extract(epoch from now())*1000)",
        [canvas_id, contributor, _contributions,tx_hash]
      );
      res.json({ success: true });
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/recordOnChain", async (req, res) => {
    const { canvas_id} = req.body;
    try {
      const result = await pool.query(
        "SELECT * FROM contributions WHERE canvas_id=$1 AND is_deleted=0",
        [canvas_id]
      );
      const contributors = result.rows.length;
      if (contributors === 0) return res.status(404).json({ success: false, error: "Record not found" });

      result.rows.forEach(async (row) => {
        const contributor = row.contributor;
        // Everyone's contributions is 1% temporarily.
        const controbutions = 1;
        const tx = await contributionsContract.recordContribution(canvas_id, contributor, controbutions);
        await tx.wait();
        const txHash = tx.hash;
        console.log("Recorded on chain for contributor txHash is :", txHash);
        await pool.query(
          "UPDATE contributions SET tx_hash=$3, updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$1 AND contributor=$2",
          [canvas_id, contributor,txHash]
        );

      });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });


// get contributions for a canvas
router.get("/:canvas_id", async (req, res) => {
    const { canvas_id } = req.params;
    try {
        // return a array of contributions for the canvas
        const result = await pool.query("SELECT * FROM contributions WHERE canvas_id=$1 AND is_deleted=0", [canvas_id]);
        res.json({ success: true, contributions: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// calculate total sales amount when minting canvas
router.post("/calculateSales", async (req, res) => {
    const { canvas_id, supply, price_wei } = req.body;
    try {
        // calculate total sales
        const totalSales = BigInt(supply) * BigInt(price_wei);
        
        // update canvas total_raised_wei
        await pool.query(
            "UPDATE canvases SET total_raised_wei=$1, updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$2",
            [totalSales.toString(), canvas_id]
        );

        res.json({ 
            success: true, 
            total_sales_wei: totalSales.toString(),
            supply: supply,
            price_wei: price_wei
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// get canvases that a contributor has contributed to
router.get("/contributor/:address", async (req, res) => {
    const { address } = req.params;
    const normalizedAddress = address.toLowerCase();
    try {
        const result = await pool.query(
            `SELECT DISTINCT c.canvas_id, c.day_timestamp, c.metadata_uri, c.image_url, c.total_raised_wei, 
             c.finalized, co.contributions, co.created_ts,
             COALESCE(c.total_raised_wei, '0') as settleable_amount,
             COALESCE(rs.claimed, 0) as claimed
             FROM canvases c
             INNER JOIN contributions co ON c.canvas_id = co.canvas_id
             LEFT JOIN revenue_shares rs ON c.canvas_id = rs.canvas_id AND rs.contributor = co.contributor AND rs.is_deleted = 0
             WHERE co.contributor=$1 AND c.is_deleted=0 AND co.is_deleted=0
             ORDER BY c.day_timestamp DESC`,
            [normalizedAddress]
        );
        res.json({ success: true, canvases: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
