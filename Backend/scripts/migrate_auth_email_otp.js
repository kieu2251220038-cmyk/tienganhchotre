const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kids_english_db'
  });

  try {
    const [userColumns] = await connection.query('DESCRIBE users');
    const columnNames = userColumns.map((column) => column.Field);

    if (!columnNames.includes('email')) {
      await connection.query('ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER username');
      console.log('Added users.email');
    }

    const [indexes] = await connection.query('SHOW INDEX FROM users');
    const hasEmailUniqueIndex = indexes.some((index) => index.Key_name === 'uq_users_email');
    if (!hasEmailUniqueIndex) {
      await connection.query('ALTER TABLE users ADD UNIQUE KEY uq_users_email (email)');
      console.log('Added unique index uq_users_email');
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        otp_hash CHAR(64) NOT NULL,
        attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_password_reset_otps_user (user_id),
        INDEX idx_password_reset_otps_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Verified password_reset_otps');
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error('Auth email/OTP migration failed:', error);
  process.exitCode = 1;
});
