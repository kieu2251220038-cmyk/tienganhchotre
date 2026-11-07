const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const VIDEO_URL = 'https://www.youtube.com/embed/t99ULJjCsaM?autoplay=0';

const curriculum = [
  {
    age: 3,
    title: 'Bậc 1: Bé 3 tuổi - Làm quen chữ cái và âm thanh',
    description: 'Làm quen chữ cái, âm thanh, màu sắc, con vật và bài hát qua nghe, nhìn, chỉ đúng hình và bắt chước.',
    topics: [
      {
        name: 'Chặng 1 - Chữ A-J', description: 'Làm quen 10 chữ cái A đến J qua hình ảnh và âm thanh.',
        words: 'ABCDEFGHIJ'.split('').map((word) => [word, `Chữ ${word}`, '']),
        game: ['Nối chữ A-J', 'MATCHING_PAIRS', 1]
      },
      {
        name: 'Chặng 2 - Chữ K-T', description: 'Làm quen 10 chữ cái K đến T qua hình ảnh và âm thanh.',
        words: 'KLMNOPQRST'.split('').map((word) => [word, `Chữ ${word}`, '']),
        game: ['Nghe chữ K-T', 'LISTEN_AND_PICK', 1]
      },
      {
        name: 'Chặng 3 - Chữ U-Z', description: 'Làm quen 6 chữ cái U đến Z qua hình ảnh và âm thanh.',
        words: 'UVWXYZ'.split('').map((word) => [word, `Chữ ${word}`, '']),
        game: ['Lật thẻ chữ U-Z', 'MEMORY_CARDS', 1]
      },
      {
        name: 'Âm chữ cái và màu sắc cơ bản', description: 'Bắt chước âm A /æ/, B /b/, C /k/ và nhận biết red, blue, yellow.',
        words: [
          ['A', 'Âm /æ/', '/æ/'], ['B', 'Âm /b/', '/b/'], ['C', 'Âm /k/', '/k/'],
          ['Red', 'Màu đỏ', '/red/'], ['Blue', 'Màu xanh dương', '/bluː/'], ['Yellow', 'Màu vàng', '/ˈjeloʊ/']
        ],
        game: ['Nghe âm và chọn màu', 'LISTEN_AND_PICK', 1]
      },
      {
        name: 'Động vật và bài hát', description: 'Nhận biết cat, dog, cow và nghe ABC Song, Hello Song.',
        words: [
          ['Cat', 'Con mèo', '/kæt/'], ['Dog', 'Con chó', '/dɔːɡ/'], ['Cow', 'Con bò', '/kaʊ/'],
          ['ABC Song', 'Bài hát ABC', ''], ['Hello Song', 'Bài hát Hello', '']
        ],
        video: ['Bài hát ABC và Hello Song', VIDEO_URL],
        game: ['Lật thẻ con vật', 'MEMORY_CARDS', 1]
      }
    ]
  },
  {
    age: 4,
    title: 'Bậc 2: Bé 4 tuổi - Số đếm và nhận biết thế giới',
    description: 'Đếm, phân loại, ghép hình và nhận biết màu sắc, trái cây, đồ chơi cùng từ đối lập.',
    topics: [
      {
        name: 'Đếm số 1-10', description: 'Đếm đồ vật và nhận biết số từ 1 đến 10.',
        words: [['One', 'Một', '/wʌn/'], ['Two', 'Hai', '/tuː/'], ['Three', 'Ba', '/θriː/'], ['Four', 'Bốn', '/fɔːr/'], ['Five', 'Năm', '/faɪv/'], ['Six', 'Sáu', '/sɪks/'], ['Seven', 'Bảy', '/ˈsevən/'], ['Eight', 'Tám', '/eɪt/'], ['Nine', 'Chín', '/naɪn/'], ['Ten', 'Mười', '/ten/']],
        game: ['Đếm đồ vật 1-10', 'COUNT_OBJECTS', 1]
      },
      {
        name: 'Hình dạng cơ bản', description: 'Nhận biết circle, square và triangle qua ghép hình.',
        words: [['Circle', 'Hình tròn', '/ˈsɜːrkəl/'], ['Square', 'Hình vuông', '/skwer/'], ['Triangle', 'Hình tam giác', '/ˈtraɪæŋɡəl/'], ['Star', 'Ngôi sao', '/stɑːr/']],
        game: ['Ghép hình tròn, vuông, tam giác', 'MATCHING_PAIRS', 1]
      },
      {
        name: 'Màu sắc mở rộng', description: 'Nhận biết green, pink và purple.',
        words: [['Green', 'Màu xanh lá', '/ɡriːn/'], ['Pink', 'Màu hồng', '/pɪŋk/'], ['Purple', 'Màu tím', '/ˈpɜːrpəl/'], ['Red', 'Màu đỏ', '/red/']],
        game: ['Nghe và chọn màu', 'LISTEN_AND_PICK', 1]
      },
      {
        name: 'Trái cây', description: 'Nhận biết apple, banana và orange bằng hình ảnh.',
        words: [['Apple', 'Quả táo', '/ˈæpəl/'], ['Banana', 'Quả chuối', '/bəˈnænə/'], ['Orange', 'Quả cam', '/ˈɔːrɪndʒ/'], ['Mango', 'Quả xoài', '/ˈmæŋɡoʊ/']],
        game: ['Lật thẻ trái cây', 'MEMORY_CARDS', 1]
      },
      {
        name: 'Đồ chơi', description: 'Nhận biết ball, doll và car.',
        words: [['Ball', 'Quả bóng', '/bɔːl/'], ['Doll', 'Búp bê', '/dɑːl/'], ['Car', 'Ô tô', '/kɑːr/'], ['Teddy bear', 'Gấu bông', '/ˈtedi ber/']],
        game: ['Ghép đồ chơi', 'MATCHING_PAIRS', 1]
      },
      {
        name: 'Từ đối lập', description: 'Nghe và phân biệt big-small, happy-sad.',
        words: [['Big', 'To', '/bɪɡ/'], ['Small', 'Nhỏ', '/smɔːl/'], ['Happy', 'Vui', '/ˈhæpi/'], ['Sad', 'Buồn', '/sæd/']],
        game: ['Nghe và chọn từ đối lập', 'LISTEN_AND_PICK', 1]
      }
    ]
  },
  {
    age: 5,
    title: 'Bậc 3: Bé 5 tuổi - Gia đình, bản thân và câu đơn giản',
    description: 'Nghe hiểu câu ngắn, tập nói cụm từ và câu đơn giản về gia đình, cơ thể, cảm xúc và sở thích.',
    topics: [
      {
        name: 'Gia đình', description: 'Gọi tên father, mother và sister.',
        words: [['Father', 'Bố', '/ˈfɑːðər/'], ['Mother', 'Mẹ', '/ˈmʌðər/'], ['Sister', 'Chị/em gái', '/ˈsɪstər/'], ['Brother', 'Anh/em trai', '/ˈbrʌðər/']],
        game: ['Lật thẻ gia đình', 'MEMORY_CARDS', 2]
      },
      {
        name: 'Bộ phận cơ thể', description: 'Nhận biết eyes, nose và hands.',
        words: [['Eyes', 'Mắt', '/aɪz/'], ['Nose', 'Mũi', '/noʊz/'], ['Hands', 'Bàn tay', '/hændz/'], ['Mouth', 'Miệng', '/maʊθ/']],
        game: ['Ghép bộ phận cơ thể', 'MATCHING_PAIRS', 2]
      },
      {
        name: 'Cảm xúc', description: 'Nghe hiểu happy, sad và tired.',
        words: [['Happy', 'Vui', '/ˈhæpi/'], ['Sad', 'Buồn', '/sæd/'], ['Tired', 'Mệt', '/ˈtaɪərd/'], ['Angry', 'Tức giận', '/ˈæŋɡri/']],
        game: ['Nghe và chọn cảm xúc', 'LISTEN_AND_PICK', 2]
      },
      {
        name: 'Quần áo', description: 'Nhận biết shirt, shoes và hat.',
        words: [['Shirt', 'Áo', '/ʃɜːrt/'], ['Shoes', 'Giày', '/ʃuːz/'], ['Hat', 'Mũ', '/hæt/'], ['Dress', 'Váy', '/dres/']],
        game: ['Lật thẻ quần áo', 'MEMORY_CARDS', 2]
      },
      {
        name: 'Sở thích và câu đơn giản', description: 'Luyện nói I like cats, This is my mom và I am happy.',
        words: [['I like cats.', 'Con thích mèo.', '/aɪ laɪk kæts/'], ['This is my mom.', 'Đây là mẹ của con.', '/ðɪs ɪz maɪ mɑːm/'], ['I am happy.', 'Con vui.', '/aɪ æm ˈhæpi/'], ['I like books.', 'Con thích sách.', '/aɪ laɪk bʊks/']],
        game: ['Nghe và chọn câu', 'LISTEN_AND_PICK', 2]
      }
    ]
  },
  {
    age: 6,
    title: 'Bậc 4: Bé 6 tuổi - Chào hỏi và giao tiếp cơ bản',
    description: 'Luyện hội thoại ngắn, nhận diện từ viết và bắt đầu đọc các từ quen thuộc.',
    topics: [
      {
        name: 'Greetings - Chào hỏi', description: 'Hello, goodbye và good morning.',
        words: [['Hello', 'Xin chào', '/həˈloʊ/'], ['Goodbye', 'Tạm biệt', '/ˌɡʊdˈbaɪ/'], ['Good morning', 'Chào buổi sáng', '/ˌɡʊd ˈmɔːrnɪŋ/'], ['Good afternoon', 'Chào buổi chiều', '/ˌɡʊd ˌæftərˈnuːn/']],
        game: ['Nghe và chọn lời chào', 'LISTEN_AND_PICK', 2]
      },
      {
        name: 'About Me - Giới thiệu bản thân', description: 'Luyện My name is... và I am six.',
        words: [['My name is Anna.', 'Tên của con là Anna.', '/maɪ neɪm ɪz ˈænə/'], ['I am six.', 'Con sáu tuổi.', '/aɪ æm sɪks/'], ['Name', 'Tên', '/neɪm/'], ['Age', 'Tuổi', '/eɪdʒ/']],
        game: ['Sắp xếp câu giới thiệu', 'ORDER_SENTENCE', 2]
      },
      {
        name: 'School Things - Đồ dùng học tập', description: 'Nhận diện book, pen và ruler.',
        words: [['Book', 'Quyển sách', '/bʊk/'], ['Pen', 'Bút', '/pen/'], ['Ruler', 'Thước kẻ', '/ˈruːlər/'], ['Pencil', 'Bút chì', '/ˈpensəl/']],
        game: ['Ghép đồ dùng học tập', 'MATCHING_PAIRS', 2]
      },
      {
        name: 'Actions - Hành động', description: 'Nghe và nói run, jump, read, write.',
        words: [['Run', 'Chạy', '/rʌn/'], ['Jump', 'Nhảy', '/dʒʌmp/'], ['Read', 'Đọc', '/riːd/'], ['Write', 'Viết', '/raɪt/']],
        game: ['Lật thẻ hành động', 'MEMORY_CARDS', 2]
      },
      {
        name: 'Simple Questions - Câu hỏi cơ bản', description: 'Luyện What is this? và What color is it?',
        words: [['What is this?', 'Đây là gì?', '/wʌt ɪz ðɪs/'], ['What color is it?', 'Nó màu gì?', '/wʌt ˈkʌlər ɪz ɪt/'], ['Yes, it is.', 'Đúng vậy.', '/jes ɪt ɪz/'], ['No, it is not.', 'Không phải.', '/noʊ ɪt ɪz nɑːt/']],
        game: ['Sắp xếp câu hỏi', 'ORDER_SENTENCE', 2]
      }
    ]
  },
  {
    age: 7,
    title: 'Bậc 5: Bé 7 tuổi - Nghe, nói và đọc câu ngắn',
    description: 'Trả lời câu hỏi đơn giản, đọc câu ngắn và hiểu nội dung quen thuộc qua tranh truyện.',
    topics: [
      {
        name: 'Weather - Thời tiết', description: 'Mô tả sunny, rainy và cloudy.',
        words: [['Sunny', 'Có nắng', '/ˈsʌni/'], ['Rainy', 'Có mưa', '/ˈreɪni/'], ['Cloudy', 'Nhiều mây', '/ˈklaʊdi/'], ['Windy', 'Có gió', '/ˈwɪndi/']],
        game: ['Nghe và chọn thời tiết', 'LISTEN_AND_PICK', 3]
      },
      {
        name: 'Daily Routine - Sinh hoạt hằng ngày', description: 'Nói wake up và brush teeth theo trình tự.',
        words: [['Wake up', 'Thức dậy', '/weɪk ʌp/'], ['Brush teeth', 'Đánh răng', '/brʌʃ tiːθ/'], ['Have breakfast', 'Ăn sáng', '/hæv ˈbrekfəst/'], ['Go to school', 'Đi học', '/ɡoʊ tə skuːl/']],
        game: ['Sắp xếp sinh hoạt', 'ORDER_SENTENCE', 3]
      },
      {
        name: 'Food - Đồ ăn', description: 'Nhận biết rice, noodles và milk.',
        words: [['Rice', 'Cơm/gạo', '/raɪs/'], ['Noodles', 'Mì', '/ˈnuːdəlz/'], ['Milk', 'Sữa', '/mɪlk/'], ['Egg', 'Trứng', '/eɡ/']],
        game: ['Ghép món ăn', 'MATCHING_PAIRS', 3]
      },
      {
        name: 'Days of the Week - Ngày trong tuần', description: 'Nhận biết và đọc Monday đến Sunday.',
        words: [['Monday', 'Thứ Hai', '/ˈmʌndeɪ/'], ['Tuesday', 'Thứ Ba', '/ˈtuːzdeɪ/'], ['Saturday', 'Thứ Bảy', '/ˈsætərdeɪ/'], ['Sunday', 'Chủ nhật', '/ˈsʌndeɪ/']],
        game: ['Lật thẻ ngày trong tuần', 'MEMORY_CARDS', 3]
      },
      {
        name: 'Places & Short Stories - Địa điểm và truyện tranh', description: 'Nhận biết school, park, zoo và đọc truyện tranh ngắn có hình.',
        words: [['School', 'Trường học', '/skuːl/'], ['Park', 'Công viên', '/pɑːrk/'], ['Zoo', 'Sở thú', '/zuː/'], ['Story', 'Câu chuyện', '/ˈstɔːri/']],
        game: ['Ghép địa điểm và tranh', 'MATCHING_PAIRS', 3]
      }
    ]
  },
  {
    age: 8,
    title: 'Bậc 6: Bé 8 tuổi - Đọc hiểu, viết và giao tiếp ứng dụng',
    description: 'Đọc hiểu đoạn ngắn, viết câu cơ bản và giao tiếp trong các tình huống quen thuộc.',
    topics: [
      {
        name: 'Jobs - Nghề nghiệp', description: 'Đọc và nói doctor, teacher, pilot.',
        words: [['Doctor', 'Bác sĩ', '/ˈdɑːktər/'], ['Teacher', 'Giáo viên', '/ˈtiːtʃər/'], ['Pilot', 'Phi công', '/ˈpaɪlət/'], ['Farmer', 'Nông dân', '/ˈfɑːrmər/']],
        game: ['Sắp xếp câu về nghề nghiệp', 'ORDER_SENTENCE', 3]
      },
      {
        name: 'Nature - Thiên nhiên', description: 'Mô tả tree, river và mountain.',
        words: [['Tree', 'Cây', '/triː/'], ['River', 'Sông', '/ˈrɪvər/'], ['Mountain', 'Núi', '/ˈmaʊntən/'], ['Forest', 'Rừng', '/ˈfɔːrəst/']],
        game: ['Sắp xếp câu về thiên nhiên', 'ORDER_SENTENCE', 3]
      },
      {
        name: 'Hobbies - Sở thích', description: 'Nói reading, swimming và drawing.',
        words: [['Reading', 'Đọc sách', '/ˈriːdɪŋ/'], ['Swimming', 'Bơi lội', '/ˈswɪmɪŋ/'], ['Drawing', 'Vẽ', '/ˈdrɔːɪŋ/'], ['Singing', 'Ca hát', '/ˈsɪŋɪŋ/']],
        game: ['Lật thẻ sở thích', 'MEMORY_CARDS', 3]
      },
      {
        name: 'Describing Things - Miêu tả', description: 'Luyện câu The cat is small và mô tả đồ vật quen thuộc.',
        words: [['The cat is small.', 'Con mèo nhỏ.', '/ðə kæt ɪz smɔːl/'], ['The dog is big.', 'Con chó to.', '/ðə dɔːɡ ɪz bɪɡ/'], ['It is red.', 'Nó màu đỏ.', '/ɪt ɪz red/'], ['This is my book.', 'Đây là sách của tôi.', '/ðɪs ɪz maɪ bʊk/']],
        game: ['Nghe và chọn câu miêu tả', 'LISTEN_AND_PICK', 3]
      },
      {
        name: 'Reading & Writing - Đọc và viết câu', description: 'Đọc đoạn ngắn và viết I go to school every day.',
        words: [['I go to school every day.', 'Tôi đi học mỗi ngày.', '/aɪ ɡoʊ tə skuːl ˈevri deɪ/'], ['Read', 'Đọc', '/riːd/'], ['Write', 'Viết', '/raɪt/'], ['Sentence', 'Câu', '/ˈsentəns/']],
        game: ['Sắp xếp câu đọc viết', 'ORDER_SENTENCE', 3]
      },
      {
        name: 'Daily Communication - Giao tiếp ứng dụng', description: 'Hỏi đáp và giao tiếp trong tình huống quen thuộc.',
        words: [['Can you help me?', 'Bạn có thể giúp tôi không?', '/kæn juː help miː/'], ['Where is the school?', 'Trường học ở đâu?', '/wer ɪz ðə skuːl/'], ['Thank you.', 'Cảm ơn.', '/ˈθæŋk juː/'], ['You are welcome.', 'Không có gì.', '/juː ɑːr ˈwelkəm/']],
        game: ['Nghe và chọn câu giao tiếp', 'LISTEN_AND_PICK', 3]
      }
    ]
  }
];

const topicsToHide = [
  { age: 4, names: ['Hình tròn và hình vuông'] },
  { age: 5, names: ['Trái cây', 'Màu sắc'] },
  { age: 7, names: ['My Family - Gia đình của em'] }
];

async function ensureSpeakingType(connection) {
  const [columns] = await connection.query("SHOW COLUMNS FROM lessons LIKE 'lesson_type'");
  if (columns[0] && !String(columns[0].Type).includes("'SPEAKING'")) {
    await connection.query("ALTER TABLE lessons MODIFY COLUMN lesson_type ENUM('VIDEO', 'FLASHCARD', 'SPEAKING', 'QUIZ', 'GAME') NOT NULL");
  }
}

async function upsertCourse(connection, item) {
  const [rows] = await connection.query('SELECT id FROM courses WHERE age_group = ? ORDER BY id LIMIT 1', [String(item.age)]);
  if (rows.length) {
    await connection.query('UPDATE courses SET title = ?, description = ?, status = "PUBLISHED" WHERE id = ?', [item.title, item.description, rows[0].id]);
    return rows[0].id;
  }
  const [result] = await connection.query('INSERT INTO courses (title, description, age_group, status) VALUES (?, ?, ?, "PUBLISHED")', [item.title, item.description, String(item.age)]);
  return result.insertId;
}

async function upsertTopic(connection, courseId, topic, order) {
  const [rows] = await connection.query('SELECT id FROM topics WHERE course_id = ? AND name = ? LIMIT 1', [courseId, topic.name]);
  if (rows.length) {
    await connection.query('UPDATE topics SET description = ?, sort_order = ?, status = "PUBLISHED" WHERE id = ?', [topic.description, order, rows[0].id]);
    return rows[0].id;
  }
  const [result] = await connection.query('INSERT INTO topics (course_id, name, description, sort_order, status) VALUES (?, ?, ?, ?, "PUBLISHED")', [courseId, topic.name, topic.description, order]);
  return result.insertId;
}

async function upsertWords(connection, topicId, words) {
  for (const [word, meaning, phonetic] of words) {
    const [rows] = await connection.query('SELECT id FROM vocabularies WHERE topic_id = ? AND word = ? LIMIT 1', [topicId, word]);
    if (rows.length) {
      await connection.query('UPDATE vocabularies SET meaning_vi = ?, phonetic = ? WHERE id = ?', [meaning, phonetic || '', rows[0].id]);
    } else {
      await connection.query('INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic) VALUES (?, ?, ?, ?)', [topicId, word, meaning, phonetic || '']);
    }
  }
}

async function upsertLesson(connection, topicId, age, type, order, title, outcome, difficulty, sampleUrl = null, miniGameId = null) {
  const [rows] = miniGameId
    ? await connection.query('SELECT id FROM lessons WHERE mini_game_id = ? LIMIT 1', [miniGameId])
    : await connection.query('SELECT id FROM lessons WHERE topic_id = ? AND lesson_type = ? AND sort_order = ? LIMIT 1', [topicId, type, order]);
  const values = [topicId, miniGameId, title, type, difficulty, order, String(age), outcome, sampleUrl, rows[0]?.id];
  if (rows.length) {
    await connection.query(
      `UPDATE lessons SET topic_id = ?, mini_game_id = ?, title = ?, lesson_type = ?, difficulty = ?, sort_order = ?,
       status = 'PUBLISHED', approval_status = 'APPROVED', target_age = ?, learning_outcomes = ?, sample_materials_url = ?
       WHERE id = ?`,
      values
    );
    return rows[0].id;
  }
  const [result] = await connection.query(
    `INSERT INTO lessons (topic_id, mini_game_id, title, lesson_type, difficulty, sort_order, status, approval_status, target_age, learning_outcomes, sample_materials_url)
     VALUES (?, ?, ?, ?, ?, ?, 'PUBLISHED', 'APPROVED', ?, ?, ?)`,
    values.slice(0, -1)
  );
  return result.insertId;
}

async function upsertGame(connection, topicId, age, topic, order, game) {
  const [name, type, difficulty] = game;
  const points = 80 + (age * 10);
  const [rows] = await connection.query('SELECT id FROM mini_games WHERE topic_id = ? AND name = ? LIMIT 1', [topicId, name]);
  let gameId;
  if (rows.length) {
    gameId = rows[0].id;
    await connection.query('UPDATE mini_games SET game_type = ?, difficulty = ?, points = ?, is_active = 1, sort_order = ? WHERE id = ?', [type, difficulty, points, order, gameId]);
  } else {
    const [result] = await connection.query('INSERT INTO mini_games (topic_id, name, game_type, difficulty, points, is_active, sort_order) VALUES (?, ?, ?, ?, ?, 1, ?)', [topicId, name, type, difficulty, points, order]);
    gameId = result.insertId;
  }
  await upsertLesson(connection, topicId, age, 'GAME', topic.video ? 4 : 3, name, `Bé ${age} tuổi luyện tập qua trò chơi ${name}.`, difficulty, null, gameId);
}

async function hideOldTopics(connection) {
  for (const item of topicsToHide) {
    const [courses] = await connection.query('SELECT id FROM courses WHERE age_group = ? LIMIT 1', [String(item.age)]);
    if (!courses.length) continue;
    const placeholders = item.names.map(() => '?').join(', ');
    const params = [courses[0].id, ...item.names];
    const [topics] = await connection.query(`SELECT id FROM topics WHERE course_id = ? AND name IN (${placeholders})`, params);
    for (const topic of topics) {
      await connection.query('UPDATE topics SET status = "DRAFT" WHERE id = ?', [topic.id]);
      await connection.query('UPDATE lessons SET status = "DRAFT" WHERE topic_id = ?', [topic.id]);
      await connection.query('UPDATE mini_games SET is_active = 0 WHERE topic_id = ?', [topic.id]);
    }
  }
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
    await ensureSpeakingType(connection);
    await connection.beginTransaction();
    await hideOldTopics(connection);

    let topicCount = 0;
    let gameCount = 0;
    for (const course of curriculum) {
      const courseId = await upsertCourse(connection, course);
      for (let index = 0; index < course.topics.length; index += 1) {
        const topic = course.topics[index];
        const topicId = await upsertTopic(connection, courseId, topic, index + 1);
        await upsertWords(connection, topicId, topic.words);
        const difficulty = Math.max(1, Math.min(5, course.age - 2));
        await upsertLesson(connection, topicId, course.age, 'FLASHCARD', 1, `Học bài: ${topic.name}`, `Bé ${course.age} tuổi học ${topic.name}.`, difficulty);
        await upsertLesson(connection, topicId, course.age, 'SPEAKING', 2, `Nói cùng AI: ${topic.name}`, `Bé ${course.age} tuổi luyện nói ${topic.name}.`, difficulty);
        if (topic.video) {
          await upsertLesson(connection, topicId, course.age, 'VIDEO', 3, topic.video[0], 'Bé nghe và bắt chước theo bài hát tiếng Anh.', difficulty, topic.video[1]);
        }
        await upsertGame(connection, topicId, course.age, topic, index + 1, topic.game);
        topicCount += 1;
        gameCount += 1;
      }
    }

    await connection.commit();
    console.log(`Đã đồng bộ lộ trình mới: ${curriculum.length} khóa học, ${topicCount} chủ đề và ${gameCount} mini game.`);
    console.log('Các chủ đề cũ không còn thuộc lộ trình mới được chuyển sang DRAFT, không xóa dữ liệu.');
  } catch (error) {
    await connection.rollback();
    console.error('Requested curriculum seed failed:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

seed();
