const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Curriculum data for ages 3-8. This migration only inserts/updates the
// requested curriculum rows; it never deletes lessons, vocabulary or progress.
const curriculum = [
  {
    age: 3,
    courseTitle: 'Bậc 1: Bé 3 tuổi - Làm quen chữ cái',
    courseDescription: 'Nhận biết và phát âm 26 chữ cái A-Z qua 3 chặng ngắn, trực quan và vui nhộn.',
    topics: [
      {
        name: 'Chặng 1 - Chữ A-J',
        description: 'Nhận biết 10 chữ cái A đến J.',
        words: 'ABCDEFGHIJ'.split('').map((word) => [word, `Chữ ${word}`, '']),
        game: { name: 'Nối chữ A-J', type: 'MATCHING_PAIRS', points: 100, difficulty: 1 }
      },
      {
        name: 'Chặng 2 - Chữ K-T',
        description: 'Nhận biết 10 chữ cái K đến T.',
        words: 'KLMNOPQRST'.split('').map((word) => [word, `Chữ ${word}`, '']),
        game: {
          name: 'Nghe chữ K-T',
          legacyNames: ['Nghe chữ A-J'],
          type: 'LISTEN_AND_PICK',
          points: 100,
          difficulty: 1
        }
      },
      {
        name: 'Chặng 3 - Chữ U-Z',
        description: 'Nhận biết 6 chữ cái U đến Z.',
        words: 'UVWXYZ'.split('').map((word) => [word, `Chữ ${word}`, '']),
        game: { name: 'Lật thẻ chữ U-Z', type: 'MEMORY_CARDS', points: 100, difficulty: 1 }
      }
    ]
  },
  {
    age: 4,
    courseTitle: 'Bậc 2: Bé 4 tuổi - Số đếm và hình dạng',
    courseDescription: 'Đếm số 1-10 và nhận biết hình tròn, hình vuông cùng các hình cơ bản.',
    topics: [
      {
        name: 'Đếm số 1-10',
        description: 'Đếm và nhận biết các số từ 1 đến 10 qua đồ vật quen thuộc.',
        words: [
          ['One', 'Một', '/wʌn/'], ['Two', 'Hai', '/tuː/'], ['Three', 'Ba', '/θriː/'],
          ['Four', 'Bốn', '/fɔːr/'], ['Five', 'Năm', '/faɪv/'], ['Six', 'Sáu', '/sɪks/'],
          ['Seven', 'Bảy', '/ˈsevən/'], ['Eight', 'Tám', '/eɪt/'], ['Nine', 'Chín', '/naɪn/'],
          ['Ten', 'Mười', '/ten/']
        ],
        game: { name: 'Đếm đồ vật 1-10', type: 'COUNT_OBJECTS', points: 110, difficulty: 1 }
      },
      {
        name: 'Hình tròn và hình vuông',
        description: 'Nhận biết hình tròn, hình vuông, hình tam giác và ngôi sao.',
        words: [
          ['Circle', 'Hình tròn', '/ˈsɜːrkəl/'], ['Square', 'Hình vuông', '/skwer/'],
          ['Triangle', 'Hình tam giác', '/ˈtraɪæŋɡəl/'], ['Star', 'Ngôi sao', '/stɑːr/']
        ],
        game: { name: 'Ghép hình cơ bản', type: 'MATCHING_PAIRS', points: 110, difficulty: 1 }
      }
    ]
  },
  {
    age: 5,
    courseTitle: 'Bậc 3: Bé 5 tuổi - Trái cây và màu sắc',
    courseDescription: 'Mở rộng vốn từ qua trái cây, màu sắc và hoạt động nhận biết bằng hình ảnh.',
    topics: [
      {
        name: 'Trái cây',
        description: 'Nhận biết tên các loại trái cây quen thuộc.',
        words: [
          ['Apple', 'Quả táo', '/ˈæpəl/'], ['Banana', 'Quả chuối', '/bəˈnænə/'],
          ['Orange', 'Quả cam', '/ˈɔːrɪndʒ/'], ['Mango', 'Quả xoài', '/ˈmæŋɡoʊ/'],
          ['Strawberry', 'Dâu tây', '/ˈstrɔːberi/'], ['Watermelon', 'Dưa hấu', '/ˈwɔːtərmelən/']
        ],
        game: { name: 'Lật thẻ trái cây', type: 'MEMORY_CARDS', points: 120, difficulty: 2 }
      },
      {
        name: 'Màu sắc',
        description: 'Nhận biết và gọi tên các màu sắc thường gặp.',
        words: [
          ['Red', 'Màu đỏ', '/red/'], ['Blue', 'Màu xanh dương', '/bluː/'],
          ['Yellow', 'Màu vàng', '/ˈjeloʊ/'], ['Green', 'Màu xanh lá', '/ɡriːn/'],
          ['Orange', 'Màu cam', '/ˈɔːrɪndʒ/'], ['Purple', 'Màu tím', '/ˈpɜːrpəl/']
        ],
        game: { name: 'Nghe và chọn màu', type: 'LISTEN_AND_PICK', points: 120, difficulty: 2 }
      }
    ]
  },
  {
    age: 6,
    courseTitle: 'Bậc 4: Bé 6 tuổi - Hello và giao tiếp cơ bản',
    courseDescription: 'Thực hành chào hỏi, giới thiệu bản thân và giao tiếp lịch sự bằng câu ngắn.',
    topics: [
      {
        name: 'Greetings - Chào hỏi',
        description: 'Thực hành Hello, Goodbye, Good morning và các lời chào quen thuộc.',
        words: [
          ['Hello', 'Xin chào', '/həˈloʊ/'], ['Goodbye', 'Tạm biệt', '/ˌɡʊdˈbaɪ/'],
          ['Good morning', 'Chào buổi sáng', '/ˌɡʊd ˈmɔːrnɪŋ/'], ['Good afternoon', 'Chào buổi chiều', '/ˌɡʊd ˌæftərˈnuːn/'],
          ['Please', 'Làm ơn', '/pliːz/'], ['Thank you', 'Cảm ơn', '/ˈθæŋk juː/']
        ],
        game: { name: 'Nghe và chọn lời chào', type: 'LISTEN_AND_PICK', points: 130, difficulty: 2 }
      },
      {
        name: 'Greetings & Hello Mary - Giao tiếp cơ bản',
        description: 'Luyện hội thoại ngắn: Hello Mary, My name is..., Nice to meet you.',
        words: [
          ['Hello', 'Xin chào', '/həˈloʊ/'], ['Mary', 'Mary', '/ˈmeri/'],
          ['My name is', 'Tên của tôi là', '/maɪ neɪm ɪz/'], ['Nice to meet you', 'Rất vui được gặp bạn', '/naɪs tə miːt juː/'],
          ['Yes', 'Có', '/jes/'], ['No', 'Không', '/noʊ/']
        ],
        game: { name: 'Sắp xếp câu Hello Mary', type: 'ORDER_SENTENCE', points: 130, difficulty: 2 }
      }
    ]
  },
  {
    age: 7,
    courseTitle: 'Bậc 5: Bé 7 tuổi - Gia đình',
    courseDescription: 'Gọi tên thành viên gia đình và nói các câu ngắn về gia đình của em.',
    topics: [
      {
        name: 'My Family - Gia đình của em',
        description: 'Nhận biết thành viên gia đình và luyện nói câu giới thiệu đơn giản.',
        words: [
          ['Father', 'Bố', '/ˈfɑːðər/'], ['Mother', 'Mẹ', '/ˈmʌðər/'],
          ['Sister', 'Chị/em gái', '/ˈsɪstər/'], ['Brother', 'Anh/em trai', '/ˈbrʌðər/'],
          ['Grandma', 'Bà', '/ˈɡrænmɑː/'], ['Grandpa', 'Ông', '/ˈɡrænpɑː/'],
          ['Family', 'Gia đình', '/ˈfæməli/']
        ],
        game: { name: 'Lật thẻ thành viên gia đình', type: 'MEMORY_CARDS', points: 140, difficulty: 3 }
      }
    ]
  },
  {
    age: 8,
    courseTitle: 'Bậc 6: Bé 8 tuổi - Giao tiếp thực hành',
    courseDescription: 'Luyện hỏi đáp, giao tiếp hằng ngày và sử dụng câu tiếng Anh trong tình huống quen thuộc.',
    topics: [
      {
        name: 'Simple Questions & Answers - Hỏi đáp cơ bản',
        description: 'Đặt và trả lời câu hỏi ngắn về tên, đồ vật, màu sắc và vị trí.',
        words: [
          ['What', 'Cái gì', '/wʌt/'], ['Where', 'Ở đâu', '/wer/'], ['How', 'Như thế nào', '/haʊ/'],
          ['Name', 'Tên', '/neɪm/'], ['Color', 'Màu sắc', '/ˈkʌlər/'], ['This', 'Cái này', '/ðɪs/'],
          ['That', 'Cái kia', '/ðæt/']
        ],
        game: { name: 'Sắp xếp câu hỏi đáp', type: 'ORDER_SENTENCE', points: 150, difficulty: 3 }
      },
      {
        name: 'Greetings & Daily Conversations - Giao tiếp hằng ngày',
        description: 'Luyện nghe và sử dụng các câu lịch sự trong giao tiếp hằng ngày.',
        words: [
          ['Hello', 'Xin chào', '/həˈloʊ/'], ['Please', 'Làm ơn', '/pliːz/'],
          ['Thank you', 'Cảm ơn', '/ˈθæŋk juː/'], ['Sorry', 'Xin lỗi', '/ˈsɑːri/'],
          ['Excuse me', 'Xin phép', '/ɪkˈskjuːz miː/'], ['Help', 'Giúp đỡ', '/help/'],
          ['School', 'Trường học', '/skuːl/'], ['Home', 'Nhà', '/hoʊm/']
        ],
        game: { name: 'Nghe và chọn câu giao tiếp', type: 'LISTEN_AND_PICK', points: 150, difficulty: 3 }
      }
    ]
  }
];

const alphabetPhonetics = {
  A: '/eɪ/', B: '/biː/', C: '/siː/', D: '/diː/', E: '/iː/', F: '/ef/',
  G: '/dʒiː/', H: '/eɪtʃ/', I: '/aɪ/', J: '/dʒeɪ/', K: '/keɪ/', L: '/el/',
  M: '/em/', N: '/en/', O: '/oʊ/', P: '/piː/', Q: '/kjuː/', R: '/ɑːr/',
  S: '/es/', T: '/tiː/', U: '/juː/', V: '/viː/', W: '/ˈdʌbəljuː/', X: '/eks/',
  Y: '/waɪ/', Z: '/ziː/'
};

async function ensureSpeakingLessonType(connection) {
  const [columns] = await connection.query("SHOW COLUMNS FROM lessons LIKE 'lesson_type'");
  if (columns[0] && !String(columns[0].Type).includes("'SPEAKING'")) {
    await connection.query("ALTER TABLE lessons MODIFY COLUMN lesson_type ENUM('VIDEO', 'FLASHCARD', 'SPEAKING', 'QUIZ', 'GAME') NOT NULL");
  }
}

async function upsertCourse(connection, item) {
  const [rows] = await connection.query('SELECT id FROM courses WHERE age_group = ? ORDER BY id LIMIT 1', [String(item.age)]);
  if (rows.length) {
    await connection.query(
      'UPDATE courses SET title = ?, description = ?, status = "PUBLISHED" WHERE id = ?',
      [item.courseTitle, item.courseDescription, rows[0].id]
    );
    return rows[0].id;
  }
  const [result] = await connection.query(
    'INSERT INTO courses (title, description, age_group, status) VALUES (?, ?, ?, "PUBLISHED")',
    [item.courseTitle, item.courseDescription, String(item.age)]
  );
  return result.insertId;
}

async function upsertTopic(connection, courseId, item, sortOrder) {
  const [rows] = await connection.query(
    'SELECT id FROM topics WHERE course_id = ? AND name = ? LIMIT 1',
    [courseId, item.name]
  );
  if (rows.length) {
    await connection.query(
      'UPDATE topics SET description = ?, sort_order = ?, status = "PUBLISHED" WHERE id = ?',
      [item.description, sortOrder, rows[0].id]
    );
    return rows[0].id;
  }
  const [result] = await connection.query(
    'INSERT INTO topics (course_id, name, description, sort_order, status) VALUES (?, ?, ?, ?, "PUBLISHED")',
    [courseId, item.name, item.description, sortOrder]
  );
  return result.insertId;
}

async function upsertVocabulary(connection, topicId, words) {
  for (const [word, meaning, phonetic] of words) {
    const normalizedPhonetic = phonetic || alphabetPhonetics[word] || '';
    const [rows] = await connection.query(
      'SELECT id FROM vocabularies WHERE topic_id = ? AND word = ? LIMIT 1',
      [topicId, word]
    );
    if (rows.length) {
      await connection.query(
        'UPDATE vocabularies SET meaning_vi = ?, phonetic = ? WHERE id = ?',
        [meaning, normalizedPhonetic, rows[0].id]
      );
    } else {
      await connection.query(
        'INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic) VALUES (?, ?, ?, ?)',
        [topicId, word, meaning, normalizedPhonetic]
      );
    }
  }
}

async function upsertLesson(connection, topicId, age, type, sortOrder, title, outcome, miniGameId = null, difficulty = 1) {
  let rows;
  if (miniGameId) {
    [rows] = await connection.query('SELECT id FROM lessons WHERE mini_game_id = ? LIMIT 1', [miniGameId]);
  } else {
    [rows] = await connection.query(
      'SELECT id FROM lessons WHERE topic_id = ? AND lesson_type = ? AND sort_order = ? LIMIT 1',
      [topicId, type, sortOrder]
    );
  }

  const values = [topicId, miniGameId, title, type, difficulty, sortOrder, String(age), outcome, `curriculum/age-${age}/topic-${topicId}-${sortOrder}`];
  if (rows.length) {
    await connection.query(
      `UPDATE lessons
       SET topic_id = ?, mini_game_id = ?, title = ?, lesson_type = ?, difficulty = ?, sort_order = ?,
           status = 'PUBLISHED', approval_status = 'APPROVED', target_age = ?, learning_outcomes = ?, sample_materials_url = ?
       WHERE id = ?`,
      [...values, rows[0].id]
    );
    return rows[0].id;
  }

  const [result] = await connection.query(
    `INSERT INTO lessons
      (topic_id, mini_game_id, title, lesson_type, difficulty, sort_order, status, approval_status, target_age, learning_outcomes, sample_materials_url)
     VALUES (?, ?, ?, ?, ?, ?, 'PUBLISHED', 'APPROVED', ?, ?, ?)`,
    values
  );
  return result.insertId;
}

async function upsertGame(connection, topicId, game, age, sortOrder) {
  let [rows] = await connection.query(
    'SELECT id FROM mini_games WHERE topic_id = ? AND name = ? LIMIT 1',
    [topicId, game.name]
  );

  // Repair the known legacy title mismatch without touching its progress.
  if (!rows.length && game.legacyNames?.length) {
    const placeholders = game.legacyNames.map(() => '?').join(', ');
    [rows] = await connection.query(
      `SELECT id FROM mini_games WHERE topic_id = ? AND name IN (${placeholders}) ORDER BY id LIMIT 1`,
      [topicId, ...game.legacyNames]
    );
  }

  const values = [game.name, game.type, game.difficulty, game.points, sortOrder];
  let gameId;
  if (rows.length) {
    gameId = rows[0].id;
    await connection.query(
      'UPDATE mini_games SET name = ?, game_type = ?, difficulty = ?, points = ?, is_active = 1, sort_order = ? WHERE id = ?',
      [...values, gameId]
    );
  } else {
    const [result] = await connection.query(
      `INSERT INTO mini_games (topic_id, name, game_type, difficulty, points, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [topicId, ...values]
    );
    gameId = result.insertId;
  }

  await upsertLesson(
    connection,
    topicId,
    age,
    'GAME',
    3,
    game.name,
    `Bé ${age} tuổi luyện tập qua trò chơi ${game.name}.`,
    gameId,
    game.difficulty
  );
  return gameId;
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
    await ensureSpeakingLessonType(connection);
    await connection.beginTransaction();

    let topicCount = 0;
    let gameCount = 0;
    for (const course of curriculum) {
      const courseId = await upsertCourse(connection, course);
      for (let index = 0; index < course.topics.length; index += 1) {
        const topic = course.topics[index];
        const topicId = await upsertTopic(connection, courseId, topic, index + 1);
        await upsertVocabulary(connection, topicId, topic.words);

        await upsertLesson(connection, topicId, course.age, 'FLASHCARD', 1, `Học bài: ${topic.name}`, `Bé ${course.age} tuổi nhận biết từ vựng trong chủ đề ${topic.name}.`, null, Math.max(1, Math.ceil(course.age / 2)));
        await upsertLesson(connection, topicId, course.age, 'SPEAKING', 2, `Nói cùng AI: ${topic.name}`, `Bé ${course.age} tuổi luyện phát âm từ vựng trong chủ đề ${topic.name}.`, null, Math.max(1, Math.ceil(course.age / 2)));
        await upsertGame(connection, topicId, topic.game, course.age, index + 1);

        topicCount += 1;
        gameCount += 1;
      }
    }

    await connection.commit();
    console.log(`Đã đồng bộ ${curriculum.length} khóa học, ${topicCount} chủ đề và ${gameCount} mini game cho độ tuổi 3-8.`);
    console.log('Không xóa bài học, từ vựng hoặc tiến độ hiện có.');
  } catch (error) {
    await connection.rollback();
    console.error('Seed age curriculum failed:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

seed();
