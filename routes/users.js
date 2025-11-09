const express = require("express");
const router = express.Router();
const pool = require("../db");

// get all users
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE is_deleted=0");
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// register a new user
router.post("/register", async (req, res) => {
  const { username, email ,address} = req.body;
  address = address != null? address : "";
  try {
    await pool.query(
      "INSERT INTO users(username, email,address, created_ts, updated_ts) VALUES ($1,$2,$3,extract(epoch from now())*1000,extract(epoch from now())*1000)",
      [username, email,address]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } 
});

// update user address
router.post("/updateAddress", async (req, res) => {
    const { user_id, address} = req.body;
    try {
        await pool.query(
        "UPDATE users SET address=$1, updated_ts=extract(epoch from now())*1000 WHERE id=$2",
        [address,user_id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// get user by id
router.get("/:user_id", async (req, res) => {
    const { user_id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM users WHERE id=$1 AND is_deleted=0", [user_id]);
        res.json({ success: true, user: result.rows[0] || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
