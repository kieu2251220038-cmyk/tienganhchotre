const path = require('path');
const { spawnSync } = require('child_process');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kids_english_db'
};

const tables = [
  'answers',
  'questions',
  'user_progress',
  'user_badges',
  'user_rewards',
  'parent_children',
  'vocabularies',
  'lessons',
  'mini_games',
  'game_configs',
  'mini_game_configs',
  'topics',
  'courses',
  'media_assets',
  'users'
];

async function resetDatabase(connection) {
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE \`${table}\``);
    }
  } finally {
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

async function seedRequiredData(connection) {
  const [adminResult] = await connection.query(
    `INSERT INTO users (username, password_hash, display_name, role, age_group, daily_goal_minutes)
     VALUES ('admin', '123456', 'Quản trị viên', 'ADMIN', '3', 15)`
  );

  const [expertResult] = await connection.query(
    `INSERT INTO users (username, password_hash, display_name, role, age_group, daily_goal_minutes)
     VALUES ('chuyengia_minhanh', '123456', 'TS. Minh Anh (Chuyên Gia Giáo Dục)', 'EXPERT', '6', 15)`
  );

  const [parentResult] = await connection.query(
    `INSERT INTO users (username, password_hash, display_name, role, age_group, daily_goal_minutes)
     VALUES ('phuhuynh_huong', '123456', 'Phụ huynh', 'PARENT', '3', 15)`
  );

  const [childResult] = await connection.query(
    `INSERT INTO users (username, password_hash, display_name, role, age_group, parent_id, daily_goal_minutes)
     VALUES ('be3_alphabet', '123456', 'Bé Alphabet', 'USER', '3', ?, 10)`,
    [parentResult.insertId]
  );

  await connection.query(
    'INSERT INTO parent_children (parent_id, child_id, relationship) VALUES (?, ?, ?)',
    [parentResult.insertId, childResult.insertId, 'Mẹ']
  );

  await connection.query(
    `INSERT INTO user_rewards (user_id, total_stars, total_coins, current_streak)
     VALUES (?, 0, 0, 0), (?, 0, 0, 0)`,
    [parentResult.insertId, childResult.insertId]
  );

  const [courseResult] = await connection.query(
    `INSERT INTO courses (title, description, age_group, status)
     VALUES ('Bé 3 tuổi - Alphabet & Phonics',
             'Làm quen bảng chữ cái A-F qua hình ảnh, âm thanh và trò chơi ngắn.',
             '3', 'PUBLISHED')`
  );

  const [topicResult] = await connection.query(
    `INSERT INTO topics (course_id, name, description, sort_order, status)
     VALUES (?, 'Alphabet A-F', 'Bé nhận biết mặt chữ A-F và âm phonics cơ bản trước khi học chủ đề khác.', 1, 'PUBLISHED')`,
    [courseResult.insertId]
  );

  const alphabet = [
    ['A', 'Chữ A', '/eɪ/'],
    ['B', 'Chữ B', '/biː/'],
    ['C', 'Chữ C', '/siː/'],
    ['D', 'Chữ D', '/diː/'],
    ['E', 'Chữ E', '/iː/'],
    ['F', 'Chữ F', '/ɛf/']
  ];

  for (const [word, meaning, phonetic] of alphabet) {
    await connection.query(
      'INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic) VALUES (?, ?, ?, ?)',
      [topicResult.insertId, word, meaning, phonetic]
    );
  }

  const lessons = [
    ['Nhận biết chữ A-F', 'FLASHCARD', 1, 1, 'Bé nhận biết và gọi tên được các chữ cái A-F qua thẻ hình ảnh.'],
    ['Phonics A-F', 'SPEAKING', 1, 2, 'Bé nghe và bắt chước âm của các chữ cái A-F.'],
    ['Ôn tập Alphabet A-F', 'QUIZ', 1, 3, 'Bé chọn đúng chữ cái A-F theo hình ảnh và âm thanh.']
  ];

  let quizLessonId = null;
  for (const [title, lessonType, difficulty, sortOrder, outcomes] of lessons) {
    const [lessonResult] = await connection.query(
      `INSERT INTO lessons
       (topic_id, title, lesson_type, difficulty, sort_order, status, approval_status, target_age, learning_outcomes)
       VALUES (?, ?, ?, ?, ?, 'PUBLISHED', 'APPROVED', 3, ?)`,
      [topicResult.insertId, title, lessonType, difficulty, sortOrder, outcomes]
    );
    if (lessonType === 'QUIZ') quizLessonId = lessonResult.insertId;
  }

  const [questionResult] = await connection.query(
    `INSERT INTO questions (lesson_id, question_type, question_text, points)
     VALUES (?, 'MULTIPLE_CHOICE', 'Which letter is this? A', 10)`,
    [quizLessonId]
  );

  for (const [answer, isCorrect] of [['A', 1], ['B', 0], ['C', 0], ['D', 0]]) {
    await connection.query(
      'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)',
      [questionResult.insertId, answer, isCorrect]
    );
  }

  return {
    adminId: adminResult.insertId,
    expertId: expertResult.insertId,
    parentId: parentResult.insertId,
    childId: childResult.insertId,
    courseId: courseResult.insertId,
    topicId: topicResult.insertId
  };
}

async function main() {
  const connection = await mysql.createConnection(databaseConfig);
  try {
    console.log(`Resetting database: ${databaseConfig.database}`);
    await resetDatabase(connection);
    const ids = await seedRequiredData(connection);
    console.log('Database reset complete.');
    console.log(JSON.stringify({
      admin: 'admin / 123456',
      parent: 'phuhuynh_huong / 123456',
      child: 'be3_alphabet / 123456',
      ids
    }, null, 2));
  } finally {
    await connection.end();
  }

  // The reset script used to leave only the demo A-F course behind. Re-run
  // the full idempotent curriculum seed so a fresh database has the same
  // complete 3-8 year-old roadmap as an existing database.
  console.log('Seeding the full curriculum after reset...');
  const fullSeed = spawnSync(process.execPath, [path.join(__dirname, 'seed_full_curriculum.js')], { stdio: 'inherit' });
  if (fullSeed.error) throw fullSeed.error;
  if (fullSeed.status !== 0) throw new Error(`Full curriculum seed exited with code ${fullSeed.status}`);
}

main().catch((error) => {
  console.error('Database reset failed:', error);
  process.exitCode = 1;
});
