const express = require('express');
const app = express();
const pool = require('./config/db');
const cors = require('cors');
const initDatabase = require('./database/init');

require('dotenv').config();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

initDatabase();

// routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const invoicesRoutes = require('./routes/invoices');
app.use('/api/invoices', invoicesRoutes);

const historyRoutes = require('./routes/history');
app.use('/api/history', historyRoutes);

const reportsRoutes = require('./routes/reports');
app.use('/api/reports', reportsRoutes);

const expensesRoutes = require('./routes/expenses');
app.use('/api/expenses', expensesRoutes);

// THÊM MỚI: routes quản lý sản phẩm và tồn kho
const productsRoutes = require('./routes/products');
app.use('/api', productsRoutes);

// THÊM MỚI: routes nhập kho
const importRoutes = require('./routes/import');
app.use('/api', importRoutes);

// test api
app.get("/api/test", (req, res) => {
  res.json({ message: "API hoạt động bình thường 🚀" });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    message: "Server is running correctly" 
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});