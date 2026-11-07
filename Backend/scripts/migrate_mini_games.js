const mysql = require('mysql2/promise');

const legacyTypeMap = {
  MATCHING_PAIRS: 'MATCHING_PAIRS',
  COLOR_PICKER: 'MEMORY_CARDS',
  MEMORY_FLIP: 'MEMORY_CARDS',
  LISTEN_PICK: 'LISTEN_AND_PICK'
};

const legacyTopicPrefixes = {
  animals: 'Animals%',
  colors: 'Colors%',
  fruits: 'Fruits%',
  toys: 'Toys%',
  school: 'School%'
};

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'kids_english_db'
  });

  try {
    await connection.beginTransaction();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS mini_games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        game_type VARCHAR(50) NOT NULL,
        difficulty TINYINT UNSIGNED NOT NULL DEFAULT 1,
        points INT UNSIGNED NOT NULL DEFAULT 100,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_mini_games_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        INDEX idx_mini_games_topic_active (topic_id, is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // One GAME lesson is linked to one mini game. This makes every game an
    // independent stage in the child's learning path.
    const [miniGameLessonColumn] = await connection.query("SHOW COLUMNS FROM lessons LIKE 'mini_game_id'");
    if (!miniGameLessonColumn.length) {
      await connection.query('ALTER TABLE lessons ADD COLUMN mini_game_id INT NULL');
    }
    const [miniGameLessonIndex] = await connection.query("SHOW INDEX FROM lessons WHERE Key_name = 'uq_lessons_mini_game_id'");
    if (!miniGameLessonIndex.length) {
      await connection.query('CREATE UNIQUE INDEX uq_lessons_mini_game_id ON lessons (mini_game_id)');
    }

    const [legacyTables] = await connection.query("SHOW TABLES LIKE 'game_configs'");
    if (legacyTables.length > 0) {
      const [legacyGames] = await connection.query('SELECT * FROM game_configs ORDER BY id');
      for (const game of legacyGames) {
        const prefix = legacyTopicPrefixes[game.topic_id];
        if (!prefix) continue;
        const [topics] = await connection.query('SELECT id FROM topics WHERE name LIKE ? ORDER BY id LIMIT 1', [prefix]);
        if (!topics.length) continue;

        const topicId = topics[0].id;
        const [existing] = await connection.query('SELECT id FROM mini_games WHERE topic_id = ? LIMIT 1', [topicId]);
        if (existing.length) continue;

        await connection.query(
          `INSERT INTO mini_games (topic_id, name, game_type, difficulty, points, is_active, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            topicId,
            game.name,
            legacyTypeMap[game.game_type] || 'MATCHING_PAIRS',
            Math.max(1, Math.min(5, Number(game.difficulty) || 1)),
            Math.max(1, Number(game.points) || 100),
            game.is_active ? 1 : 0
          ]
        );
      }
    }

    const [topics] = await connection.query('SELECT id, name, course_id, sort_order FROM topics ORDER BY course_id, sort_order, id');
    const gameTypes = ['MATCHING_PAIRS', 'MEMORY_CARDS', 'LISTEN_AND_PICK'];
    for (let index = 0; index < topics.length; index += 1) {
      const topic = topics[index];
      const [existing] = await connection.query('SELECT id FROM mini_games WHERE topic_id = ? LIMIT 1', [topic.id]);
      if (existing.length) continue;

      await connection.query(
        `INSERT INTO mini_games (topic_id, name, game_type, difficulty, points, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, 1, 1)`,
        [
          topic.id,
          `Mini Game: ${topic.name}`,
          gameTypes[index % gameTypes.length],
          Math.max(1, Math.min(5, Number(topic.course_id))),
          60 + Number(topic.course_id) * 20
        ]
      );
    }

    const [miniGames] = await connection.query(`
      SELECT mg.id, mg.topic_id, mg.name, mg.difficulty
      FROM mini_games mg
      INNER JOIN topics t ON t.id = mg.topic_id
      ORDER BY t.course_id, t.sort_order, mg.sort_order, mg.id
    `);

    for (const game of miniGames) {
      const [linkedLessons] = await connection.query(
        'SELECT id FROM lessons WHERE mini_game_id = ? LIMIT 1',
        [game.id]
      );

      if (linkedLessons.length) {
        await connection.query(
          `UPDATE lessons
           SET topic_id = ?, title = ?, lesson_type = 'GAME', difficulty = ?, status = 'PUBLISHED', approval_status = 'APPROVED'
           WHERE id = ?`,
          [game.topic_id, game.name, game.difficulty, linkedLessons[0].id]
        );
        continue;
      }

      // Reuse one old, unlinked GAME lesson when upgrading existing data.
      const [legacyLessons] = await connection.query(
        `SELECT id FROM lessons
         WHERE topic_id = ? AND lesson_type = 'GAME' AND mini_game_id IS NULL
         ORDER BY sort_order, id LIMIT 1`,
        [game.topic_id]
      );

      if (legacyLessons.length) {
        await connection.query(
          `UPDATE lessons
           SET mini_game_id = ?, title = ?, difficulty = ?, status = 'PUBLISHED', approval_status = 'APPROVED'
           WHERE id = ?`,
          [game.id, game.name, game.difficulty, legacyLessons[0].id]
        );
        continue;
      }

      const [orderRows] = await connection.query(
        'SELECT COALESCE(MAX(sort_order), 0) AS max_sort_order FROM lessons WHERE topic_id = ?',
        [game.topic_id]
      );
      await connection.query(
        `INSERT INTO lessons (topic_id, mini_game_id, title, lesson_type, difficulty, sort_order, status, approval_status)
         VALUES (?, ?, ?, 'GAME', ?, ?, 'PUBLISHED', 'APPROVED')`,
        [game.topic_id, game.id, game.name, game.difficulty, Number(orderRows[0].max_sort_order) + 1]
      );
    }

    await connection.commit();
    const [games] = await connection.query('SELECT COUNT(*) AS count FROM mini_games');
    console.log(`Mini game migration completed: ${games[0].count} games linked to individual lessons.`);
  } catch (error) {
    await connection.rollback();
    console.error('Mini game migration failed:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
})();
