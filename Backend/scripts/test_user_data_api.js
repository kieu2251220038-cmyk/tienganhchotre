const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = `http://localhost:${process.env.PORT || 5000}/api`;
const username = `__user_data_api_test_${Date.now()}`;

async function request(pathname, options = {}) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${pathname} ${response.status}: ${JSON.stringify(data)}`);
  return data;
}

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kids_english_db'
  });

  let userId = null;
  try {
    const registered = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password: '123456', displayName: 'API test', ageGroup: '6' })
    });
    userId = registered.user.id;
    const headers = { Authorization: `Bearer ${registered.token}` };

    const initial = await request('/user-data/preferences', { headers });
    const updated = await request('/user-data/preferences', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ onboarding_completed: true, unlocked_age: 7, avatar: '🦊', sticker: '⭐' })
    });

    await request('/user-data/speaking-summaries', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        lessonId: 1,
        topicId: 1,
        completedAt: new Date().toISOString(),
        totalWords: 1,
        averageScore: 90,
        correctCount: 1,
        incorrectCount: 0,
        attempts: [{ index: 0, word: 'Hello', recognized: 'Hello', score: 90, correct: true }]
      })
    });
    const latestSummary = await request('/user-data/speaking-summaries/latest', { headers });

    if (initial.unlocked_age !== 6 || !updated.onboarding_completed || updated.unlocked_age !== 7 || updated.avatar !== '🦊' || updated.sticker !== '⭐' || latestSummary.averageScore !== 90) {
      throw new Error('User data API returned unexpected data.');
    }

    console.log('PASS user data API: preferences + speaking summaries');
  } finally {
    if (userId) {
      await db.query('DELETE FROM speaking_summaries WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM user_preferences WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM user_progress WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM user_badges WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM user_rewards WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM users WHERE id = ?', [userId]);
    }
    await db.end();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
