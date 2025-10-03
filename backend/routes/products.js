const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Lấy danh sách sản phẩm
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM products 
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lấy sản phẩm theo ID
router.get('/products/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM products WHERE id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lấy lịch sử giao dịch tồn kho
router.get('/stock/transactions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        st.*,
        p.name as product_name,
        p.unit as product_unit
      FROM stock_transactions st
      LEFT JOIN products p ON st.product_id = p.id
      ORDER BY st.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Thực hiện giao dịch tồn kho (nhập/xuất)
router.post('/stock/transaction', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { product_id, type, quantity, note } = req.body;
    
    // Validate input
    if (!product_id || !type || !quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    if (!['import', 'export', 'adjust'].includes(type)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Loại giao dịch không hợp lệ' });
    }

    // Kiểm tra sản phẩm tồn tại
    const productResult = await client.query(
      'SELECT * FROM products WHERE id = $1',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    const product = productResult.rows[0];
    let newStock = product.stock;

    // Tính toán số lượng mới
    if (type === 'import') {
      newStock += parseInt(quantity);
    } else if (type === 'export') {
      if (product.stock < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Số lượng tồn kho không đủ. Hiện có: ${product.stock}, yêu cầu: ${quantity}` 
        });
      }
      newStock -= parseInt(quantity);
    }

    // Cập nhật tồn kho
    await client.query(
      'UPDATE products SET stock = $1, created_at = NOW() WHERE id = $2',
      [newStock, product_id]
    );

    // Lưu lịch sử giao dịch
    await client.query(
      `INSERT INTO stock_transactions (product_id, type, quantity, note, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [product_id, type, quantity, note || `${type === 'import' ? 'Nhập' : 'Xuất'} kho`]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Giao dịch thành công',
      product_id,
      product_name: product.name,
      type,
      quantity,
      new_stock: newStock
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in stock transaction:', error);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  } finally {
    client.release();
  }
});

module.exports = router;