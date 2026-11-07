import { Request, Response } from 'express';
import pool from '../config/database';

const CHEST_REWARD_STARS = 10;
const CHEST_REWARD_COINS = 100;

function getUserId(req: Request): number | null {
    const userId = Number(req.user?.id);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function normalizeAge(value: unknown): number | null {
    const age = Number(value);
    return Number.isInteger(age) && age >= 3 && age <= 8 ? age : null;
}

async function getAccountAge(connection: any, userId: number): Promise<number> {
    const [rows]: any = await connection.query('SELECT age_group FROM users WHERE id = ?', [userId]);
    return normalizeAge(rows[0]?.age_group) || 3;
}

async function getChestProgress(connection: any, userId: number, ageGroup: number, accountAge: number) {
    const interactiveIsAvailable = accountAge >= 8 || ageGroup <= accountAge;
    const interactiveFilter = interactiveIsAvailable
        ? ''
        : 'AND l.lesson_type IN ("FLASHCARD", "VIDEO")';

    const [rows]: any = await connection.query(
        `SELECT
            COUNT(l.id) AS total_lessons,
            COALESCE(SUM(CASE WHEN up.status = 'COMPLETED' THEN 1 ELSE 0 END), 0) AS completed_lessons
         FROM lessons l
         JOIN topics t ON t.id = l.topic_id
         JOIN courses c ON c.id = t.course_id
         LEFT JOIN mini_games mg ON mg.id = l.mini_game_id
         LEFT JOIN user_progress up ON up.user_id = ? AND up.lesson_id = l.id
         WHERE c.age_group = ?
           AND l.status = 'PUBLISHED'
           AND l.approval_status = 'APPROVED'
           AND (l.lesson_type <> 'GAME' OR (mg.id IS NOT NULL AND mg.is_active = 1))
           ${interactiveFilter}`,
        [userId, String(ageGroup)]
    );

    return {
        totalLessons: Number(rows[0]?.total_lessons || 0),
        completedLessons: Number(rows[0]?.completed_lessons || 0)
    };
}

async function getRewardTotals(connection: any, userId: number) {
    const [rows]: any = await connection.query(
        'SELECT total_stars, total_coins FROM user_rewards WHERE user_id = ?',
        [userId]
    );
    return {
        totalStars: Number(rows[0]?.total_stars || 0),
        totalCoins: Number(rows[0]?.total_coins || 0)
    };
}

function buildLevelMessage(ageGroup: number) {
    return ageGroup < 8
        ? `Chúc mừng! Bé đã hoàn thành Bậc ${ageGroup} tuổi và có thể khám phá Bậc ${ageGroup + 1} tuổi!`
        : 'Chúc mừng! Bé đã hoàn thành Bậc cao nhất và mở toàn bộ kho báu!';
}

export const getChestStatus = async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const ageGroup = normalizeAge(req.params.ageGroup);
    if (!userId || !ageGroup) {
        res.status(400).json({ message: 'Thông tin người dùng hoặc Bậc tuổi không hợp lệ.' });
        return;
    }

    try {
        const accountAge = await getAccountAge(pool, userId);
        const progress = await getChestProgress(pool, userId, ageGroup, accountAge);
        const [claims]: any = await pool.query(
            'SELECT reward_stars, reward_coins, claimed_at FROM user_chest_claims WHERE user_id = ? AND age_group = ?',
            [userId, ageGroup]
        );
        const claim = claims[0];

        res.status(200).json({
            ageGroup,
            eligible: progress.totalLessons > 0 && progress.completedLessons >= progress.totalLessons,
            claimed: Boolean(claim),
            rewardStars: Number(claim?.reward_stars || 0),
            rewardCoins: Number(claim?.reward_coins || 0),
            claimedAt: claim?.claimed_at || null
        });
    } catch (error) {
        console.error('Lỗi kiểm tra trạng thái rương:', error);
        res.status(500).json({ message: 'Không thể kiểm tra trạng thái rương.' });
    }
};

export const claimChest = async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const ageGroup = normalizeAge(req.body?.ageGroup);
    if (!userId || !ageGroup) {
        res.status(400).json({ message: 'Thông tin người dùng hoặc Bậc tuổi không hợp lệ.' });
        return;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const accountAge = await getAccountAge(connection, userId);
        const progress = await getChestProgress(connection, userId, ageGroup, accountAge);
        if (progress.totalLessons === 0 || progress.completedLessons < progress.totalLessons) {
            await connection.rollback();
            res.status(400).json({
                message: 'Bé hãy hoàn thành các phần được mở của Bậc này trước khi mở rương.',
                ageGroup,
                eligible: false
            });
            return;
        }

        const [insertResult]: any = await connection.query(
            `INSERT IGNORE INTO user_chest_claims
             (user_id, age_group, reward_stars, reward_coins)
             VALUES (?, ?, ?, ?)`,
            [userId, ageGroup, CHEST_REWARD_STARS, CHEST_REWARD_COINS]
        );

        if (Number(insertResult.affectedRows) === 0) {
            const totals = await getRewardTotals(connection, userId);
            await connection.commit();
            res.status(200).json({
                message: 'Rương của Bậc này đã được mở trước đó.',
                ageGroup,
                claimed: true,
                alreadyClaimed: true,
                rewardStars: 0,
                rewardCoins: 0,
                ...totals,
                nextAge: ageGroup < 8 ? ageGroup + 1 : null,
                levelUpMessage: buildLevelMessage(ageGroup)
            });
            return;
        }

        await connection.query(
            `INSERT INTO user_rewards (user_id, total_stars, total_coins, current_streak)
             VALUES (?, ?, ?, 0)
             ON DUPLICATE KEY UPDATE
               total_stars = total_stars + VALUES(total_stars),
               total_coins = total_coins + VALUES(total_coins)`,
            [userId, CHEST_REWARD_STARS, CHEST_REWARD_COINS]
        );

        const totals = await getRewardTotals(connection, userId);
        await connection.commit();
        res.status(200).json({
            message: 'Mở rương thành công!',
            ageGroup,
            claimed: true,
            alreadyClaimed: false,
            rewardStars: CHEST_REWARD_STARS,
            rewardCoins: CHEST_REWARD_COINS,
            ...totals,
            nextAge: ageGroup < 8 ? ageGroup + 1 : null,
            levelUpMessage: buildLevelMessage(ageGroup)
        });
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi mở rương:', error);
        res.status(500).json({ message: 'Không thể mở rương phần thưởng.' });
    } finally {
        connection.release();
    }
};
