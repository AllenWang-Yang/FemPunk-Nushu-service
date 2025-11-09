// test/testRecordOnChain.js
const axios = require("axios");

const API_BASE = "http://localhost:3000/api"; // 先别加 /api，如果你后端是 app.use('/canvas', canvasRouter)

async function testRecordOnChain() {
  try {
    const canvas_id = "7005970366226271";

    const res = await axios.post(`${API_BASE}/contributions/recordOnChain`, {
      canvas_id,
    });

    console.log("Record Contribution on chain Success!");
    console.log(res.data);
  } catch (err) {
    console.error(
      "Record Contribution on chain Failed:",
      err.response?.data || err.message
    );
  }
}

testRecordOnChain();
