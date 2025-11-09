const { ethers, isAddress } = require("ethers");
const pool = require("../db/index.js");
const { wallet } = require("../utils/wallet.js");
require("dotenv").config();
const fs = require("fs");

// === 读取合约 ===
const canvasAbi = JSON.parse(fs.readFileSync("/Users/zhongyang/FemPunk-Nushu/backend/abi/FemCanvas.json"));
const revenueAbi = JSON.parse(fs.readFileSync("/Users/zhongyang/FemPunk-Nushu/backend/abi/FemCanvasRevenue.json"));
const contributionAbi = JSON.parse(fs.readFileSync("/Users/zhongyang/FemPunk-Nushu/backend/abi/FemContributions.json"));

const CANVAS_CONTRACT = process.env.CANVAS_CONTRACT_ADDRESS;
const REVENUE_CONTRACT = process.env.REVENUE_CONTRACT_ADDRESS;
const CONTRIBUTION_CONTRACT = process.env.CONTRIBUITION_CONTRACT_ADDRESS;

const canvasContract = new ethers.Contract(CANVAS_CONTRACT, canvasAbi, wallet);
const canvasRevenue = new ethers.Contract(REVENUE_CONTRACT, revenueAbi, wallet);
const canvasContribution = new ethers.Contract(CONTRIBUTION_CONTRACT, contributionAbi, wallet);



// === 测试 mint + revenue 流程 ===
async function testFinalizeCanvas() {
  try {
    const canvas_id = 8417776330752055; // 你的canvas id
    console.log("Testing finalize flow for canvas:", canvas_id);

    // === Step1. 从数据库查询信息 ===
    const canvasRes = await pool.query("SELECT * FROM canvases WHERE canvas_id=$1", [canvas_id]);
    if (canvasRes.rows.length === 0) throw new Error("Canvas not found in DB");
    const canvas = canvasRes.rows[0];
    const metadata_uri = canvas.metadata_uri;
    const day_timestamp = canvas.day_timestamp;

    const supply = 10;
    const price = ethers.parseEther("0.00018");
    const totalRaised = price * BigInt(supply);
    console.log("totalRaised (wei):", totalRaised.toString());

    // === Step2. 调用 mintCanvas() ===
    console.log("Minting canvas...");
    const mintTx = await canvasContract.mintCanvas(canvas_id, day_timestamp, metadata_uri, supply);
    await mintTx.wait();
    console.log("Minted canvas tx:", mintTx.hash);

    // === Step2. 记录贡献 ===
    const addressOne = "0x92Ae87507658451736821bfFa913BAC0e184d4e2";
    console.log("Recording contribution...");
    const contributionTx = await canvasContribution.recordContribution(canvas_id, addressOne, 10);
    await contributionTx.wait();
    console.log("Contribution recorded tx one:", contributionTx.hash);
    const addressSecond = "0x84228976433481050297e5780D80c3141D0BEACf";
    const contributionTxSecond = await canvasContribution.recordContribution(canvas_id, addressSecond, 10);
    await contributionTxSecond.wait();
    console.log("Contribution recorded tx two:", contributionTxSecond.hash);

    // === Step2. 分发收入 ===
    console.log("Distributing revenue...");
    const distribute = await canvasRevenue.distributeRevenue(canvas_id);
    await distribute.wait();
    console.log("Revenue distributed tx:", distribute.hash);

    // === Step3. 直接调用 receiveRevenue() 并附带 ETH ===
    console.log("Sending ETH to receiveRevenue()...");
    const receiveTx = await canvasRevenue.receiveRevenue(canvas_id, {
      value: totalRaised, 
    });
    await receiveTx.wait();
    console.log("Revenue received tx:", receiveTx.hash);

    // === Step4. claimRevenue() ===
    console.log("Claiming revenue...");
    const claimTx = await canvasRevenue.claimRevenue(canvas_id);
    await claimTx.wait();
    console.log("Revenue claimed tx:", claimTx.hash);

    // === Step5. 更新数据库 ===
    await pool.query(
      "UPDATE canvases SET total_raised_wei=$1, updated_ts=extract(epoch from now())*1000 WHERE canvas_id=$2",
      [totalRaised.toString(), canvas_id]
    );

    console.log("✅ DB updated successfully.");

    console.log("🎉 finalizeCanvasTest done!");
  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
        pool.end();
    }

  }

testFinalizeCanvas();
