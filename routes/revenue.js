const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ethers } = require("ethers");
const { wallet } = require("../utils/wallet");
const revenueAbi = require("../abi/FemCanvasRevenue.json");
const revenueContract = new ethers.Contract(process.env.REVENUE_CONTRACT_ADDRESS, revenueAbi, wallet);

// get revenue shares for a user
router.post("/getCanvasRevenue", async (req, res) => {
  const { contributor, cavans_id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM revenue_shares WHERE contributor=$1 AND canvas_id=$2 AND is_deleted=0", [contributor, cavans_id]);
    res.json({ success: true, revenue: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// record revenue claim (user should call contract directly from frontend)
// This endpoint is for recording the claim after blockchain confirmation
router.post("/recordClaim", async (req, res) => {
  const { contributor, canvas_id, tx_hash } = req.body;
  
  try {
    // step1: check if revenue exists and not claimed
    const result = await pool.query(
      "SELECT * FROM revenue_shares WHERE contributor=$1 AND canvas_id=$2 AND claimed=0 AND is_deleted=0",
      [contributor, canvas_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "No claimable revenue found or already claimed" });
    }

    const revenueShare = result.rows[0];
    
    // step2: update database to mark as claimed
    await pool.query(
      "UPDATE revenue_shares SET claimed=1, claimed_tx=$1, updated_ts=extract(epoch from now())*1000 WHERE id=$2",
      [tx_hash, revenueShare.id]
    );

    res.json({ 
      success: true,
      canvas_id: canvas_id,
      contributor: contributor,
      reward_wei: revenueShare.reward_wei,
      tx_hash: tx_hash
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
