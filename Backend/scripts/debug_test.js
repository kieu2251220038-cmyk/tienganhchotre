const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'kids_english_db'});
  const parentId = 12;
  try {
    const [children] = await conn.query(`
      SELECT 
        u.id, u.username, u.display_name, u.age_group, 
        u.daily_goal_minutes, u.created_at,
        COALESCE(r.current_streak, 5) as current_streak, 
        COALESCE(r.total_stars, 120) as total_stars, 
        COALESCE(r.total_coins, 350) as total_coins,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND is_completed = 1) as completed_lessons,
        COALESCE((SELECT relationship FROM parent_children WHERE parent_id = ? AND child_id = u.id LIMIT 1), 'Con') as relationship
      FROM users u
      LEFT JOIN user_rewards r ON r.user_id = u.id
      WHERE u.role = 'USER'
      ORDER BY u.id ASC
      LIMIT 10
    `, [parentId]);
    console.log('Result successfully fetched:', children.length);
  } catch(e) {
    console.error('Error is:', e);
  }
  await conn.end();
}
test();
