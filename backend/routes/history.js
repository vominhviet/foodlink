const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all history records
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, u.username 
      FROM history h 
      LEFT JOIN users u ON h.user_id = u.id 
      ORDER BY h.timestamp DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;