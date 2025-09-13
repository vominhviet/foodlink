const pool = require('../config/db');

async function initDatabase() {
  // Đảm bảo bảng invoices có trường seller và kiểu created_at đúng
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS seller VARCHAR(100);`);
  await pool.query(`ALTER TABLE invoices ALTER COLUMN created_at TYPE TIMESTAMP USING created_at::timestamp;`);
  try {
    console.log('🔄 Initializing database tables...');

    // Tạo bảng users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE,
        full_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng customers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng hóa đơn invoices
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        user_id INTEGER REFERENCES users(id),
        items JSONB NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng history lich sử đơn hàng
    await pool.query(`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action_type VARCHAR(50) NOT NULL,
        description TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Tạo bảng đơn nhập kho
    await pool.query(`
      CREATE TABLE IF NOT EXISTS import_orders (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS import_order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES import_orders(id),
        name VARCHAR(255),
        unit VARCHAR(50),
        quantity INTEGER,
        price INTEGER,
        total INTEGER
      );
    `);
    // Tạo bảng expenses quản lí chi phí
    await pool.query(`
  CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(100),
    amount INTEGER,
    note TEXT,
    date DATE DEFAULT CURRENT_DATE
  );
`);

    console.log('✅ Database tables created successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

module.exports = initDatabase;