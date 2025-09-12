const express = require('express');
const app = express();
const pool = require('./config/db');
const cors = require('cors');
const initDatabase = require('./database/init'); // create database tự động

require('dotenv').config(); // Load biến môi trường

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// middleware
app.use(express.json());

// Khởi tạo database khi server start
initDatabase();

// routes
const authRoutes = require('./routes/auth');

const invoicesRoutes = require('./routes/invoices');
const historyRoutes = require('./routes/history');
const reportsRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);

app.use('/api/invoices', invoicesRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/reports', reportsRoutes);

// test api
app.get("/api/test", (req, res) => {
  res.json({ message: "API hoạt động bình thường 🚀" });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    message: "Server is running correctly" 
  });
});

// Fallback for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});