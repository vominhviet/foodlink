const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// =========================
// API: Lấy tất cả invoices
// =========================
router.get('/invoices', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * 
      FROM invoices 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy invoices' });
  }
});

// ===================================
// API: Lấy 1 invoice theo id
// ===================================
router.get('/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM invoices WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Invoice không tồn tại' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy invoice' });
  }
});

// ===================================
// API: Cập nhật invoice theo id
// ===================================
router.put('/invoices/:id', async (req, res) => {
  const { id } = req.params;
  const { customer_id, items, total_amount, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE invoices 
       SET customer_id = $1,
           items = $2,
           total_amount = $3,
           status = $4,
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [customer_id, items, total_amount, status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Invoice không tồn tại' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật invoice' });
  }
});

// ===================================
// API: Xóa invoice theo id
// ===================================
router.delete('/invoices/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Invoice không tồn tại' });
    }

    res.json({ success: true, message: 'Đã xóa invoice thành công' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa invoice' });
  }
});

module.exports = router;
