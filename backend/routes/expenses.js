const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Lưu chi phí
router.post('/', async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, error: "Dữ liệu không hợp lệ" });
  }

  try {
    const results = []; // để lưu các bản ghi đã insert

    for (const item of items) {
      const result = await pool.query(
        'INSERT INTO expenses (name, type, amount, note, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [item.name, item.type, item.amount, item.note, item.date]
      );
      results.push(result.rows[0]); // lấy bản ghi đã insert
    }

    // In log ra console
    console.log("Inserted expenses:", results);

    // Trả về cho client
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error inserting expenses:", error);
    res.status(500).json({ success: false, error: "Lỗi lưu chi phí" });
  }
});

// Lấy danh sách chi phí
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ success: false, error: "Lỗi khi lấy danh sách chi phí" });
  }
});

// Xóa chi phí theo id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      console.warn(`Không tìm thấy chi phí có id = ${id}`);
      return res.status(404).json({ success: false, error: "Chi phí không tồn tại" });
    }
    console.log(`Đã xóa chi phí:`, result.rows[0]); // 👈 in ra thông tin vừa xóa
    res.json({ success: true, message: "Đã xóa chi phí", deleted: result.rows[0] });

  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ success: false, error: "Lỗi khi xóa chi phí" });
  }
});

// Lấy danh sách chi phí + filter
router.get('/', async (req, res) => {
  try {
    const { from, to, type } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (from) {
      params.push(from);
      query += ` AND date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND date <= $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND type ILIKE $${params.length}`;
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, params);

    // Tính tổng
    const total = result.rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    res.json({ success: true, expenses: result.rows, total });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ success: false, error: "Lỗi khi lấy dữ liệu" });
  }
});

module.exports = router;
