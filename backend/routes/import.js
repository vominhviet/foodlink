const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Lưu đơn nhập hàng
router.post('/import', async (req, res) => {
  const { items } = req.body;
  try {
    const orderResult = await pool.query(
      'INSERT INTO import_orders DEFAULT VALUES RETURNING id'
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await pool.query(
        'INSERT INTO import_order_items (order_id, name, unit, quantity, price, total) VALUES ($1, $2, $3, $4, $5, $6)',
        [orderId, item.name, item.unit, item.quantity, item.price, item.quantity * item.price]
      );
    }
    res.json({ success: true, orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Lỗi lưu đơn nhập hàng' });
  }
});

module.exports = router;