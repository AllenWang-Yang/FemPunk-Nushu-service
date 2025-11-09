const express = require("express");
const router = express.Router();
const pool = require("../db");

// get revenue shares for a user
router.post("/getCanvasRevenue", async (req, res) => {
  const { contributor,cavans_id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM revenue_shares WHERE contributor=$1 AND canvas_id=$2 AND is_deleted=0", [contributor,cavans_id]);
    res.json({ success: true, revenue: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});




module.exports = router;
