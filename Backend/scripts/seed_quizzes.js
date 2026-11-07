const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function questionText(word, meaning, age) {
  if (age === 3 && /^[A-Z]$/.test(word)) return `Find the letter ${word}.`;
  if (age <= 4) return `Choose the word for: ${meaning}`;
  return `Which word or phrase means: ${meaning}`;
}

function questionCount(age, wordCount) {
  if (age === 3) return Math.min(3, wordCount);
  if (age === 4) return Math.min(4, wordCount);
  return Math.min(5, wordCount);
}

async function getOrCreateQuizLesson(connection, topic, age) {
  const title = `Quiz: ${topic.name}`;
  const [existing] = await connection.query(
    'SELECT id FROM lessons WHERE topic_id = ? AND lesson_type = "QUIZ" AND title = ? LIMIT 1',
    [topic.id, title]
  );
  const difficulty = Math.max(1, Math.min(5, age - 2));
  const outcome = `Bé ${age} tuổi kiểm tra lại kiến thức ${topic.name}.`;
  const marker = `curriculum/quiz/age-${age}/topic-${topic.id}`;

  if (existing.length) {
    return existing[0].id;
  }

  const [orderRows] = await connection.query(
    'SELECT COALESCE(MAX(sort_order), 0) AS max_sort_order FROM lessons WHERE topic_id = ?',
    [topic.id]
  );
  const [result] = await connection.query(
    `INSERT INTO lessons
      (topic_id, title, lesson_type, difficulty, sort_order, status, approval_status, target_age, learning_outcomes, sample_materials_url)
     VALUES (?, ?, 'QUIZ', ?, ?, 'PUBLISHED', 'APPROVED', ?, ?, ?)`,
    [topic.id, title, difficulty, Number(orderRows[0].max_sort_order) + 1, String(age), outcome, marker]
  );
  return result.insertId;
}

async function seedQuestions(connection, lessonId, topic, age, words) {
  const [existingQuestions] = await connection.query(
    'SELECT COUNT(*) AS count FROM questions WHERE lesson_id = ?',
    [lessonId]
  );
  // Do not overwrite questions that an administrator has already authored.
  if (Number(existingQuestions[0].count) > 0) return false;

  const total = questionCount(age, words.length);
  const points = age <= 4 ? 5 : 10;
  for (let index = 0; index < total; index += 1) {
    const target = words[index % words.length];
    const distractors = words.filter((word) => word.id !== target.id).slice(0, 3);
    const options = [target, ...distractors];
    const correctIndex = index % options.length;
    const rotated = options.map((_, optionIndex) => options[(optionIndex + correctIndex) % options.length]);
    const [question] = await connection.query(
      'INSERT INTO questions (lesson_id, question_type, question_text, points) VALUES (?, "MULTIPLE_CHOICE", ?, ?)',
      [lessonId, questionText(target.word, target.meaning_vi, age), points]
    );

    for (let optionIndex = 0; optionIndex < rotated.length; optionIndex += 1) {
      await connection.query(
        'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)',
        [question.insertId, rotated[optionIndex].word, rotated[optionIndex].id === target.id ? 1 : 0]
      );
    }
  }
  return true;
}

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kids_english_db'
  });

  try {
    await connection.beginTransaction();
    const [topics] = await connection.query(
      `SELECT t.id, t.name, c.age_group
       FROM topics t
       INNER JOIN courses c ON c.id = t.course_id
       WHERE t.status = 'PUBLISHED' AND c.status = 'PUBLISHED' AND c.age_group BETWEEN '3' AND '8'
       ORDER BY CAST(c.age_group AS UNSIGNED), t.sort_order, t.id`
    );

    let quizCount = 0;
    let questionCountTotal = 0;
    for (const topic of topics) {
      const age = Number(topic.age_group);
      const [vocabularies] = await connection.query(
        'SELECT id, word, meaning_vi FROM vocabularies WHERE topic_id = ? ORDER BY id',
        [topic.id]
      );
      if (vocabularies.length < 4) continue;

      const lessonId = await getOrCreateQuizLesson(connection, topic, age);
      const created = await seedQuestions(connection, lessonId, topic, age, vocabularies);
      if (created) {
        const [createdQuestions] = await connection.query('SELECT COUNT(*) AS count FROM questions WHERE lesson_id = ?', [lessonId]);
        questionCountTotal += Number(createdQuestions[0].count);
      }
      quizCount += 1;
    }

    await connection.commit();
    console.log(`Đã tạo/kiểm tra ${quizCount} bài Quiz và ${questionCountTotal} câu hỏi cho độ tuổi 3-8.`);
    console.log('Quiz đã ở trạng thái PUBLISHED và APPROVED để frontend hiển thị.');
  } catch (error) {
    await connection.rollback();
    console.error('Quiz seed failed:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

seed();
