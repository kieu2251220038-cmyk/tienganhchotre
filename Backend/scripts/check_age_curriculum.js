const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kids_english_db'
  });

  const [topics] = await connection.query(`
    SELECT c.age_group, t.name,
           COUNT(DISTINCT v.id) AS vocab_count,
           COUNT(DISTINCT l.id) AS lesson_count,
           COUNT(DISTINCT mg.id) AS game_count
    FROM courses c
    LEFT JOIN topics t ON t.course_id = c.id
    LEFT JOIN vocabularies v ON v.topic_id = t.id
    LEFT JOIN lessons l ON l.topic_id = t.id
    LEFT JOIN mini_games mg ON mg.topic_id = t.id AND mg.is_active = 1
    WHERE c.age_group BETWEEN '3' AND '8'
    GROUP BY c.id, t.id
    ORDER BY CAST(c.age_group AS UNSIGNED), t.sort_order
  `);
  console.table(topics);

  const [games] = await connection.query(`
    SELECT c.age_group, t.name AS topic, mg.name AS game, mg.game_type,
           mg.is_active, l.status, l.approval_status
    FROM mini_games mg
    INNER JOIN topics t ON t.id = mg.topic_id
    INNER JOIN courses c ON c.id = t.course_id
    LEFT JOIN lessons l ON l.mini_game_id = mg.id
    WHERE c.age_group BETWEEN '3' AND '8'
    ORDER BY CAST(c.age_group AS UNSIGNED), t.sort_order, mg.id
  `);
  console.table(games);

  await connection.end();
}

check().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
