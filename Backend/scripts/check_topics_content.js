const mysql = require('mysql2/promise');

async function testLessons() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kids_english_db'
  });

  const [topics] = await conn.query('SELECT t.id, t.course_id, t.name, COUNT(l.id) as lesson_count FROM topics t LEFT JOIN lessons l ON t.id = l.topic_id GROUP BY t.id');
  console.log('TOPICS WITH LESSON COUNT:');
  console.table(topics);

  const [vocabs] = await conn.query('SELECT t.id, t.name, COUNT(v.id) as vocab_count FROM topics t LEFT JOIN vocabularies v ON t.id = v.topic_id GROUP BY t.id');
  console.log('TOPICS WITH VOCAB COUNT:');
  console.table(vocabs);

  await conn.end();
}

testLessons().catch(console.error);
