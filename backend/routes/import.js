const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// API nhập kho với chức năng thêm, sửa, xóa
router.post('/import', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { items, deleted_items = [] } = req.body;
    
    // Validate input
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Danh sách sản phẩm không hợp lệ' });
    }

    const results = [];
    const errors = [];
    
    // Xử lý xóa sản phẩm trước
    for (const deletedItem of deleted_items) {
      if (deletedItem.product_id) {
        try {
          // Kiểm tra sản phẩm có tồn tại không
          const checkProduct = await client.query(
            'SELECT * FROM products WHERE id = $1',
            [deletedItem.product_id]
          );
          
          if (checkProduct.rows.length === 0) {
            errors.push(`Không tìm thấy sản phẩm với ID: ${deletedItem.product_id} để xóa`);
            continue;
          }
          
          // Xóa sản phẩm
          await client.query(
            'DELETE FROM products WHERE id = $1',
            [deletedItem.product_id]
          );
          
          // Ghi log xóa sản phẩm
          await client.query(
            'INSERT INTO stock_transactions (product_id, type, quantity, note, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [deletedItem.product_id, 'adjust', 0, 'Xóa sản phẩm khỏi hệ thống']
          );
          
          console.log(`Đã xóa sản phẩm ID: ${deletedItem.product_id}`);
        } catch (deleteError) {
          errors.push(`Lỗi khi xóa sản phẩm ${deletedItem.product_id}: ${deleteError.message}`);
        }
      }
    }
    
    // Xử lý thêm/sửa sản phẩm
    for (const item of items) {
      try {
        // Validate từng item
        if (!item.name || !item.unit) {
          errors.push(`Thiếu tên hoặc đơn vị cho sản phẩm: ${item.name || 'N/A'}`);
          continue;
        }

        if (item.quantity && item.quantity < 0) {
          errors.push(`Số lượng không hợp lệ cho sản phẩm: ${item.name}`);
          continue;
        }

        if (item.price && item.price < 0) {
          errors.push(`Giá không hợp lệ cho sản phẩm: ${item.name}`);
          continue;
        }

        const quantity = item.quantity || 0;
        const price = item.price || 0;

        // Tìm sản phẩm đã tồn tại (case-insensitive)
        const findProductQuery = `
          SELECT * FROM products 
          WHERE LOWER(name) = LOWER($1) AND LOWER(unit) = LOWER($2)
        `;
        const productResult = await client.query(findProductQuery, [
          item.name.trim(), 
          item.unit.trim()
        ]);
        
        let productId;
        let newStock;
        let action = '';

        if (productResult.rows.length > 0) {
          // Cập nhật sản phẩm đã tồn tại
          const product = productResult.rows[0];
          productId = product.id;
          
          if (item.operation === 'update' && item.original_name && item.original_unit) {
            // Cập nhật thông tin sản phẩm (tên, đơn vị thay đổi)
            const updateProductQuery = `
              UPDATE products 
              SET name = $1, unit = $2, price = $3, stock = $4, created_at = NOW()
              WHERE id = $5
              RETURNING *
            `;
            await client.query(updateProductQuery, [
              item.name.trim(),
              item.unit.trim(),
              price,
              quantity,
              productId
            ]);
            action = 'updated';
          } else {
            // Nhập thêm số lượng vào sản phẩm hiện có
            newStock = parseInt(product.stock) + parseInt(quantity);
            const updateProductQuery = `
              UPDATE products 
              SET stock = $1, price = $2, created_at = NOW()
              WHERE id = $3
              RETURNING *
            `;
            await client.query(updateProductQuery, [
              newStock, 
              price, 
              productId
            ]);
            action = 'imported';
          }
        } else {
          // Tạo sản phẩm mới
          const insertProductQuery = `
            INSERT INTO products (name, unit, price, stock, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *
          `;
          const newProduct = await client.query(insertProductQuery, [
            item.name.trim(),
            item.unit.trim(),
            price,
            quantity
          ]);
          
          productId = newProduct.rows[0].id;
          newStock = quantity;
          action = 'created';
        }
        
        // Lưu lịch sử giao dịch nhập kho (chỉ khi có số lượng nhập)
        if (quantity > 0) {
          const insertTransactionQuery = `
            INSERT INTO stock_transactions (product_id, type, quantity, note, created_at)
            VALUES ($1, $2, $3, $4, NOW())
          `;
          await client.query(insertTransactionQuery, [
            productId,
            'import',
            quantity,
            `Nhập kho - Giá: ${parseInt(price).toLocaleString('vi-VN')}₫ - ${action === 'created' ? 'Sản phẩm mới' : 'Cập nhật sản phẩm'}`
          ]);
        }
        
        results.push({
          product_id: productId,
          name: item.name.trim(),
          unit: item.unit.trim(),
          quantity: quantity,
          new_stock: newStock || quantity,
          price: price,
          action: action
        });
        
      } catch (itemError) {
        errors.push(`Lỗi xử lý sản phẩm ${item.name}: ${itemError.message}`);
      }
    }
    
    await client.query('COMMIT');
    
    // Trả về kết quả tổng hợp
    const response = { 
      message: 'Xử lý sản phẩm thành công', 
      processed_items: results,
      total_processed: results.length,
      errors: errors.length > 0 ? errors : undefined
    };
    
    if (errors.length > 0) {
      response.message = `Xử lý hoàn tất với ${errors.length} lỗi`;
    }
    
    res.status(201).json(response);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi xử lý sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi server khi xử lý sản phẩm: ' + error.message });
  } finally {
    client.release();
  }
});

// API riêng để xóa sản phẩm
router.delete('/products/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const productId = req.params.id;
    
    // Kiểm tra sản phẩm có tồn tại không
    const productResult = await client.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    
    const product = productResult.rows[0];
    
    // Kiểm tra xem sản phẩm có trong hóa đơn nào không
    const invoiceCheck = await client.query(
      `SELECT COUNT(*) as count FROM invoices 
       WHERE items @> '[{"product_id": ${productId}}]' OR items @> '[{"name": "${product.name}"}]'`
    );
    
    if (parseInt(invoiceCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Không thể xóa sản phẩm đã có trong hóa đơn' 
      });
    }
    
    // Xóa sản phẩm
    await client.query('DELETE FROM products WHERE id = $1', [productId]);
    
    // Ghi log xóa sản phẩm
    await client.query(
      'INSERT INTO stock_transactions (product_id, type, quantity, note, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [productId, 'adjust', 0, `Xóa sản phẩm: ${product.name} - ${product.unit}`]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Xóa sản phẩm thành công',
      deleted_product: {
        id: productId,
        name: product.name,
        unit: product.unit
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi xóa sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa sản phẩm: ' + error.message });
  } finally {
    client.release();
  }
});

// API cập nhật sản phẩm
router.put('/products/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const productId = req.params.id;
    const { name, unit, price, stock } = req.body;
    
    // Kiểm tra sản phẩm có tồn tại không
    const productResult = await client.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    
    const oldProduct = productResult.rows[0];
    
    // Cập nhật sản phẩm
    const updateResult = await client.query(
      `UPDATE products 
       SET name = $1, unit = $2, price = $3, stock = $4, created_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, unit, price, stock, productId]
    );
    
    // Ghi log thay đổi
    let changes = [];
    if (oldProduct.name !== name) changes.push(`tên: ${oldProduct.name} → ${name}`);
    if (oldProduct.unit !== unit) changes.push(`đơn vị: ${oldProduct.unit} → ${unit}`);
    if (oldProduct.price != price) changes.push(`giá: ${oldProduct.price} → ${price}`);
    if (oldProduct.stock != stock) changes.push(`tồn kho: ${oldProduct.stock} → ${stock}`);
    
    if (changes.length > 0) {
      await client.query(
        'INSERT INTO stock_transactions (product_id, type, quantity, note, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [productId, 'adjust', 0, `Cập nhật sản phẩm: ${changes.join(', ')}`]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Cập nhật sản phẩm thành công',
      product: updateResult.rows[0],
      changes: changes
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi cập nhật sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật sản phẩm: ' + error.message });
  } finally {
    client.release();
  }
});

module.exports = router;