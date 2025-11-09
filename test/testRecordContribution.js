// test/testRecordContribution.js
const axios = require("axios");

const API_BASE = "http://localhost:3000/api"; // 先别加 /api，如果你后端是 app.use('/canvas', canvasRouter)

async function testRecordContribution() {
  try {
    const canvas_id = "7005970366226271";
    const contributor = "0x84228976433481050297e5780D80c3141D0BEACf";
    const _contributions = "13";

    const res = await axios.post(`${API_BASE}/contributions/record`, {
      canvas_id,
      contributor,
      _contributions,
    });

    console.log("✅ Record Contribution Success!");
    console.log(res.data);
  } catch (err) {
    console.error(
      "Record Contribution Failed:",
      err.response?.data || err.message
    );
  }
}

testRecordContribution();
