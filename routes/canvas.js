const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ethers } = require("ethers");
const { wallet } = require("../utils/wallet");
const canvasAbi = require("../abi/FemCanvas.json");
const revenueAbi = require("../abi/FemCanvasRevenue.json");
const contributionsAbi = require("../abi/FemContributions.json");
const { generateUUID } = require("../utils/generateUUID");
const { uploadToFilebase, uploadMetadata } = require('../utils/uploadNft');
const canvasContract = new ethers.Contract(process.env.CANVAS_CONTRACT_ADDRESS, canvasAbi, wallet);
const canvasRevenue = new ethers.Contract(process.env.REVENUE_CONTRACT_ADDRESS, revenueAbi, wallet);
const canvasContribution = new ethers.Contract(process.env.CONTRIBUITION_CONTRACT_ADDRESS, contributionsAbi, wallet);

// get all canvas 
router.get("/",async (req,res) => {
  try {
    const result = await pool.query("SELECT * FROM canvases WHERE is_deleted=0");
    res.json({ success: true, canvas: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// get canvas by day_timestamp
router.get("/:day_timestamp", async (req, res) => {
  const { day_timestamp } = req.params;
  try {
    const result = await pool.query("SELECT * FROM canvases WHERE day_timestamp=$1 AND is_deleted=0", [day_timestamp]);
    res.json({ success: true, canvas: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// get canvas by canvas_id
router.get("/id/:canvas_id", async (req, res) => {
    const { canvas_id } = req.params;
    try {
      const result = await pool.query("SELECT * FROM canvases WHERE canvas_id=$1 AND is_deleted=0", [canvas_id]);
      res.json({ success: true, canvas: result.rows[0] || null });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
});

// create a canvas at everyday 00:00 UTC+8 （2025-10-21T00:00:00+08:00  =》 1760976000000）
router.post("/create", async (req, res) => {
  // metadata_uri is first version uri, later can be updated when minting
  const { day_timestamp, metadata_uri, supply,creator } = req.body;
  try {
    const canvasId = generateUUID();
    const creator = req.body.creator || "0x84228976433481050297e5780D80c3141D0BEACf";
    // insert into database
    await pool.query(
      "INSERT INTO canvases(canvas_id, day_timestamp, metadata_uri, creator,total_raised_wei, finalized, updated_ts,created_ts) VALUES ($1,$2,$3,$4,0,0,extract(epoch from now())*1000,extract(epoch from now())*1000)",
      [canvasId, day_timestamp, metadata_uri,creator]
    );

    res.json({ success: true, canvasId});
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// mint ERC1155 NFT for a canvas (admin only - initial minting)
router.post("/mint", async (req, res) => {
  // step1: update metadata_uri in database
    const { canvas_id } = req.body;
    console.log("Minting canvas:", canvas_id);
    // step1: check canvas info
    const canvas = await pool.query(
        "SELECT * FROM canvases WHERE canvas_id=$1", [canvas_id]
    );
    if (canvas.rows.length === 0) return res.status(404).json({ success: false, error: "Canvas not found" });

    try {
        const metadata_uri =  canvas.rows[0].metadata_uri
        const day_timestamp = canvas.rows[0].day_timestamp;
        const supply = 100;// default supply 100
        // step2: call contract to mint
        console.log("Calling mintCanvas on contract...");
        const tx = await canvasContract.mintCanvas(canvas_id, day_timestamp, metadata_uri, supply);
        await tx.wait();
        const txHash = tx.hash;
        console.log("Calling mintCanvas txHash is:", txHash);
        // step3: update tx_hash in database
        await pool.query(
            "UPDATE canvases SET tx_hash=$1, updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$2;",
            [txHash,canvas_id]
        );
        
        res.json({ success: true, txHash: txHash });
    }catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
    
});

// user buy canvas NFT (record purchase in database)
// Note: User should call contract directly from frontend to purchase
// This endpoint is for recording the purchase after blockchain confirmation
router.post("/purchase", async (req, res) => {
    const { canvas_id, buyer_address, tx_hash, amount_wei } = req.body;
    
    try {
        // step1: verify canvas exists
        const canvas = await pool.query(
            "SELECT * FROM canvases WHERE canvas_id=$1 AND is_deleted=0",
            [canvas_id]
        );
        
        if (canvas.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Canvas not found" });
        }

        // step2: verify transaction on blockchain (optional but recommended)
        // You can verify the tx_hash is valid and matches the purchase

        // step3: update total_raised_wei in database
        const currentTotal = BigInt(canvas.rows[0].total_raised_wei || 0);
        const newTotal = currentTotal + BigInt(amount_wei);
        
        await pool.query(
            "UPDATE canvases SET total_raised_wei=$1, updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$2",
            [newTotal.toString(), canvas_id]
        );

        // step4: optionally record purchase history
        // await pool.query(
        //     "INSERT INTO purchases(canvas_id, buyer_address, amount_wei, tx_hash, created_ts) VALUES ($1,$2,$3,$4,extract(epoch from now())*1000)",
        //     [canvas_id, buyer_address, amount_wei, tx_hash]
        // );

        res.json({ 
            success: true,
            canvas_id: canvas_id,
            total_raised_wei: newTotal.toString(),
            tx_hash: tx_hash
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// mint + contribution + finalize in one step
router.post("/finalize", async (req, res) => {
    const { canvas_id } = req.body;
    try {
        // step1: check canvas info
        const canvas = await pool.query(
            "SELECT * FROM canvases WHERE canvas_id=$1", [canvas_id]
        );
        if (canvas.rows.length === 0) return res.status(404).json({ success: false, error: "Canvas not found" });
        const metadata_uri =  canvas.rows[0].metadata_uri
        const day_timestamp = canvas.rows[0].day_timestamp;
        const supply = 100;// default supply 100
        const price = ethers.parseEther("0.0018");
        const totalRaised = price * BigInt(supply);
        console.log("Total raised wei:", totalRaised.toString());

        // step2: call contract to mint
        console.log("Calling mintCanvas on contract...");
        const mintTx = await canvasContract.mintCanvas(canvas_id, day_timestamp, metadata_uri, supply);
        await mintTx.wait();
        const mintTxHash = mintTx.hash;
        console.log("Calling mintCanvas txHash is:", mintTxHash);

        // step2: record contributions
        const addressOne = "0x92Ae87507658451736821bfFa913BAC0e184d4e2";
        console.log("Recording contribution...");
        const contributionTx = await canvasContribution.recordContribution(canvas_id, addressOne, 10);
        await contributionTx.wait();
        console.log("Contribution recorded tx one:", contributionTx.hash);
        const addressSecond = "0x84228976433481050297e5780D80c3141D0BEACf";
        const contributionTxSecond = await canvasContribution.recordContribution(canvas_id, addressSecond, 10);
        await contributionTxSecond.wait();
        console.log("Contribution recorded tx two:", contributionTxSecond.hash);

        // step2: distribute revenue
        console.log("Distributing revenue...");
        const distribute = await canvasRevenue.distributeRevenue(canvas_id);
        await distribute.wait();
        console.log("Revenue distributed tx:", distribute.hash);

        // step3: receive revenue
        const receiveRevenueTx = await canvasRevenue.receiveRevenue(canvas_id);
        await receiveRevenueTx.wait();
        const receiveRevenueTxHash = receiveRevenueTx.hash;
        console.log("Calling receiveRevenue txHash is:", receiveRevenueTxHash);

        // step4: revenue claim
        const revenueTx = await canvasRevenue.claimRevenue(canvas_id);
        await revenueTx.wait();
        const revenueTxHash = revenueTx.hash;
        console.log("Calling claimRevenue txHash is:", revenueTxHash);       

        // step5: update database
        await pool.query(
            "UPDATE canvases SET total_raised_wei=$1, updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$2;",
            [totalRaised,canvas_id]
        );
        await pool.query(
            "UPDATE settlements SET total_income_wei=$2,updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$1;",
            [canvas_id,totalRaised]
        );

        
        res.json({ success: true, mintTxHash, receiveRevenueTxHash, revenueTxHash });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
