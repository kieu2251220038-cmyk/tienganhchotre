const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kids_english_db'
  });

  const [courses] = await conn.query('SELECT * FROM courses');
  console.log('COURSES count:', courses.length);
  console.log('COURSES:', courses);

  const [topics] = await conn.query('SELECT id, course_id, name FROM topics');
  console.log('TOPICS count:', topics.length);
  console.log('TOPICS:', topics);

  const [lessons] = await conn.query('SELECT COUNT(*) as count FROM lessons');
  console.log('LESSONS count:', lessons[0].count);

  const [vocabs] = await conn.query('SELECT COUNT(*) as count FROM vocabularies');
  console.log('VOCABULARIES count:', vocabs[0].count);

  await conn.end();
}

check().catch(console.error);
