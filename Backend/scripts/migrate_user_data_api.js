const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kids_english_db'
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INT NOT NULL PRIMARY KEY,
        onboarding_completed TINYINT(1) NOT NULL DEFAULT 0,
        unlocked_age TINYINT UNSIGNED NOT NULL DEFAULT 3,
        avatar VARCHAR(32) NOT NULL DEFAULT '👧',
        sticker VARCHAR(32) NOT NULL DEFAULT '🦉',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_preferences_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS speaking_summaries (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        lesson_id INT NOT NULL,
        topic_id INT NOT NULL,
        completed_at DATETIME NOT NULL,
        total_words INT NOT NULL DEFAULT 0,
        average_score DECIMAL(5,2) NOT NULL DEFAULT 0,
        correct_count INT NOT NULL DEFAULT 0,
        incorrect_count INT NOT NULL DEFAULT 0,
        attempts JSON NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_speaking_summaries_user_latest (user_id, completed_at, id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_chest_claims (
        user_id INT NOT NULL,
        age_group TINYINT UNSIGNED NOT NULL,
        reward_stars INT NOT NULL DEFAULT 10,
        reward_coins INT NOT NULL DEFAULT 100,
        claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, age_group),
        INDEX idx_user_chest_claims_user (user_id),
        INDEX idx_user_chest_claims_age (age_group)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      INSERT INTO user_preferences (user_id, unlocked_age)
      SELECT id, CASE
        WHEN CAST(age_group AS UNSIGNED) BETWEEN 3 AND 8 THEN CAST(age_group AS UNSIGNED)
        ELSE 3
      END
      FROM users
      ON DUPLICATE KEY UPDATE user_id = user_id
    `);

    console.log('Đã tạo bảng user_preferences, speaking_summaries và user_chest_claims.');
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error('User data migration failed:', error);
  process.exitCode = 1;
});
