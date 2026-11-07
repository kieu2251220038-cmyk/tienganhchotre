const mysql = require('mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'kids_english_db'
  });

  console.log('Connected to MySQL. Seeding curriculum...');

  // 1. Ensure admin account
  const [admin] = await conn.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
  if (admin.length === 0) {
    await conn.query("INSERT INTO users (username, password_hash, display_name, role) VALUES ('admin', '123456', 'Quản Trị Viên', 'ADMIN')");
    console.log('Created admin account (admin / 123456)');
  }

  // 2. Check Course 1 (Age 3): Add Alphabet & Phonics topic if not exists
  const [c1] = await conn.query("SELECT id FROM courses WHERE age_group = '3' LIMIT 1");
  if (c1.length > 0) {
    const courseId3 = c1[0].id;
    const [alphaTopic] = await conn.query("SELECT id FROM topics WHERE course_id = ? AND name LIKE '%Alphabet%'", [courseId3]);
    let alphaTopicId;
    if (alphaTopic.length === 0) {
      const [res] = await conn.query(`
        INSERT INTO topics (course_id, name, description, sort_order, status)
        VALUES (?, 'Alphabet & Phonics - Bảng chữ cái A-B-C 🔤', 'Bé 3 tuổi làm quen 26 chữ cái tiếng Anh qua bài hát và âm thanh ngữ âm vui nhộn', 1, 'PUBLISHED')
      `, [courseId3]);
      alphaTopicId = res.insertId;
      console.log('Created Alphabet & Phonics topic for Age 3, ID:', alphaTopicId);
    } else {
      alphaTopicId = alphaTopic[0].id;
    }

    // Add lessons for Alphabet
    const [lessons] = await conn.query('SELECT id FROM lessons WHERE topic_id = ?', [alphaTopicId]);
    if (lessons.length === 0) {
      await conn.query(`
        INSERT INTO lessons (topic_id, title, lesson_type, difficulty, sort_order, status, approval_status, target_age, learning_outcomes, sample_materials_url)
        VALUES 
        (?, 'Bảng Chữ Cái A B C - Nhận Biết Âm Đầu 🎵', 'VIDEO', 1, 1, 'PUBLISHED', 'APPROVED', 3, 'Bé nghe bài hát Alphabet Song, phát âm đúng âm /æ/, /b/, /k/ của chữ A, B, C.', 'https://kids-english.example/materials/age3-alphabet-video-guide.pdf'),
        (?, 'Thẻ Từ Chữ Cái & Đồ Vật: A - Apple, B - Ball, C - Cat 🍎', 'FLASHCARD', 1, 2, 'PUBLISHED', 'APPROVED', 3, 'Bé nhìn mặt chữ và ghép với hình ảnh đồ vật tương ứng, tăng phản xạ ghi nhớ thị giác.', 'https://kids-english.example/materials/age3-flashcard-alphabet.pdf'),
        (?, 'Trắc Nghiệm Bé Yêu: Đố Bé Chữ Cái Gì Đây? 🎈', 'QUIZ', 1, 3, 'PUBLISHED', 'APPROVED', 3, 'Bé chọn đúng chữ cái tương ứng với hình ảnh quả táo, quả bóng hoặc chú mèo.', 'https://kids-english.example/materials/age3-quiz-sheet.pdf')
      `, [alphaTopicId, alphaTopicId, alphaTopicId]);
      console.log('Seeded Alphabet lessons for Age 3');

      // Add sample vocabularies
      await conn.query(`
        INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic)
        VALUES 
        (?, 'Apple', 'Quả táo màu đỏ', '/ˈæp.əl/'),
        (?, 'Ball', 'Quả bóng tròn', '/bɔːl/'),
        (?, 'Cat', 'Chú mèo dễ thương', '/kæt/'),
        (?, 'Dog', 'Chú cún con', '/dɒɡ/')
      `, [alphaTopicId, alphaTopicId, alphaTopicId, alphaTopicId]);
      console.log('Seeded vocabularies for Alphabet');
    }
  }

  // 3. Check Course 2 (Age 4): Ensure Numbers topic exists
  const [c2] = await conn.query("SELECT id FROM courses WHERE age_group = '4' LIMIT 1");
  if (c2.length > 0) {
    const courseId4 = c2[0].id;
    const [numTopic] = await conn.query("SELECT id FROM topics WHERE course_id = ? AND name LIKE '%Numbers%'", [courseId4]);
    let numTopicId;
    if (numTopic.length === 0) {
      const [res] = await conn.query(`
        INSERT INTO topics (course_id, name, description, sort_order, status)
        VALUES (?, 'Numbers 1-10 - Tập đếm số vui nhộn 🔢', 'Bé 4 tuổi học đếm số từ 1 đến 10, đếm ngón tay và đồ vật bằng tiếng Anh', 1, 'PUBLISHED')
      `, [courseId4]);
      numTopicId = res.insertId;
      console.log('Created Numbers topic for Age 4, ID:', numTopicId);
    } else {
      numTopicId = numTopic[0].id;
    }

    const [lessons] = await conn.query('SELECT id FROM lessons WHERE topic_id = ?', [numTopicId]);
    if (lessons.length === 0) {
      await conn.query(`
        INSERT INTO lessons (topic_id, title, lesson_type, difficulty, sort_order, status, approval_status, target_age, learning_outcomes, sample_materials_url)
        VALUES 
        (?, 'Đếm Số 1 Đến 5 Cùng Những Chú Khỉ 🐒', 'VIDEO', 1, 1, 'PUBLISHED', 'APPROVED', 4, 'Bé nhận biết và đếm các số One, Two, Three, Four, Five qua hình ảnh sinh động.', 'https://kids-english.example/materials/age4-numbers-video-guide.pdf'),
        (?, 'Thẻ Từ Số Đếm & Số Lượng 1 - 10 🖐️', 'FLASHCARD', 1, 2, 'PUBLISHED', 'APPROVED', 4, 'Bé nối số với số lượng quả táo, chú gấu tương ứng từ 1 đến 10.', 'https://kids-english.example/materials/age4-flashcard-numbers.pdf'),
        (?, 'Thử Thách Nối Số: Bé Giỏi Đếm Nhanh 🎯', 'QUIZ', 1, 3, 'PUBLISHED', 'APPROVED', 4, 'Bé trả lời câu hỏi How many? và chọn đúng đáp án con số tiếng Anh.', 'https://kids-english.example/materials/age4-quiz-numbers.pdf')
      `, [numTopicId, numTopicId, numTopicId]);

      await conn.query(`
        INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic)
        VALUES 
        (?, 'One', 'Số một (1)', '/wʌn/'),
        (?, 'Two', 'Số hai (2)', '/tuː/'),
        (?, 'Three', 'Số ba (3)', '/θriː/'),
        (?, 'Four', 'Số bốn (4)', '/fɔːr/'),
        (?, 'Five', 'Số năm (5)', '/faɪv/')
      `, [numTopicId, numTopicId, numTopicId, numTopicId, numTopicId]);
      console.log('Seeded Numbers lessons & vocabularies for Age 4');
    }
  }

  // 4. Update all lessons with target_age and learning_outcomes
  await conn.query(`
    UPDATE lessons l
    JOIN topics t ON l.topic_id = t.id
    JOIN courses c ON t.course_id = c.id
    SET l.target_age = CAST(c.age_group AS UNSIGNED)
    WHERE l.target_age IS NULL
  `);

  console.log('Curriculum seeded successfully!');
  await conn.end();
}

seed().catch(console.error);
