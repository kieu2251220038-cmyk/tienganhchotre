import { Request, Response } from 'express';
import pool from '../config/database';

type UserPreferenceRow = {
  user_id: number;
  onboarding_completed: number;
  unlocked_age: number;
  avatar: string;
  sticker: string;
};

function getUserId(req: Request): number | null {
  const userId = Number(req.user?.id);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

async function ensurePreferences(userId: number): Promise<void> {
  await pool.query(
    `INSERT INTO user_preferences (user_id)
     VALUES (?)
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [userId]
  );
}

export const getUserPreferences = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
    return;
  }

  try {
    await ensurePreferences(userId);
    const [rows]: any = await pool.query(
      `SELECT user_id, onboarding_completed, unlocked_age, avatar, sticker
       FROM user_preferences WHERE user_id = ?`,
      [userId]
    );
    const preferences = rows[0] as UserPreferenceRow;
    res.status(200).json({
      user_id: preferences.user_id,
      onboarding_completed: Boolean(preferences.onboarding_completed),
      unlocked_age: Number(preferences.unlocked_age),
      avatar: preferences.avatar,
      sticker: preferences.sticker
    });
  } catch (error) {
    console.error('Lỗi lấy thiết lập người dùng:', error);
    res.status(500).json({ message: 'Không thể tải thiết lập người dùng.' });
  }
};

export const updateUserPreferences = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
    return;
  }

  const body = req.body || {};
  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.onboarding_completed === 'boolean') {
    updates.push('onboarding_completed = ?');
    values.push(body.onboarding_completed ? 1 : 0);
  }

  if (body.unlocked_age !== undefined) {
    const age = Number(body.unlocked_age);
    if (!Number.isInteger(age) || age < 3 || age > 8) {
      res.status(400).json({ message: 'Bậc mở khóa phải nằm trong khoảng 3 đến 8 tuổi.' });
      return;
    }
    updates.push('unlocked_age = GREATEST(unlocked_age, ?)');
    values.push(age);
  }

  for (const field of ['avatar', 'sticker']) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string' || body[field].trim().length === 0 || body[field].length > 32) {
        res.status(400).json({ message: `${field} không hợp lệ.` });
        return;
      }
      updates.push(`${field} = ?`);
      values.push(body[field].trim());
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ message: 'Không có dữ liệu thiết lập cần cập nhật.' });
    return;
  }

  try {
    await ensurePreferences(userId);
    await pool.query(`UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`, [...values, userId]);
    await getUserPreferences(req, res);
  } catch (error) {
    console.error('Lỗi cập nhật thiết lập người dùng:', error);
    res.status(500).json({ message: 'Không thể lưu thiết lập người dùng.' });
  }
};

export const saveSpeakingSummary = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
    return;
  }

  const {
    lessonId,
    topicId,
    completedAt,
    totalWords,
    averageScore,
    correctCount,
    incorrectCount,
    attempts
  } = req.body || {};

  if (!Number.isInteger(Number(lessonId)) || !Number.isInteger(Number(topicId)) || !Array.isArray(attempts)) {
    res.status(400).json({ message: 'Dữ liệu tổng kết luyện nói không hợp lệ.' });
    return;
  }

  try {
    const completedDate = completedAt ? new Date(completedAt) : new Date();
    const safeDate = Number.isNaN(completedDate.getTime()) ? new Date() : completedDate;
    await pool.query(
      `INSERT INTO speaking_summaries
       (user_id, lesson_id, topic_id, completed_at, total_words, average_score, correct_count, incorrect_count, attempts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        Number(lessonId),
        Number(topicId),
        safeDate,
        Math.max(0, Number(totalWords) || 0),
        Math.max(0, Math.min(100, Number(averageScore) || 0)),
        Math.max(0, Number(correctCount) || 0),
        Math.max(0, Number(incorrectCount) || 0),
        JSON.stringify(attempts)
      ]
    );
    res.status(201).json({ message: 'Đã lưu tổng kết luyện nói.', saved: true });
  } catch (error) {
    console.error('Lỗi lưu tổng kết luyện nói:', error);
    res.status(500).json({ message: 'Không thể lưu tổng kết luyện nói.' });
  }
};

export const getLatestSpeakingSummary = async (req: Request, res: Response): Promise<void> => {
  const requesterId = getUserId(req);
  if (!requesterId) {
    res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
    return;
  }

  const requestedUserId = Number(req.query.userId || requesterId);
  if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
    res.status(400).json({ message: 'userId không hợp lệ.' });
    return;
  }

  if (requestedUserId !== requesterId) {
    if (req.user?.role === 'ADMIN') {
      // Admin được xem dữ liệu phục vụ quản trị.
    } else if (req.user?.role === 'PARENT') {
      const [links]: any = await pool.query(
        'SELECT id FROM parent_children WHERE parent_id = ? AND child_id = ? LIMIT 1',
        [requesterId, requestedUserId]
      );
      if (links.length === 0) {
        res.status(403).json({ message: 'Phụ huynh không có quyền xem tổng kết của hồ sơ này.' });
        return;
      }
    } else {
      res.status(403).json({ message: 'Không có quyền xem tổng kết của người dùng khác.' });
      return;
    }
  }

  try {
    const [rows]: any = await pool.query(
      `SELECT id, user_id, lesson_id, topic_id, completed_at, total_words, average_score,
              correct_count, incorrect_count, attempts
       FROM speaking_summaries
       WHERE user_id = ?
       ORDER BY completed_at DESC, id DESC
       LIMIT 1`,
      [requestedUserId]
    );

    if (rows.length === 0) {
      res.status(200).json(null);
      return;
    }

    const summary = rows[0];
    if (typeof summary.attempts === 'string') {
      try {
        summary.attempts = JSON.parse(summary.attempts);
      } catch {
        summary.attempts = [];
      }
    }
    res.status(200).json({
      userId: Number(summary.user_id),
      lessonId: Number(summary.lesson_id),
      topicId: Number(summary.topic_id),
      completedAt: summary.completed_at,
      totalWords: Number(summary.total_words),
      averageScore: Number(summary.average_score),
      correctCount: Number(summary.correct_count),
      incorrectCount: Number(summary.incorrect_count),
      attempts: summary.attempts
    });
  } catch (error) {
    console.error('Lỗi lấy tổng kết luyện nói:', error);
    res.status(500).json({ message: 'Không thể tải tổng kết luyện nói.' });
  }
};
