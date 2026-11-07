import { Request, Response } from 'express';
import pool from '../config/database';

function toPublicMediaUrl(req: Request, fileUrl: string | null | undefined): string | null {
    if (!fileUrl) return null;
    if (/^(https?:)?\/\//i.test(fileUrl) || fileUrl.startsWith('data:')) return fileUrl;
    const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${req.protocol}://${req.get('host')}${normalizedPath}`;
}

// 1. Lấy danh sách Chủ đề (Topics) theo course_id
export const getTopicsByCourse = async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    try {
        let sql = 'SELECT * FROM topics WHERE status = "PUBLISHED" ORDER BY course_id ASC, sort_order ASC';
        let params: any[] = [];
        if (courseId && courseId !== 'all') {
            sql = 'SELECT * FROM topics WHERE course_id = ? AND status = "PUBLISHED" ORDER BY sort_order ASC';
            params = [courseId];
        }
        const [topics] = await pool.query(sql, params);
        res.status(200).json(topics);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách chủ đề:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

// 2. Lấy danh sách Bài học (Lessons) theo topic_id
export const getLessonsByTopic = async (req: Request, res: Response): Promise<void> => {
    const { topicId } = req.params;
    try {
        const [lessons] = await pool.query(
            `SELECT l.*, u_rev.display_name AS reviewer_name
             FROM lessons l
             LEFT JOIN mini_games mg ON mg.id = l.mini_game_id
             LEFT JOIN users u_rev ON l.reviewed_by = u_rev.id
             WHERE l.topic_id = ?
               AND l.status = "PUBLISHED"
               AND l.approval_status = "APPROVED"
               AND (l.lesson_type <> "GAME" OR (mg.id IS NOT NULL AND mg.is_active = 1))
             ORDER BY l.sort_order ASC`,
            [topicId]
        );
        res.status(200).json(lessons);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bài học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

// 3. Lấy Từ vựng (Vocabularies) thuộc Bài học/Chủ đề
export const getVocabulariesByTopic = async (req: Request, res: Response): Promise<void> => {
    const { topicId } = req.params;
    try {
        const [vocabularies]: any = await pool.query(
            `SELECT v.*, m.file_url AS image_url
             FROM vocabularies v
             LEFT JOIN media_assets m ON m.id = v.image_id
             WHERE v.topic_id = ?`, 
            [topicId]
        );
        res.status(200).json(vocabularies.map((v: any) => ({
            ...v,
            image_url: toPublicMediaUrl(req, v.image_url),
            audio_url: toPublicMediaUrl(req, v.audio_url)
        })));
    } catch (error) {
        console.error('Lỗi khi lấy danh sách từ vựng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};
// 4. Lấy chi tiết bài học kèm câu hỏi, đáp án và từ vựng
export const getLessonById = async (req: Request, res: Response): Promise<void> => {
    const { lessonId } = req.params;
    try {
        const [lessons]: any = await pool.query(
            `SELECT l.*, c.age_group AS age_group, u_rev.display_name AS reviewer_name
             FROM lessons l
             JOIN topics t ON t.id = l.topic_id
             JOIN courses c ON c.id = t.course_id
             LEFT JOIN users u_rev ON l.reviewed_by = u_rev.id
             WHERE l.id = ?
               AND l.status = "PUBLISHED"
               AND l.approval_status = "APPROVED"`,
            [lessonId]
        );
        if (lessons.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy bài học' });
            return;
        }

        const lesson = lessons[0];

        // Lấy từ vựng thuộc topic của bài học
        const [vocabularies]: any = await pool.query(
            'SELECT v.*, m_img.file_url as image_url, m_aud.file_url as audio_url FROM vocabularies v LEFT JOIN media_assets m_img ON v.image_id = m_img.id LEFT JOIN media_assets m_aud ON v.audio_id = m_aud.id WHERE v.topic_id = ?',
            [lesson.topic_id]
        );

        // Lấy câu hỏi thuộc bài học
        const [questions]: any = await pool.query(
            'SELECT q.*, m.file_url as media_url FROM questions q LEFT JOIN media_assets m ON q.media_id = m.id WHERE q.lesson_id = ?',
            [lessonId]
        );

        // Lấy danh sách đáp án cho từng câu hỏi
        for (const q of questions) {
            const [answers]: any = await pool.query(
                'SELECT a.*, m.file_url as media_url FROM answers a LEFT JOIN media_assets m ON a.media_id = m.id WHERE a.question_id = ?',
                [q.id]
            );
            q.answers = answers;
        }

        res.status(200).json({
            lesson,
            vocabularies: vocabularies.map((v: any) => ({
                ...v,
                image_url: toPublicMediaUrl(req, v.image_url),
                audio_url: toPublicMediaUrl(req, v.audio_url)
            })),
            questions
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết bài học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

// Thêm từ vựng mới kèm hình ảnh (Dành cho Admin)
export const addVocabulary = async (req: Request, res: Response): Promise<void> => {
    const { topicId, word, meaning, pronunciation } = req.body;
    try {
        await pool.query(
            'INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic) VALUES (?, ?, ?, ?)',
            [topicId, word, meaning, pronunciation]
        );
        res.status(201).json({ message: 'Thêm từ vựng thành công!' });
    } catch (error) {
        console.error('Lỗi khi thêm từ vựng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};
