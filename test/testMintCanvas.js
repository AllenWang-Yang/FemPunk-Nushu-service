// test/testMintCanvas.js
const axios = require("axios");

const API_BASE = "http://localhost:3000/api";

async function testMintCanvas() {
  try {
    const canvas_id = "8417776330752055";
    const metadata_uri =
      "https://subjective-aquamarine-hippopotamus.myfilebase.com/ipfs/QmTSAvujXNv6BeCjomKC4UwZHiEyxF8ztckkRof2143YHR";
    const supply = 100;

    const res = await axios.post(`${API_BASE}/canvas/mint`, {
      canvas_id
    });

    console.log("Mint Canvas Success!");
    console.log("TX Hash:", res.data.txHash);
  } catch (err) {
    console.error("Mint Canvas Failed:", err.response?.data || err.message);
  }
}

testMintCanvas();
