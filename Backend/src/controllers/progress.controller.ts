
import { Request, Response } from 'express';
import pool from '../config/database';

// =================== BADGE DEFINITIONS ===================
interface BadgeDef {
    key: string;
    name: string;
    check: (data: { totalCompleted: number; streak: number; totalStars: number }) => boolean;
}

const BADGE_DEFINITIONS: BadgeDef[] = [
    { key: 'first_lesson', name: '🌟 Tân Binh Xuất Sắc', check: (d) => d.totalCompleted >= 1 },
    { key: 'five_lessons', name: '📚 Chăm Chỉ Học Tập', check: (d) => d.totalCompleted >= 5 },
    { key: 'ten_lessons', name: '🎓 Học Giả Nhỏ Tuổi', check: (d) => d.totalCompleted >= 10 },
    { key: 'twenty_five', name: '🏆 Siêu Sao Tiếng Anh', check: (d) => d.totalCompleted >= 25 },
    { key: 'fifty_lessons', name: '👑 Huyền Thoại Học Tập', check: (d) => d.totalCompleted >= 50 },
    { key: 'streak_3', name: '🔥 Chuỗi 3 Ngày', check: (d) => d.streak >= 3 },
    { key: 'streak_7', name: '⚡ Chuỗi 7 Ngày Học', check: (d) => d.streak >= 7 },
    { key: 'streak_30', name: '💎 Chuỗi 30 Ngày Bền Bỉ', check: (d) => d.streak >= 30 },
    { key: 'stars_50', name: '⭐ Nhà Sưu Tập Sao', check: (d) => d.totalStars >= 50 },
    { key: 'stars_200', name: '🌈 Vua Ngôi Sao', check: (d) => d.totalStars >= 200 },
];

// =================== AVATAR ITEMS (MILESTONE UNLOCKS) ===================
export const AVATAR_ITEMS = [
    { id: 1, name: 'Bé Học Sinh', emoji: '🧒', cost_stars: 0, description: 'Trang phục mặc định' },
    { id: 2, name: 'Cánh Cụt Vui', emoji: '🐧', cost_stars: 30, description: 'Đạt 30 ngôi sao' },
    { id: 3, name: 'Sư Tử Dũng Cảm', emoji: '🦁', cost_stars: 60, description: 'Đạt 60 ngôi sao' },
    { id: 4, name: 'Nhà Vô Địch', emoji: '🏆', cost_stars: 100, description: 'Đạt 100 ngôi sao' },
    { id: 5, name: 'Rồng Huyền Thoại', emoji: '🐲', cost_stars: 200, description: 'Đạt 200 ngôi sao' },
    { id: 6, name: 'Siêu Nhân Nhỏ', emoji: '🦸', cost_stars: 50, description: 'Đạt 50 ngôi sao' },
    { id: 7, name: 'Phù Thủy Thông Minh', emoji: '🧙', cost_stars: 150, description: 'Đạt 150 ngôi sao' },
];

// 1. Cập nhật tiến độ học tập — trả về chi tiết phần thưởng
export const completeLesson = async (req: Request, res: Response): Promise<void> => {
    const userId = Number(req.user?.id);
    const lessonId = Number(req.body?.lessonId);
    const requestedScore = Number(req.body?.score ?? 100);

    if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(lessonId) || lessonId <= 0) {
        res.status(400).json({ message: 'Dữ liệu hoàn thành bài học không hợp lệ.' });
        return;
    }

    const safeScore = Number.isFinite(requestedScore) ? Math.max(0, requestedScore) : 0;
    try {
        // Phần thưởng được tính từ dữ liệu bài học trên server, không tin starsEarned từ trình duyệt.
        const [lessonRows]: any = await pool.query(
            `SELECT l.lesson_type, mg.game_type
             FROM lessons l
             LEFT JOIN mini_games mg ON mg.id = l.mini_game_id
             WHERE l.id = ?`,
            [lessonId]
        );
        if (lessonRows.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy bài học.' });
            return;
        }

        const lesson = lessonRows[0];
        const firstTimeStars = lesson.lesson_type === 'GAME' && lesson.game_type && lesson.game_type !== 'MATCHING_PAIRS'
            ? 5
            : 3;

        // --- Lưu hoặc cập nhật user_progress ---
        const [existing]: any = await pool.query(
            'SELECT id, score FROM user_progress WHERE user_id = ? AND lesson_id = ?',
            [userId, lessonId]
        );

        const isFirstTime = existing.length === 0;

        if (existing.length > 0) {
            await pool.query(
                'UPDATE user_progress SET status = "COMPLETED", score = GREATEST(score, ?), completed_at = NOW() WHERE id = ?',
                [safeScore, existing[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO user_progress (user_id, lesson_id, status, score, completed_at) VALUES (?, ?, "COMPLETED", ?, NOW())',
                [userId, lessonId, safeScore]
            );
        }

        // --- Tính toán stars/coins ---
        const actualStars = isFirstTime ? firstTimeStars : Math.floor(firstTimeStars / 2);
        const coinsEarned = actualStars * 10;

        // --- Cập nhật user_rewards và tính streak ---
        const [rewards]: any = await pool.query(
            'SELECT total_stars, total_coins, current_streak, last_study_date FROM user_rewards WHERE user_id = ?',
            [userId]
        );

        let newStreak = 1;
        let newTotalStars = actualStars;
        let newTotalCoins = coinsEarned;

        if (rewards.length > 0) {
            const r = rewards[0];
            const lastDate = r.last_study_date ? new Date(r.last_study_date) : null;
            const today = new Date();
            const dayDiff = lastDate
                ? Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
                : 999;

            newStreak = dayDiff === 1 ? (r.current_streak || 0) + 1 : (dayDiff === 0 ? (r.current_streak || 1) : 1);
            newTotalStars = (r.total_stars || 0) + actualStars;
            newTotalCoins = (r.total_coins || 0) + coinsEarned;

            await pool.query(
                'UPDATE user_rewards SET total_stars = total_stars + ?, total_coins = total_coins + ?, current_streak = ?, last_study_date = CURDATE() WHERE user_id = ?',
                [actualStars, coinsEarned, newStreak, userId]
            );
        } else {
            await pool.query(
                'INSERT INTO user_rewards (user_id, total_stars, total_coins, current_streak, last_study_date) VALUES (?, ?, ?, 1, CURDATE())',
                [userId, actualStars, coinsEarned]
            );
        }

        // --- Đếm tổng bài học hoàn thành ---
        const [countRows]: any = await pool.query(
            'SELECT COUNT(*) as cnt FROM user_progress WHERE user_id = ? AND status = "COMPLETED"',
            [userId]
        );
        const totalCompleted = countRows[0]?.cnt || 1;

        // --- Kiểm tra và trao huy hiệu (badge) ---
        const [existingBadges]: any = await pool.query(
            'SELECT badge_key FROM user_badges WHERE user_id = ?',
            [userId]
        );
        const ownedKeys = new Set((existingBadges as any[]).map((b: any) => b.badge_key));

        const newBadges: string[] = [];
        for (const def of BADGE_DEFINITIONS) {
            if (!ownedKeys.has(def.key) && def.check({ totalCompleted, streak: newStreak, totalStars: newTotalStars })) {
                try {
                    await pool.query(
                        'INSERT INTO user_badges (user_id, badge_name, badge_key, earned_at) VALUES (?, ?, ?, NOW())',
                        [userId, def.name, def.key]
                    );
                    newBadges.push(def.name);
                } catch (e) {
                    // badge_key may not exist yet — skip silently
                }
            }
        }

        // --- Kiểm tra trang phục avatar mở khóa ---
        const unlockedAvatars: { name: string; emoji: string }[] = [];
        for (const item of AVATAR_ITEMS) {
            if (item.cost_stars > 0 && newTotalStars >= item.cost_stars) {
                const prevStars = newTotalStars - actualStars;
                if (prevStars < item.cost_stars) {
                    // vừa đạt ngưỡng mở khóa trang phục này
                    unlockedAvatars.push({ name: item.name, emoji: item.emoji });
                }
            }
        }

        res.status(200).json({
            message: 'Lưu tiến độ và cộng thưởng thành công!',
            starsEarned: actualStars,
            coinsEarned,
            totalStars: newTotalStars,
            totalCoins: newTotalCoins,
            currentStreak: newStreak,
            totalCompleted,
            newBadges,
            unlockedAvatars,
            isFirstTime
        });
    } catch (error) {
        console.error('Lỗi khi lưu tiến độ:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lưu tiến độ' });
    }
};

// Ghi nhận một từ vựng bé đã học qua thẻ Flashcard.
export const markVocabularyLearned = async (req: Request, res: Response): Promise<void> => {
    const userId = Number(req.user?.id);
    const vocabularyId = Number(req.body?.vocabularyId);

    if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(vocabularyId) || vocabularyId <= 0) {
        res.status(400).json({ message: 'Dữ liệu từ vựng không hợp lệ.' });
        return;
    }

    try {
        const [vocabularyRows]: any = await pool.query(
            'SELECT id FROM vocabularies WHERE id = ? LIMIT 1',
            [vocabularyId]
        );
        if (vocabularyRows.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy từ vựng.' });
            return;
        }

        await pool.query(
            `INSERT INTO user_vocabulary_progress
                (user_id, vocabulary_id, status, review_count, first_learned_at, last_reviewed_at)
             VALUES (?, ?, 'LEARNED', 1, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                status = 'LEARNED',
                review_count = review_count + 1,
                last_reviewed_at = NOW()`,
            [userId, vocabularyId]
        );

        res.status(200).json({ message: 'Đã ghi nhận từ vựng bé đã học.', vocabularyId });
    } catch (error) {
        console.error('Lỗi ghi nhận từ vựng đã học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi ghi nhận từ vựng.' });
    }
};

// 2. Lấy thông tin thưởng, sao, streak, huy hiệu và tiến độ
export const getUserRewards = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    try {
        const [userRows]: any = await pool.query(
            'SELECT id, username, display_name, age_group, role FROM users WHERE id = ?',
            [userId]
        );
        if (userRows.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
            return;
        }

        const [rewardRows]: any = await pool.query(
            'SELECT total_stars, total_coins, current_streak, last_study_date FROM user_rewards WHERE user_id = ?',
            [userId]
        );
        const rewards = rewardRows[0] || { total_stars: 0, total_coins: 0, current_streak: 0 };

        const [badgeRows]: any = await pool.query(
            'SELECT id, badge_name, badge_key, earned_at FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC',
            [userId]
        );

        const [progressRows]: any = await pool.query(
            'SELECT lesson_id, status, score, completed_at FROM user_progress WHERE user_id = ?',
            [userId]
        );

        // Tính avatar items đã mở khóa
        const totalStars = rewards.total_stars || 0;
        const unlockedAvatarItems = AVATAR_ITEMS.map((item) => ({
            ...item,
            unlocked: totalStars >= item.cost_stars
        }));

        res.status(200).json({
            user: userRows[0],
            total_stars: totalStars,
            total_coins: rewards.total_coins || 0,
            current_streak: rewards.current_streak || 0,
            badges: badgeRows || [],
            completed_lessons: progressRows || [],
            avatar_items: unlockedAvatarItems
        });
    } catch (error) {
        console.error('Lỗi chi tiết khi lấy rewards:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

// 3. Lấy bảng xếp hạng các bạn nhỏ đua rank giải đấu
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.query(
            `SELECT u.id, u.username, u.display_name, u.age_group, 
                    COALESCE(r.total_stars, 0) as total_stars, 
                    COALESCE(r.total_coins, 0) as total_coins, 
                    COALESCE(r.current_streak, 0) as current_streak,
                    u.created_at
             FROM users u
             LEFT JOIN user_rewards r ON u.id = r.user_id
             WHERE u.role = 'USER'
             ORDER BY total_stars DESC, current_streak DESC
             LIMIT 30`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Lỗi lấy leaderboard:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy bảng xếp hạng' });
    }
};
