const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Makes the speaking step part of every published topic for ages 3-8.
 * The script is safe to run more than once: existing SPEAKING lessons are
 * only published, while missing ones are inserted at position 2.
 */
async function migrateSpeakingLessons() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kids_english_db'
  });

  let added = 0;
  let alreadyPresent = 0;

  try {
    await connection.beginTransaction();

    const [topics] = await connection.query(`
      SELECT t.id AS topic_id, t.name AS topic_name, c.age_group
      FROM topics t
      JOIN courses c ON c.id = t.course_id
      WHERE t.status = 'PUBLISHED'
        AND c.age_group IN ('3', '4', '5', '6', '7', '8')
      ORDER BY CAST(c.age_group AS UNSIGNED), t.sort_order, t.id
    `);

    for (const topic of topics) {
      const age = Number(topic.age_group);
      const [speakingLessons] = await connection.query(
        `SELECT id
         FROM lessons
         WHERE topic_id = ? AND lesson_type = 'SPEAKING'
         ORDER BY sort_order, id
         LIMIT 1`,
        [topic.topic_id]
      );

      if (speakingLessons.length > 0) {
        await connection.query(
          `UPDATE lessons
           SET status = 'PUBLISHED', approval_status = 'APPROVED', target_age = ?
           WHERE id = ?`,
          [age, speakingLessons[0].id]
        );
        alreadyPresent += 1;
        continue;
      }

      // Move existing activities after the learning/voice steps. The two-step
      // offset prevents collisions if a database later adds a unique order.
      await connection.query(
        `UPDATE lessons
         SET sort_order = sort_order + 100
         WHERE topic_id = ? AND sort_order >= 2`,
        [topic.topic_id]
      );
      await connection.query(
        `UPDATE lessons
         SET sort_order = sort_order - 99
         WHERE topic_id = ? AND sort_order >= 102`,
        [topic.topic_id]
      );

      await connection.query(
        `INSERT INTO lessons
          (topic_id, title, lesson_type, difficulty, sort_order, status,
           approval_status, target_age, learning_outcomes)
         VALUES (?, ?, 'SPEAKING', ?, 2, 'PUBLISHED', 'APPROVED', ?, ?)`,
        [
          topic.topic_id,
          `AI Speaking Practice: ${topic.topic_name}`,
          Math.max(1, Math.min(5, Math.ceil(age / 2))),
          age,
          `Practice pronunciation and speaking for ${topic.topic_name}.`
        ]
      );
      added += 1;
    }

    await connection.commit();
    console.log(`Speaking migration completed: added ${added}, already available ${alreadyPresent}.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

migrateSpeakingLessons().catch((error) => {
  console.error('Speaking migration failed:', error.message);
  process.exitCode = 1;
});
