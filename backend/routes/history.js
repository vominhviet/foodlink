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

router.post('/stock-history', async (req, res) => {
  const { product_name, unit, quantity, price, type } = req.body;
  // Lưu vào bảng stock_history
  await pool.query(
    'INSERT INTO stock_history (product_name, type, quantity, price, total, date, username) VALUES ($1, $2, $3, $4, $5, NOW(), $6)',
    [product_name, type, quantity, price, quantity * price, 'admin']
  );
  // Cập nhật tồn kho sản phẩm (nếu có bảng products)
  await pool.query(
    'UPDATE products SET stock = stock + $1 WHERE name = $2',
    [quantity, product_name]
  );
  res.json({ success: true });
});

module.exports = router;