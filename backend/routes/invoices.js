const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// DELETE invoice
router.delete('/:id', async (req, res) => {
  console.log('DELETE /invoices/:id param:', req.params);
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM invoices WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// UPDATE invoice
router.put('/:id', async (req, res) => {
  console.log('PUT /invoices/:id body:', req.body);
  try {
    const { id } = req.params;
  const { date, seller, customer_name, address, items, total_amount, status, customerPhone } = req.body;
    // Tìm hoặc tạo khách hàng
    let customer_id = null;
    const customerRes = await pool.query(
      `SELECT id FROM customers WHERE name = $1 AND address = $2 LIMIT 1`,
  [customer_name, address]
    );
    if (customerRes.rows.length > 0) {
  customer_id = customerRes.rows[0].id;
  if (customerPhone) {
    await pool.query('UPDATE customers SET phone = $1 WHERE id = $2', [customerPhone, customer_id]);
  }
} else {
  const insertCustomer = await pool.query(
    'INSERT INTO customers (name, address, phone) VALUES ($1, $2, $3) RETURNING id',
    [customer_name, address, customerPhone || null]
  );
  customer_id = insertCustomer.rows[0].id;
}
    await pool.query(
      `UPDATE invoices SET customer_id = $1, items = $2, total_amount = $3, status = $4, created_at = $5, seller = $6 WHERE id = $7`,
      [customer_id, JSON.stringify(items), total_amount, status || 'pending', date, seller, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, c.name as customer_name, c.address as customer_address, c.phone as customer_phone
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    
    // Kiểm tra nếu bảng không tồn tại
    if (error.code === '42P01') {
      return res.status(500).json({ 
        message: 'Bảng invoices chưa được tạo. Vui lòng khởi động lại server.' 
      });
    }
    
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// CREATE new invoice
router.post('/', async (req, res) => {
  console.log('POST /invoices body:', req.body);
  try {
 const { date, seller, customer_name, address, items, total_amount, status, customerPhone } = req.body;
    const invoiceNumber = 'INV-' + Date.now();
    // Tìm hoặc tạo khách hàng
    let customer_id = null;
    const customerRes = await pool.query(
      `SELECT id FROM customers WHERE name = $1 AND address = $2 LIMIT 1`,
  [customer_name, address]
    );
    if (customerRes.rows.length > 0) {
  customer_id = customerRes.rows[0].id;
  if (customerPhone) {
    await pool.query('UPDATE customers SET phone = $1 WHERE id = $2', [customerPhone, customer_id]);
  }
} else {
  const insertCustomer = await pool.query(
    'INSERT INTO customers (name, address, phone) VALUES ($1, $2, $3) RETURNING id',
    [customer_name, address, customerPhone || null]
  );
  customer_id = insertCustomer.rows[0].id;
}
    // Lưu hóa đơn
    const result = await pool.query(
      `INSERT INTO invoices (invoice_number, customer_id, items, total_amount, status, created_at, seller)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [invoiceNumber, customer_id, JSON.stringify(items), total_amount, status || 'pending', date, seller]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
module.exports = router;