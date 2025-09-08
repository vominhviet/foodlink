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

    // Tạo bảng products
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // Tạo bảng invoices
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

    // Tạo bảng history
    await pool.query(`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action_type VARCHAR(50) NOT NULL,
        description TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables created successfully!');

    // Chèn dữ liệu mẫu vào products
    await pool.query(`
      INSERT INTO products (name, price, stock, description) 
      VALUES 
      ('iPhone 15 Pro', 25000000, 50, 'Điện thoại iPhone 15 Pro 128GB'),
      ('Samsung Galaxy S23', 18000000, 30, 'Điện thoại Samsung Galaxy S23'),
      ('MacBook Pro M2', 42000000, 20, 'Laptop MacBook Pro 14 inch M2')
      ON CONFLICT DO NOTHING
    `);

    // Chèn dữ liệu mẫu vào customers
    await pool.query(`
      INSERT INTO customers (name, phone, email, address) 
      VALUES 
      ('Nguyễn Văn A', '0912345678', 'nguyenvana@email.com', 'Hà Nội'),
      ('Trần Thị B', '0987654321', 'tranthib@email.com', 'TP.HCM'),
      ('Lê Văn C', '0909123456', 'levanc@email.com', 'Đà Nẵng')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Sample data inserted successfully!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

module.exports = initDatabase;