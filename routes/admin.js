// All of interface for admin routes
const express = require('express');
const router = express.Router();
const pool = require("../db");
const { ethers } = require("ethers");
const { wallet } = require("../utils/wallet");
const canvasAbi = require("../abi/FemCanvas.json");
const canvasContract = new ethers.Contract(process.env.CANVAS_CONTRACT_ADDRESS, canvasAbi, wallet);

// Middleware to check if user is admin (暂时注释掉，方便测试)
// function isAdmin(req, res, next) {
//     if (req.user && req.user.role === 'admin') {
//         return next();
//     } else {
//         res.status(403).send('Access denied. Admins only.');
//     }       
// }

// Apply isAdmin middleware to all admin routes
// router.use(isAdmin);

router.post("/mint", async (req, res) => {
  const { canvas_id, supply } = req.body;
  try {
    // call smart contract to mint
    const tx = await canvasContract.mintCanvasNFT(canvas_id, supply);
    const receipt = await tx.wait();

    res.json({ success: true, transactionHash: receipt.transactionHash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// create a new canvas
router.post("/create", async (req, res) => {
  const { creator_address, day_timestamp, metadata_uri } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO canvases (creator_address, day_timestamp, metadata_uri, created_ts, updated_ts) VALUES ($1, $2, $3, extract(epoch from now())*1000, extract(epoch from now())*1000) RETURNING canvas_id;",
      [creator_address, day_timestamp, metadata_uri]
    );
    const canvasId = result.rows[0].canvas_id;
    console.log("Created new canvas with ID:", canvasId);
    res.json({ success: true, canvasId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// stop canvas sales
router.post("/stopSales", async (req, res) => {
  const { canvas_id } = req.body;
  try {
    // check if canvas exists
    const canvas = await pool.query(
      "SELECT * FROM canvases WHERE canvas_id=$1 AND is_deleted=0",
      [canvas_id]
    );
    
    if (canvas.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Canvas not found" });
    }

    // update canvas status to 0 (disabled)
    await pool.query(
      "UPDATE canvases SET status=0, updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$1",
      [canvas_id]
    );

    res.json({ 
      success: true, 
      message: "Canvas sales stopped successfully",
      canvas_id: canvas_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// settle canvas: distribute revenue to contributors
router.post("/settle", async (req, res) => {
  const { canvas_id } = req.body;
  try {
    // step1: get canvas info
    const canvas = await pool.query(
      "SELECT * FROM canvases WHERE canvas_id=$1 AND is_deleted=0",
      [canvas_id]
    );
    
    if (canvas.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Canvas not found" });
    }

    const canvasData = canvas.rows[0];
    const totalSalesWei = BigInt(canvasData.total_raised_wei);
    
    if (totalSalesWei === 0n) {
      return res.status(400).json({ success: false, error: "No sales to settle" });
    }

    // step2: get all contributors
    const contributors = await pool.query(
      "SELECT contributor, contributions FROM contributions WHERE canvas_id=$1 AND is_deleted=0",
      [canvas_id]
    );

    if (contributors.rows.length === 0) {
      return res.status(400).json({ success: false, error: "No contributors found" });
    }

    // step3: call contract to receive revenue (send ETH to contract)
    const revenueAbi = require("../abi/FemCanvasRevenue.json");
    const revenueContract = new ethers.Contract(process.env.REVENUE_CONTRACT_ADDRESS, revenueAbi, wallet);
    
    console.log("Sending revenue to contract...");
    const receiveRevenueTx = await revenueContract.receiveRevenue(canvas_id, {
      value: totalSalesWei.toString()
    });
    await receiveRevenueTx.wait();
    console.log("Revenue received by contract, txHash:", receiveRevenueTx.hash);

    // step4: call contract to distribute revenue
    console.log("Distributing revenue on contract...");
    const distributeTx = await revenueContract.distributeRevenue(canvas_id);
    await distributeTx.wait();
    console.log("Revenue distributed on contract, txHash:", distributeTx.hash);

    // step5: calculate platform fee for database record (1% = 100 basis points / 10000)
    const platformFeeRate = 100n; // basis points (100/10000 = 1%)
    const platformFeeWei = (totalSalesWei * platformFeeRate) / 10000n;
    const distributionWei = totalSalesWei - platformFeeWei;
    const totalContributions = contributors.rows.reduce((sum, row) => sum + row.contributions, 0);
    
    // step6: create settlement record
    const settlementResult = await pool.query(
      "INSERT INTO settlements(canvas_id, total_income_wei, distributed, settled_ts, created_ts, updated_ts) VALUES ($1, $2, 1, extract(epoch from now())*1000, extract(epoch from now())*1000, extract(epoch from now())*1000) RETURNING id",
      [canvas_id, totalSalesWei.toString()]
    );
    const settlementId = settlementResult.rows[0].id;

    // step7: save revenue shares to database (for query purposes)
    for (const contributor of contributors.rows) {
      const contributorShare = BigInt(contributor.contributions);
      const rewardWei = distributionWei * contributorShare / BigInt(totalContributions);
      
      await pool.query(
        "INSERT INTO revenue_shares(settlement_id, contributor, canvas_id, contributions, reward_wei, claimed, created_ts, updated_ts) VALUES ($1, $2, $3, $4, $5, 0, extract(epoch from now())*1000, extract(epoch from now())*1000)",
        [settlementId, contributor.contributor, canvas_id, contributor.contributions, rewardWei.toString()]
      );
    }

    // step8: update canvas finalized status
    await pool.query(
      "UPDATE canvases SET finalized=1, updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$1",
      [canvas_id]
    );

    res.json({ 
      success: true,
      settlement_id: settlementId,
      receive_revenue_tx: receiveRevenueTx.hash,
      distribute_tx: distributeTx.hash,
      total_sales_wei: totalSalesWei.toString(),
      platform_fee_wei: platformFeeWei.toString(),
      distribution_wei: distributionWei.toString(),
      contributors_count: contributors.rows.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;    