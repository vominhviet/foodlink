const pool = require('../config/db');

async function initDatabase() {
  try {
    console.log('🔄 Initializing database tables...');

    // Bảng người dùng
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

    // Bảng khách hàng
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

    // Bảng sản phẩm
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        unit VARCHAR(50),
        price DECIMAL(12,2) DEFAULT 0,
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bảng hóa đơn
    await pool.query(`
  CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    user_id INTEGER REFERENCES users(id),
    seller VARCHAR(100),
    items JSONB NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATE DEFAULT CURRENT_DATE,
    updated_at DATE DEFAULT CURRENT_DATE
  )
`);


    // Trigger updated_at cho invoices
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_invoices_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'set_updated_at'
          AND tgrelid = 'invoices'::regclass
        ) THEN
          CREATE TRIGGER set_updated_at
          BEFORE UPDATE ON invoices
          FOR EACH ROW
          EXECUTE PROCEDURE update_invoices_updated_at();
        END IF;
      END$$;
    `);

    console.log('✅ Core database tables created successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

module.exports = initDatabase;
