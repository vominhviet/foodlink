const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Hàm tìm hoặc tạo khách hàng
async function findOrCreateCustomer({ customer_id, customer_name, customer_address, customer_phone }) {
  if (customer_id) {
    // Nếu truyền sẵn customer_id thì kiểm tra tồn tại
    const check = await pool.query("SELECT id FROM customers WHERE id = $1", [customer_id]);
    if (check.rows.length === 0) throw new Error("Khách hàng không tồn tại");
    return customer_id;
  }

  if (!customer_name || !customer_address) {
    throw new Error("Tên và địa chỉ khách hàng là bắt buộc");
  }

  const customerRes = await pool.query(
    `SELECT id FROM customers WHERE name = $1 AND address = $2 LIMIT 1`,
    [customer_name, customer_address]
  );

  if (customerRes.rows.length > 0) {
    const id = customerRes.rows[0].id;
    // Nếu có phone mới thì update
    if (customer_phone) {
      await pool.query("UPDATE customers SET phone = $1 WHERE id = $2", [customer_phone, id]);
    }
    return id;
  }

  // Tạo khách hàng mới
  const insertRes = await pool.query(
    `INSERT INTO customers (name, address, phone) VALUES ($1, $2, $3) RETURNING id`,
    [customer_name, customer_address, customer_phone || null]
  );
  return insertRes.rows[0].id;
}

// ✅ Lấy tất cả invoices
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, 
             c.name AS customer_name, 
             c.address AS customer_address, 
             c.phone AS customer_phone
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách hóa đơn" });
  }
});

// ✅ Lấy chi tiết 1 invoice
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT i.*, 
             c.name AS customer_name, 
             c.address AS customer_address, 
             c.phone AS customer_phone
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết hóa đơn" });
  }
});

// ✅ Tạo invoice mới
router.post("/", async (req, res) => {
  console.log("POST /invoices body:", req.body);
  try {
    const { date, seller, customer_id, customer_name, customer_address, customer_phone, items, total_amount, status } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Hóa đơn phải có ít nhất một sản phẩm" });
    }

    const invoiceNumber = "INV-" + Date.now();
    const cid = await findOrCreateCustomer({ customer_id, customer_name, customer_address, customer_phone });

    const result = await pool.query(
      `INSERT INTO invoices (invoice_number, customer_id, items, total_amount, status, created_at, seller)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        invoiceNumber,
        cid,
        JSON.stringify(items),
        total_amount || 0,
        status || "pending",
        date || new Date(),
        seller || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: error.message || "Lỗi server khi tạo hóa đơn" });
  }
});

// ✅ Cập nhật invoice
router.put("/:id", async (req, res) => {
  console.log("PUT /invoices/:id body:", req.body);
  try {
    const { id } = req.params;
    const { seller, customer_id, customer_name, customer_address, customer_phone, items, total_amount, status } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Thiếu ID hóa đơn" });
    }

    const cid = await findOrCreateCustomer({ customer_id, customer_name, customer_address, customer_phone });

    await pool.query(
      `UPDATE invoices 
       SET customer_id = $1, items = $2, total_amount = $3, status = $4, seller = $5, updated_at = NOW()
       WHERE id = $6`,
      [
        cid,
        JSON.stringify(items || []),
        total_amount || 0,
        status || "pending",
        seller || null,
        id,
      ]
    );

    res.json({ success: true, message: "Cập nhật hóa đơn thành công" });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ message: error.message || "Lỗi server khi cập nhật hóa đơn" });
  }
});

// ✅ Xóa invoice
router.delete("/:id", async (req, res) => {
  console.log("DELETE /invoices/:id param:", req.params);
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Thiếu ID hóa đơn" });
    }

    await pool.query("DELETE FROM invoices WHERE id = $1", [id]);
    res.json({ success: true, message: "Xóa hóa đơn thành công" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ message: "Lỗi server khi xóa hóa đơn" });
  }
});

module.exports = router;
