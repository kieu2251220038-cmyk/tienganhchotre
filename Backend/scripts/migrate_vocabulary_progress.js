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
    await connection.beginTransaction();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_vocabulary_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        vocabulary_id INT NOT NULL,
        status ENUM('LEARNED', 'REVIEWING') NOT NULL DEFAULT 'LEARNED',
        review_count INT NOT NULL DEFAULT 1,
        first_learned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_reviewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_vocabulary (user_id, vocabulary_id),
        INDEX idx_uvp_user_status (user_id, status),
        CONSTRAINT fk_uvp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_uvp_vocabulary FOREIGN KEY (vocabulary_id) REFERENCES vocabularies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Backfill vocabulary learned from completed Flashcard lessons.
    await connection.query(`
      INSERT INTO user_vocabulary_progress
        (user_id, vocabulary_id, status, review_count, first_learned_at, last_reviewed_at)
      SELECT DISTINCT up.user_id, v.id, 'LEARNED', 1, COALESCE(up.completed_at, NOW()), COALESCE(up.completed_at, NOW())
      FROM user_progress up
      INNER JOIN lessons l ON l.id = up.lesson_id AND l.lesson_type = 'FLASHCARD'
      INNER JOIN vocabularies v ON v.topic_id = l.topic_id
      LEFT JOIN user_vocabulary_progress existing
        ON existing.user_id = up.user_id AND existing.vocabulary_id = v.id
      WHERE up.status = 'COMPLETED' AND existing.id IS NULL
    `);

    await connection.commit();
    const [rows] = await connection.query('SELECT COUNT(*) AS count FROM user_vocabulary_progress');
    console.log(`Đã tạo bảng user_vocabulary_progress và ghi nhận ${rows[0].count} từ vựng từ tiến độ Flashcard cũ.`);
  } catch (error) {
    await connection.rollback();
    console.error('Vocabulary progress migration failed:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

migrate();
