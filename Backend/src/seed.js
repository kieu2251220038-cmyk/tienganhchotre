const mysql = require('mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kids_english_db'
  });

  console.log('Connected to MySQL. Seeding data...');

  // 1. Media Assets
  await conn.query('DELETE FROM answers');
  await conn.query('DELETE FROM questions');
  await conn.query('DELETE FROM media_assets');

  const mediaList = [
    { id: 1, title: 'Dog Picture', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop' },
    { id: 2, title: 'Cat Picture', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop' },
    { id: 3, title: 'Bird Picture', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=500&auto=format&fit=crop' },
    { id: 4, title: 'Elephant Picture', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=500&auto=format&fit=crop' },
    { id: 5, title: 'Apple Picture', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop' },
    { id: 6, title: 'Banana Picture', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop' },
    { id: 7, title: 'Red Color', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&auto=format&fit=crop' },
    { id: 8, title: 'Blue Color', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop' },
    { id: 9, title: 'Animals Song Video', type: 'VIDEO', url: 'https://www.youtube.com/embed/t99ULJjCsaM' },
    { id: 10, title: 'Colors Song Video', type: 'VIDEO', url: 'https://www.youtube.com/embed/zxIpA5nF_LY' }
  ];

  for (const m of mediaList) {
    await conn.query('INSERT INTO media_assets (id, title, media_type, file_url) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE file_url = ?',
      [m.id, m.title, m.type, m.url, m.url]);
  }

  // 2. Vocabularies update with images
  await conn.query('UPDATE vocabularies SET image_id = 1, phonetic = "/dɒɡ/", meaning_vi = "Con chó" WHERE word = "Dog"');
  await conn.query('UPDATE vocabularies SET image_id = 2, phonetic = "/kæt/", meaning_vi = "Con mèo" WHERE word = "Cat"');
  await conn.query('UPDATE vocabularies SET image_id = 3, phonetic = "/bɜːd/", meaning_vi = "Con chim" WHERE word = "Bird"');

  // Insert more vocabularies if needed
  const [extraVocab] = await conn.query('SELECT id FROM vocabularies WHERE word = "Elephant"');
  if (extraVocab.length === 0) {
    await conn.query('INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic, image_id) VALUES (1, "Elephant", "Con voi", "/ˈel.ɪ.fənt/", 4)');
    await conn.query('INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic, image_id) VALUES (2, "Red", "Màu đỏ", "/red/", 7)');
    await conn.query('INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic, image_id) VALUES (2, "Blue", "Màu xanh dương", "/bluː/", 8)');
  }

  // 3. Ensure lessons for all types (FLASHCARD, VIDEO, QUIZ, GAME, SPEAKING)
  const [lessons] = await conn.query('SELECT id, lesson_type FROM lessons WHERE topic_id = 1');
  let quizLessonId = lessons.find(l => l.lesson_type === 'QUIZ')?.id;
  let gameLessonId = lessons.find(l => l.lesson_type === 'GAME')?.id;

  if (!quizLessonId) {
    const [res] = await conn.query('INSERT INTO lessons (topic_id, title, lesson_type, difficulty, sort_order, status) VALUES (1, "Quiz: Đố vui con vật", "QUIZ", 1, 3, "PUBLISHED")');
    quizLessonId = res.insertId;
  }
  if (!gameLessonId) {
    const [res] = await conn.query('INSERT INTO lessons (topic_id, title, lesson_type, difficulty, sort_order, status) VALUES (1, "Mini Game: Ghép hình động vật", "GAME", 1, 4, "PUBLISHED")');
    gameLessonId = res.insertId;
  }

  // 4. Questions & Answers for Quiz
  // Question 1: Where is the cat?
  const [q1] = await conn.query(
    'INSERT INTO questions (lesson_id, question_type, question_text, media_id, points) VALUES (?, "MULTIPLE_CHOICE", "Where is the Cat? 🐱", 2, 10)',
    [quizLessonId]
  );
  await conn.query('INSERT INTO answers (question_id, answer_text, media_id, is_correct) VALUES (?, "Cat", 2, 1)', [q1.insertId]);
  await conn.query('INSERT INTO answers (question_id, answer_text, media_id, is_correct) VALUES (?, "Dog", 1, 0)', [q1.insertId]);
  await conn.query('INSERT INTO answers (question_id, answer_text, media_id, is_correct) VALUES (?, "Bird", 3, 0)', [q1.insertId]);
  await conn.query('INSERT INTO answers (question_id, answer_text, media_id, is_correct) VALUES (?, "Elephant", 4, 0)', [q1.insertId]);

  // Question 2: Which animal says 'Woof Woof'?
  const [q2] = await conn.query(
    'INSERT INTO questions (lesson_id, question_type, question_text, media_id, points) VALUES (?, "MULTIPLE_CHOICE", "Which animal says \'Woof Woof\'? 🐶", 1, 10)',
    [quizLessonId]
  );
  await conn.query('INSERT INTO answers (question_id, answer_text, media_id, is_correct) VALUES (?, "Dog", 1, 1)', [q2.insertId]);
  await conn.query('INSERT INTO answers (question_id, answer_text, media_id, is_correct) VALUES (?, "Cat", 2, 0)', [q2.insertId]);
  await conn.query('INSERT INTO answers (question_id, answer_text, media_id, is_correct) VALUES (?, "Bird", 3, 0)', [q2.insertId]);
  await conn.query('INSERT INTO answers (question_id, answer_text, media_id, is_correct) VALUES (?, "Elephant", 4, 0)', [q2.insertId]);

  // Question 3: Speaking question
  await conn.query(
    'INSERT INTO questions (lesson_id, question_type, question_text, media_id, points) VALUES (?, "SPEAKING", "Say: \'Hello Dog!\' 🐶", 1, 15)',
    [quizLessonId]
  );

  // 5. User rewards & badges for user 6
  await conn.query(`
    INSERT INTO user_rewards (user_id, total_stars, total_coins, current_streak, last_study_date)
    VALUES (6, 120, 350, 5, CURDATE())
    ON DUPLICATE KEY UPDATE total_stars = 120, total_coins = 350, current_streak = 5
  `);

  await conn.query('DELETE FROM user_badges WHERE user_id = 6');
  await conn.query(`
    INSERT INTO user_badges (user_id, badge_name, earned_at) VALUES
    (6, '🌟 Tân Binh Xuất Sắc', NOW()),
    (6, '🔥 Chuỗi 5 Ngày Học Tập', NOW()),
    (6, '🎯 Siêu Nhân Trắc Nghiệm', NOW()),
    (6, '🦜 Bậc Thầy Phát Âm', NOW())
  `);

  // 6. User progress
  await conn.query('DELETE FROM user_progress WHERE user_id = 6');
  await conn.query(`
    INSERT INTO user_progress (user_id, lesson_id, status, score, completed_at) VALUES
    (6, 1, 'COMPLETED', 100, NOW())
  `);

  console.log('✅ Seed completed successfully with realistic data!');
  await conn.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
