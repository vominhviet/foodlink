const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
   
    // Lấy tổng số Tạo đơn hôm nay
    const today = new Date().toISOString().split('T')[0];
    const invoicesResult = await pool.query(
      'SELECT COUNT(*) FROM invoices WHERE DATE(created_at) = $1',
      [today]
    );
    const todayInvoices = parseInt(invoicesResult.rows[0].count);
    
    // Lấy tổng doanh thu
    const revenueResult = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM invoices WHERE status = $1',
      ['completed']
    );
    const revenue = parseFloat(revenueResult.rows[0].total_revenue);
    
    res.json({
  
      todayInvoices,
      revenue,
      growth: 15 // Có thể tính toán dựa trên dữ liệu thực tế
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;