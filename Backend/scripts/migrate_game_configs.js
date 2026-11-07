const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'kids_english_db'
  });

  await c.query(`
    CREATE TABLE IF NOT EXISTS game_configs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      topic_id VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      game_type VARCHAR(100) NOT NULL,
      topic_name VARCHAR(255) NOT NULL,
      difficulty INT DEFAULT 1,
      points INT DEFAULT 100,
      is_active TINYINT(1) DEFAULT 1,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('Bảng game_configs đã tạo!');

  const [rows] = await c.query('SELECT COUNT(*) as cnt FROM game_configs');
  if (rows[0].cnt === 0) {
    await c.query(`
      INSERT INTO game_configs (topic_id, name, game_type, topic_name, difficulty, points, is_active) VALUES
      ('animals', 'Mini Game: Ghep Tu & Tranh Dong Vat', 'MATCHING_PAIRS', 'Animals - Dong vat', 1, 100, 1),
      ('colors',  'Mini Game: Tim Mau Sac Bi An',        'COLOR_PICKER',   'Colors - Mau sac',   1,  80, 1),
      ('fruits',  'Mini Game: Tri Nho Hoa Qua Ngot',     'MEMORY_FLIP',    'Fruits - Hoa qua',   1,  90, 1),
      ('toys',    'Mini Game: Noi Hinh Do Choi',          'MATCHING_PAIRS', 'Toys - Do choi',     1, 100, 1),
      ('school',  'Mini Game: Do Dung Hoc Tap',           'LISTEN_PICK',    'School - Truong hoc',2, 120, 0)
    `);
    console.log('Da them 5 game mac dinh!');
  } else {
    console.log('Bang da co du lieu:', rows[0].cnt, 'games');
  }

  const [games] = await c.query('SELECT id, topic_id, name, is_active, points FROM game_configs');
  console.log('Games:', JSON.stringify(games));
  await c.end();
})().catch(console.error);
