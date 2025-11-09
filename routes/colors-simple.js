const express = require("express");
const router = express.Router();

// 模拟数据存储
let mockColors = [
  { color_id: 1, color_code: 'FF6B6B', owner_address: null, metadata_uri: 'ipfs://color-FF6B6B', created_ts: Date.now(), updated_ts: Date.now(), is_deleted: 0 },
  { color_id: 2, color_code: '4ECDC4', owner_address: null, metadata_uri: 'ipfs://color-4ECDC4', created_ts: Date.now(), updated_ts: Date.now(), is_deleted: 0 },
  { color_id: 3, color_code: '45B7D1', owner_address: null, metadata_uri: 'ipfs://color-45B7D1', created_ts: Date.now(), updated_ts: Date.now(), is_deleted: 0 },
  { color_id: 4, color_code: 'FFA07A', owner_address: null, metadata_uri: 'ipfs://color-FFA07A', created_ts: Date.now(), updated_ts: Date.now(), is_deleted: 0 },
  { color_id: 5, color_code: '98D8C8', owner_address: null, metadata_uri: 'ipfs://color-98D8C8', created_ts: Date.now(), updated_ts: Date.now(), is_deleted: 0 }
];

// get total colors
router.get("/", (req, res) => {
  try {
    const availableColors = mockColors.filter(color => color.is_deleted === 0);
    res.json({ success: true, colors: availableColors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// reward colors to users
router.post("/reward", (req, res) => {
  const { address, color_id, color_code } = req.body;
  try {
    let color;
    let colorId;
    
    // If color_code is provided, find or create the color
    if (color_code) {
      // Check if color already exists
      color = mockColors.find(c => c.color_code === color_code);
      
      if (!color) {
        // Create new color if it doesn't exist
        colorId = mockColors.length + 1;
        color = {
          color_id: colorId,
          color_code: color_code,
          owner_address: address,
          metadata_uri: `ipfs://color-${color_code}`,
          created_ts: Date.now(),
          updated_ts: Date.now(),
          is_deleted: 0
        };
        mockColors.push(color);
      } else {
        colorId = color.color_id;
        // Update owner
        color.owner_address = address;
        color.updated_ts = Date.now();
      }
    } else if (color_id) {
      // Use provided color_id
      color = mockColors.find(c => c.color_id === color_id);
      if (!color) return res.status(404).json({ success: false, error: "Color not found" });
      colorId = color_id;
      // Update owner
      color.owner_address = address;
      color.updated_ts = Date.now();
    } else {
      return res.status(400).json({ success: false, error: "Either color_id or color_code is required" });
    }
    
    // For demo purposes, generate a fake transaction hash
    const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    console.log("Demo tx hash:", txHash);
    
    // Update tx_hash
    color.tx_hash = txHash;

    res.json({ success: true, txHash: txHash, color_id: colorId, color_code: color_code || color.color_code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/owner/:address", (req, res) => {
  const { address } = req.params;
  try {
    const userColors = mockColors.filter(color => 
      color.owner_address === address && color.is_deleted === 0
    );
    res.json({ success: true, colors: userColors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;