const mysql = require('mysql2/promise');

async function ensureExpertAccount() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kids_english_db'
  });

  try {
    await connection.query(
      `INSERT INTO users (username, password_hash, display_name, role, age_group, daily_goal_minutes)
       VALUES (?, ?, ?, 'EXPERT', '6', 15)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         display_name = VALUES(display_name),
         role = 'EXPERT',
         age_group = '6',
         daily_goal_minutes = 15`,
      ['chuyengia_minhanh', '123456', 'TS. Minh Anh (Chuyên Gia Giáo Dục)']
    );

    const [rows] = await connection.query(
      'SELECT id, username, display_name, role FROM users WHERE username = ?',
      ['chuyengia_minhanh']
    );
    console.log(JSON.stringify(rows));
  } finally {
    await connection.end();
  }
}

ensureExpertAccount().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
