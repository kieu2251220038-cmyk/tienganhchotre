const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'kids_english_db'
  });

  console.log('Connected to MySQL. Running migrations...');

  // 1. Update users role enum
  await conn.query(`
    ALTER TABLE users MODIFY COLUMN role ENUM('USER', 'ADMIN', 'EXPERT', 'PARENT') DEFAULT 'USER'
  `);
  console.log('Updated users role enum to include EXPERT and PARENT.');

  // 2. Add columns to users table if not exist
  const [userCols] = await conn.query('DESCRIBE users');
  const userColNames = userCols.map(c => c.Field);

  if (!userColNames.includes('parent_id')) {
    await conn.query('ALTER TABLE users ADD COLUMN parent_id INT NULL');
    console.log('Added parent_id to users');
  }
  if (!userColNames.includes('daily_goal_minutes')) {
    await conn.query('ALTER TABLE users ADD COLUMN daily_goal_minutes INT DEFAULT 15');
    console.log('Added daily_goal_minutes to users');
  }

  // 3. Table parent_children
  await conn.query(`
    CREATE TABLE IF NOT EXISTS parent_children (
      id INT AUTO_INCREMENT PRIMARY KEY,
      parent_id INT NOT NULL,
      child_id INT NOT NULL,
      relationship VARCHAR(50) DEFAULT 'Phụ huynh',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_parent_child (parent_id, child_id)
    )
  `);
  console.log('Verified table parent_children.');

  // 4. Update lessons table
  const [lessonCols] = await conn.query('DESCRIBE lessons');
  const lessonColNames = lessonCols.map(c => c.Field);

  if (!lessonColNames.includes('approval_status')) {
    await conn.query("ALTER TABLE lessons ADD COLUMN approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED'");
    console.log('Added approval_status to lessons');
  }
  if (!lessonColNames.includes('reviewed_by')) {
    await conn.query('ALTER TABLE lessons ADD COLUMN reviewed_by INT NULL');
    console.log('Added reviewed_by to lessons');
  }
  if (!lessonColNames.includes('review_notes')) {
    await conn.query('ALTER TABLE lessons ADD COLUMN review_notes TEXT NULL');
    console.log('Added review_notes to lessons');
  }
  if (!lessonColNames.includes('reviewed_at')) {
    await conn.query('ALTER TABLE lessons ADD COLUMN reviewed_at DATETIME NULL');
    console.log('Added reviewed_at to lessons');
  }
  if (!lessonColNames.includes('target_age')) {
    await conn.query('ALTER TABLE lessons ADD COLUMN target_age INT NULL');
    console.log('Added target_age to lessons');
  }
  if (!lessonColNames.includes('learning_outcomes')) {
    await conn.query('ALTER TABLE lessons ADD COLUMN learning_outcomes TEXT NULL');
    console.log('Added learning_outcomes to lessons');
  }
  if (!lessonColNames.includes('sample_materials_url')) {
    await conn.query('ALTER TABLE lessons ADD COLUMN sample_materials_url VARCHAR(255) NULL');
    console.log('Added sample_materials_url to lessons');
  }

  // 5. Seed default EXPERT and PARENT accounts if not present
  const [expertUser] = await conn.query("SELECT id FROM users WHERE role = 'EXPERT' LIMIT 1");
  let expertId = expertUser.length ? expertUser[0].id : null;
  if (!expertId) {
    const [res] = await conn.query(`
      INSERT INTO users (username, password_hash, display_name, role, age_group)
      VALUES ('chuyengia_minhanh', '$2a$10$XqfNlO9a27e/L6Z4X2v8e.K4XQ/9Jb3U7yL6K0Zp5o1j2k3l4m5n6', 'TS. Minh Anh (Chuyên Gia Giáo Dục)', 'EXPERT', '6')
    `);
    expertId = res.insertId;
    console.log('Seeded expert account: chuyengia_minhanh, ID:', expertId);
  }

  const [parentUser] = await conn.query("SELECT id FROM users WHERE role = 'PARENT' LIMIT 1");
  let parentId = parentUser.length ? parentUser[0].id : null;
  if (!parentId) {
    const [res] = await conn.query(`
      INSERT INTO users (username, password_hash, display_name, role, age_group)
      VALUES ('phuhuynh_huong', '$2a$10$XqfNlO9a27e/L6Z4X2v8e.K4XQ/9Jb3U7yL6K0Zp5o1j2k3l4m5n6', 'Mẹ Thu Hương (Phụ huynh bé Nga & Bo)', 'PARENT', '6')
    `);
    parentId = res.insertId;
    console.log('Seeded parent account: phuhuynh_huong, ID:', parentId);
  }

  // Link parent to kid users (e.g. user 6: Nga, and another child)
  const [kids] = await conn.query("SELECT id, display_name, age_group FROM users WHERE role = 'USER' LIMIT 3");
  for (const kid of kids) {
    await conn.query(`
      INSERT IGNORE INTO parent_children (parent_id, child_id, relationship)
      VALUES (?, ?, 'Mẹ')
    `, [parentId, kid.id]);
    await conn.query('UPDATE users SET parent_id = ? WHERE id = ?', [parentId, kid.id]);
  }
  console.log(`Linked parent (ID: ${parentId}) to ${kids.length} children.`);

  // 6. Check lessons and update target_age based on course / topic
  await conn.query(`
    UPDATE lessons l
    JOIN topics t ON l.topic_id = t.id
    JOIN courses c ON t.course_id = c.id
    SET l.target_age = CAST(c.age_group AS UNSIGNED)
    WHERE l.target_age IS NULL
  `);
  console.log('Synchronized target_age for existing lessons from courses.');

  // Set some sample learning outcomes & review notes
  await conn.query(`
    UPDATE lessons 
    SET learning_outcomes = 'Bé nhận biết mặt chữ/số, luyện phát âm chuẩn bản xứ, phản xạ nhận biết qua tranh ảnh và hình ảnh trực quan sinh động.',
        sample_materials_url = 'https://kids-english-materials.example/sample-lesson.pdf'
    WHERE learning_outcomes IS NULL
  `);

  // Ensure we have some PENDING, APPROVED, REJECTED lessons for the expert to review
  const [allLessons] = await conn.query('SELECT id FROM lessons ORDER BY id LIMIT 6');
  if (allLessons.length >= 3) {
    await conn.query("UPDATE lessons SET approval_status = 'APPROVED', reviewed_at = NOW(), reviewed_by = ? WHERE id = ?", [expertId, allLessons[0].id]);
    await conn.query("UPDATE lessons SET approval_status = 'PENDING', reviewed_at = NULL, reviewed_by = NULL WHERE id = ?", [allLessons[1].id]);
    if (allLessons[2]) {
      await conn.query("UPDATE lessons SET approval_status = 'REJECTED', review_notes = 'Cần bổ sung thêm ví dụ tranh minh họa tươi sáng và giảm tốc độ đọc âm audio cho trẻ 3 tuổi.', reviewed_at = NOW(), reviewed_by = ? WHERE id = ?", [expertId, allLessons[2].id]);
    }
    console.log('Configured sample approval statuses (APPROVED, PENDING, REJECTED) for testing.');
  }

  console.log('Migration completed successfully!');
  await conn.end();
}

migrate().catch(console.error);
