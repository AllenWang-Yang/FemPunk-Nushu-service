const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ethers } = require("ethers");
const { wallet } = require("../utils/wallet");
const contributionsAbi = require("../abi/FemContributions.json");
const contributionsContract = new ethers.Contract(process.env.CONTRIBUITION_CONTRACT_ADDRESS, contributionsAbi, wallet);

// record user contributions to a canvas
router.post("/record", async (req, res) => {
  const { canvas_id, contributor, _contributions } = req.body;
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
          "UPDATE contributions SET contributions=$3, updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$1 AND contributor=$2",
          [canvas_id, contributor, newContributions]
        );
        return res.json({ success: true });
    }else{
      // insert new record
      const result = await pool.query(
        "INSERT INTO contributions(canvas_id, contributor, contributions, created_ts, updated_ts) VALUES ($1,$2,$3,extract(epoch from now())*1000,extract(epoch from now())*1000)",
        [canvas_id, contributor, _contributions]
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

module.exports = router;
