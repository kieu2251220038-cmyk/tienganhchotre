const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kids_english_db'
  });

  try {
    const [columns] = await connection.query("SHOW COLUMNS FROM mini_games LIKE 'item_count'");
    if (!columns.length) {
      await connection.query(
        'ALTER TABLE mini_games ADD COLUMN item_count TINYINT UNSIGNED NOT NULL DEFAULT 4 AFTER points'
      );
      console.log('Added mini_games.item_count with default 4.');
    } else {
      console.log('mini_games.item_count already exists.');
    }
  } finally {
    await connection.end();
  }
})().catch((error) => {
  console.error('Could not migrate mini_games.item_count:', error);
  process.exitCode = 1;
});
