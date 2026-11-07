import { Request, Response } from 'express';
import pool from '../config/database';

const GAME_TYPES = ['MATCHING_PAIRS', 'MEMORY_CARDS', 'LISTEN_AND_PICK', 'COUNT_OBJECTS', 'ORDER_SENTENCE'] as const;

const gameSelect = `
    SELECT mg.*, t.name AS topic_name, t.sort_order AS topic_sort_order, t.course_id, c.title AS course_title, c.age_group
    FROM mini_games mg
    INNER JOIN topics t ON t.id = mg.topic_id
    INNER JOIN courses c ON c.id = t.course_id
`;

const validateGamePayload = (body: Record<string, unknown>): string | null => {
    if (!Number.isInteger(Number(body.topic_id)) || Number(body.topic_id) <= 0) return 'Vui lòng chọn chủ đề cho mini game.';
    if (typeof body.name !== 'string' || !body.name.trim()) return 'Tên mini game không được để trống.';
    if (!GAME_TYPES.includes(body.game_type as typeof GAME_TYPES[number])) return 'Loại mini game không hợp lệ.';
    if (!Number.isInteger(Number(body.difficulty)) || Number(body.difficulty) < 1 || Number(body.difficulty) > 5) return 'Độ khó phải nằm trong khoảng từ 1 đến 5.';
    if (!Number.isInteger(Number(body.points)) || Number(body.points) < 1) return 'Điểm thưởng phải là số nguyên lớn hơn 0.';
    return null;
};

const syncGameLesson = async (connection: any, game: { id: number; topic_id: number; name: string; difficulty: number }): Promise<void> => {
    const [linkedLessons]: any = await connection.query(
        'SELECT id FROM lessons WHERE mini_game_id = ? LIMIT 1',
        [game.id]
    );

    if (linkedLessons.length) {
        await connection.query(
            `UPDATE lessons
             SET topic_id = ?, title = ?, lesson_type = 'GAME', difficulty = ?, status = 'DRAFT', approval_status = 'PENDING',
                 reviewed_by = NULL, reviewed_at = NULL, review_notes = NULL
             WHERE id = ?`,
            [game.topic_id, game.name, game.difficulty, linkedLessons[0].id]
        );
        return;
    }

    const [orderRows]: any = await connection.query(
        'SELECT COALESCE(MAX(sort_order), 0) AS max_sort_order FROM lessons WHERE topic_id = ?',
        [game.topic_id]
    );
    await connection.query(
        `INSERT INTO lessons (topic_id, mini_game_id, title, lesson_type, difficulty, sort_order, status, approval_status)
         VALUES (?, ?, ?, 'GAME', ?, ?, 'DRAFT', 'PENDING')`,
        [game.topic_id, game.id, game.name, game.difficulty, Number(orderRows[0].max_sort_order) + 1]
    );
};

export const getAdminMiniGames = async (_req: Request, res: Response): Promise<void> => {
    try {
        const [games] = await pool.query(`${gameSelect} ORDER BY c.id, t.sort_order, mg.sort_order, mg.id`);
        res.status(200).json(games);
    } catch (error) {
        console.error('Lỗi lấy danh sách mini game:', error);
        res.status(500).json({ message: 'Không thể lấy danh sách mini game.' });
    }
};

export const getActiveMiniGames = async (req: Request, res: Response): Promise<void> => {
    const { courseId, topicId, gameId } = req.query;
    const conditions = [
        'mg.is_active = 1',
        't.status = "PUBLISHED"',
        `EXISTS (
            SELECT 1 FROM lessons l_approval
            WHERE l_approval.mini_game_id = mg.id
              AND l_approval.status = "PUBLISHED"
              AND l_approval.approval_status = "APPROVED"
        )`
    ];
    const params: Array<string | number> = [];

    if (typeof courseId === 'string' && /^\d+$/.test(courseId)) {
        conditions.push('t.course_id = ?');
        params.push(Number(courseId));
    }
    if (typeof topicId === 'string' && /^\d+$/.test(topicId)) {
        conditions.push('mg.topic_id = ?');
        params.push(Number(topicId));
    }
    if (typeof gameId === 'string' && /^\d+$/.test(gameId)) {
        conditions.push('mg.id = ?');
        params.push(Number(gameId));
    }

    try {
        const [games] = await pool.query(`${gameSelect} WHERE ${conditions.join(' AND ')} ORDER BY c.id, t.sort_order, mg.sort_order, mg.id`, params);
        res.status(200).json(games);
    } catch (error) {
        console.error('Lỗi lấy mini game cho học sinh:', error);
        res.status(500).json({ message: 'Không thể tải mini game.' });
    }
};

export const createAdminMiniGame = async (req: Request, res: Response): Promise<void> => {
    const errorMessage = validateGamePayload(req.body);
    if (errorMessage) {
        res.status(400).json({ message: errorMessage });
        return;
    }

    const { topic_id, name, game_type, difficulty, points, is_active = true, sort_order = 1 } = req.body;
    try {
        const [result]: any = await pool.query(
            `INSERT INTO mini_games (topic_id, name, game_type, difficulty, points, is_active, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [Number(topic_id), name.trim(), game_type, Number(difficulty), Number(points), is_active ? 1 : 0, Number(sort_order) || 1]
        );
        await syncGameLesson(pool, {
            id: result.insertId,
            topic_id: Number(topic_id),
            name: name.trim(),
            difficulty: Number(difficulty)
        });
        res.status(201).json({ id: result.insertId, message: 'Đã tạo mini game thành công!' });
    } catch (error) {
        console.error('Lỗi tạo mini game:', error);
        res.status(500).json({ message: 'Không thể tạo mini game.' });
    }
};

export const updateAdminMiniGame = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const errorMessage = validateGamePayload(req.body);
    if (errorMessage) {
        res.status(400).json({ message: errorMessage });
        return;
    }

    const { topic_id, name, game_type, difficulty, points, is_active, sort_order = 1 } = req.body;
    try {
        const [result]: any = await pool.query(
            `UPDATE mini_games
             SET topic_id = ?, name = ?, game_type = ?, difficulty = ?, points = ?, is_active = ?, sort_order = ?
             WHERE id = ?`,
            [Number(topic_id), name.trim(), game_type, Number(difficulty), Number(points), is_active ? 1 : 0, Number(sort_order) || 1, id]
        );
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Không tìm thấy mini game cần cập nhật.' });
            return;
        }
        await syncGameLesson(pool, {
            id: Number(id),
            topic_id: Number(topic_id),
            name: name.trim(),
            difficulty: Number(difficulty)
        });
        res.status(200).json({ message: 'Đã cập nhật mini game thành công!' });
    } catch (error) {
        console.error('Lỗi cập nhật mini game:', error);
        res.status(500).json({ message: 'Không thể cập nhật mini game.' });
    }
};

export const updateAdminMiniGameStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
        res.status(400).json({ message: 'Trạng thái mini game không hợp lệ.' });
        return;
    }

    try {
        const [result]: any = await pool.query('UPDATE mini_games SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Không tìm thấy mini game cần thay đổi trạng thái.' });
            return;
        }
        res.status(200).json({ message: is_active ? 'Đã bật mini game cho học sinh.' : 'Đã tắt mini game cho học sinh.' });
    } catch (error) {
        console.error('Lỗi đổi trạng thái mini game:', error);
        res.status(500).json({ message: 'Không thể cập nhật trạng thái mini game.' });
    }
};

export const deleteAdminMiniGame = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        

        const [linkedLessons]: any = await pool.query(
            'SELECT id FROM lessons WHERE mini_game_id = ? FOR UPDATE',
            [id]
        );
        const lessonIds = linkedLessons.map((lesson: { id: number }) => lesson.id);

        if (lessonIds.length > 0) {
            const placeholders = lessonIds.map(() => '?').join(', ');
            await pool.query(
                `DELETE a FROM answers a
                 INNER JOIN questions q ON q.id = a.question_id
                 WHERE q.lesson_id IN (${placeholders})`,
                lessonIds
            );
            await pool.query(
                `DELETE FROM questions WHERE lesson_id IN (${placeholders})`,
                lessonIds
            );
            await pool.query(
                `DELETE FROM user_progress WHERE lesson_id IN (${placeholders})`,
                lessonIds
            );
            await pool.query('DELETE FROM lessons WHERE mini_game_id = ?', [id]);
        }

        const [result]: any = await pool.query('DELETE FROM mini_games WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Không tìm thấy mini game cần xóa.' });
            return;
        }
        res.status(200).json({ message: 'Đã xóa mini game thành công!' });
    } catch (error) {
        console.error('Lỗi xóa mini game:', error);
        res.status(500).json({ message: 'Không thể xóa mini game.' });
    }
};
