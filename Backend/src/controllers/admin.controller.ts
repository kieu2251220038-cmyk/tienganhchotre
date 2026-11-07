import { Request, Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../config/database';

const uploadDirectory = path.resolve(process.cwd(), 'uploads');
const maxImageBytes = 5 * 1024 * 1024;

function toPublicMediaUrl(req: Request, fileUrl: string | null | undefined): string | null {
    if (!fileUrl) return null;
    if (/^(https?:)?\/\//i.test(fileUrl) || fileUrl.startsWith('data:')) return fileUrl;
    const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${req.protocol}://${req.get('host')}${normalizedPath}`;
}

async function saveImageData(imageData: unknown): Promise<string | null> {
    if (typeof imageData !== 'string' || !imageData.trim()) return null;

    const match = imageData.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
    const mimeType = match?.[1];
    const base64Data = match?.[2];
    if (!mimeType || !base64Data) {
        throw new Error('Ảnh không hợp lệ. Vui lòng chọn PNG, JPG, WEBP hoặc GIF.');
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');
    if (imageBuffer.length > maxImageBytes) {
        throw new Error('Ảnh quá lớn. Vui lòng chọn ảnh không vượt quá 5MB.');
    }

    const extension = mimeType.substring(mimeType.indexOf('/') + 1).toLowerCase().replace('jpeg', 'jpg');
    const filename = `vocab-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`;
    await fs.mkdir(uploadDirectory, { recursive: true });
    await fs.writeFile(path.join(uploadDirectory, filename), imageBuffer);
    return `/uploads/${filename}`;
}

async function createMediaAsset(word: string, fileUrl: string): Promise<number> {
    const [mediaRes]: any = await pool.query(
        'INSERT INTO media_assets (title, media_type, file_url) VALUES (?, "IMAGE", ?)',
        [`Ảnh ${word}`, fileUrl]
    );
    return mediaRes.insertId;
}

// 1. Thống kê Dashboard Admin (A01)
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const [userCount]: any = await pool.query('SELECT COUNT(*) as cnt FROM users');
        const [lessonCount]: any = await pool.query('SELECT COUNT(*) as cnt FROM lessons');
        const [vocabCount]: any = await pool.query('SELECT COUNT(*) as cnt FROM vocabularies');
        const [progressCount]: any = await pool.query('SELECT COUNT(*) as cnt FROM user_progress WHERE status = "COMPLETED"');

        const [recentLessons]: any = await pool.query(`
            SELECT l.id, l.title, l.lesson_type, l.status, l.difficulty, t.name as topic_name
            FROM lessons l
            LEFT JOIN topics t ON l.topic_id = t.id
            ORDER BY l.id DESC LIMIT 6
        `);

        res.status(200).json({
            total_users: userCount[0]?.cnt || 0,
            total_lessons: lessonCount[0]?.cnt || 0,
            total_vocabularies: vocabCount[0]?.cnt || 0,
            total_completions: progressCount[0]?.cnt || 0,
            recent_lessons: recentLessons || []
        });
    } catch (error) {
        console.error('Lỗi thống kê Admin:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy thống kê' });
    }
};

// 1. Quản lý Khóa học (A03)
const COURSE_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

const normalizeCoursePayload = (body: Record<string, unknown>): {
    title: string;
    description: string;
    ageGroup: string;
    status: typeof COURSE_STATUSES[number];
} | { error: string } => {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const ageGroup = String(body.age_group ?? '').trim();
    const status = String(body.status ?? 'DRAFT').trim().toUpperCase() as typeof COURSE_STATUSES[number];

    if (!title) return { error: 'Tên khóa học không được để trống.' };
    if (title.length > 255) return { error: 'Tên khóa học không được vượt quá 255 ký tự.' };
    if (!/^([3-8])$/.test(ageGroup)) return { error: 'Độ tuổi khóa học phải nằm trong khoảng từ 3 đến 8.' };
    if (!COURSE_STATUSES.includes(status)) return { error: 'Trạng thái khóa học không hợp lệ.' };

    return { title, description, ageGroup, status };
};

export const getAdminCourses = async (_req: Request, res: Response): Promise<void> => {
    try {
        const [courses]: any = await pool.query(`
            SELECT
                c.id,
                c.title,
                c.description,
                c.age_group,
                c.status,
                COUNT(DISTINCT t.id) AS topic_count,
                COUNT(DISTINCT l.id) AS lesson_count
            FROM courses c
            LEFT JOIN topics t ON t.course_id = c.id
            LEFT JOIN lessons l ON l.topic_id = t.id
            GROUP BY c.id, c.title, c.description, c.age_group, c.status
            ORDER BY CAST(c.age_group AS UNSIGNED) ASC, c.id ASC
        `);
        res.status(200).json(courses);
    } catch (error) {
        console.error('Lỗi lấy danh sách khóa học Admin:', error);
        res.status(500).json({ message: 'Không thể tải danh sách khóa học.' });
    }
};

export const createAdminCourse = async (req: Request, res: Response): Promise<void> => {
    const payload = normalizeCoursePayload(req.body);
    if ('error' in payload) {
        res.status(400).json({ message: payload.error });
        return;
    }

    try {
        const [result]: any = await pool.query(
            'INSERT INTO courses (title, description, age_group, status) VALUES (?, ?, ?, ?)',
            [payload.title, payload.description, payload.ageGroup, payload.status]
        );
        res.status(201).json({
            message: 'Tạo khóa học thành công!',
            id: result.insertId
        });
    } catch (error) {
        console.error('Lỗi tạo khóa học Admin:', error);
        res.status(500).json({ message: 'Không thể tạo khóa học.' });
    }
};

export const updateAdminCourse = async (req: Request, res: Response): Promise<void> => {
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
        res.status(400).json({ message: 'ID khóa học không hợp lệ.' });
        return;
    }

    const payload = normalizeCoursePayload(req.body);
    if ('error' in payload) {
        res.status(400).json({ message: payload.error });
        return;
    }

    try {
        const [result]: any = await pool.query(
            'UPDATE courses SET title = ?, description = ?, age_group = ?, status = ? WHERE id = ?',
            [payload.title, payload.description, payload.ageGroup, payload.status, courseId]
        );
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Không tìm thấy khóa học cần cập nhật.' });
            return;
        }
        res.status(200).json({ message: 'Cập nhật khóa học thành công!' });
    } catch (error) {
        console.error('Lỗi cập nhật khóa học Admin:', error);
        res.status(500).json({ message: 'Không thể cập nhật khóa học.' });
    }
};

export const deleteAdminCourse = async (req: Request, res: Response): Promise<void> => {
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
        res.status(400).json({ message: 'ID khóa học không hợp lệ.' });
        return;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [courseRows]: any = await connection.query('SELECT id FROM courses WHERE id = ? FOR UPDATE', [courseId]);
        if (courseRows.length === 0) {
            await connection.rollback();
            res.status(404).json({ message: 'Không tìm thấy khóa học cần xóa.' });
            return;
        }

        const [topicRows]: any = await connection.query('SELECT id FROM topics WHERE course_id = ?', [courseId]);
        const topicIds = topicRows.map((topic: { id: number }) => Number(topic.id));

        for (const topicId of topicIds) {
            await connection.query(
                `DELETE a FROM answers a
                 INNER JOIN questions q ON q.id = a.question_id
                 INNER JOIN lessons l ON l.id = q.lesson_id
                 WHERE l.topic_id = ?`,
                [topicId]
            );
            await connection.query(
                `DELETE q FROM questions q
                 INNER JOIN lessons l ON l.id = q.lesson_id
                 WHERE l.topic_id = ?`,
                [topicId]
            );
            await connection.query(
                `DELETE up FROM user_progress up
                 INNER JOIN lessons l ON l.id = up.lesson_id
                 WHERE l.topic_id = ?`,
                [topicId]
            );
            await connection.query('DELETE FROM vocabularies WHERE topic_id = ?', [topicId]);
            await connection.query('DELETE FROM lessons WHERE topic_id = ?', [topicId]);
            await connection.query('DELETE FROM mini_games WHERE topic_id = ?', [topicId]);
        }

        await connection.query('DELETE FROM topics WHERE course_id = ?', [courseId]);
        await connection.query('DELETE FROM courses WHERE id = ?', [courseId]);
        await connection.commit();

        res.status(200).json({ message: 'Xóa khóa học và nội dung liên quan thành công!' });
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi xóa khóa học Admin:', error);
        res.status(500).json({ message: 'Không thể xóa khóa học.' });
    } finally {
        connection.release();
    }
};

// 2. Quản lý Users (A02)
export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const [users]: any = await pool.query('SELECT id, username, display_name, role, age_group, created_at FROM users ORDER BY id DESC');
        res.status(200).json(users);
    } catch (error) {
        console.error('Lỗi lấy danh sách User:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

export const updateAdminUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { display_name, role, age_group } = req.body;
    try {
        await pool.query('UPDATE users SET display_name = ?, role = ?, age_group = ? WHERE id = ?', [display_name, role, age_group, id]);
        res.status(200).json({ message: 'Cập nhật tài khoản thành công!' });
    } catch (error) {
        console.error('Lỗi sửa User:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi sửa User' });
    }
};

export const deleteAdminUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
        res.status(400).json({ message: 'ID người dùng không hợp lệ.' });
        return;
    }

    if (req.user?.id === userId) {
        res.status(400).json({ message: 'Không thể tự xóa tài khoản Admin đang đăng nhập.' });
        return;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE users SET parent_id = NULL WHERE parent_id = ?', [userId]);
        await connection.query('DELETE FROM parent_children WHERE parent_id = ? OR child_id = ?', [userId, userId]);
        await connection.query('DELETE FROM user_progress WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM user_rewards WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM user_badges WHERE user_id = ?', [userId]);

        const [deleteResult]: any = await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            res.status(404).json({ message: 'Không tìm thấy người dùng cần xóa.' });
            return;
        }

        await connection.commit();
        res.status(200).json({ message: 'Xóa người dùng thành công!' });
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi xóa User:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi xóa User' });
    } finally {
        connection.release();
    }
};

// 3. Quản lý Bài học (A03)
export const getAdminLessons = async (req: Request, res: Response): Promise<void> => {
    try {
        const [lessons]: any = await pool.query(`
            SELECT l.*, t.name as topic_name, t.sort_order as topic_sort_order, c.title as course_title, c.age_group,
                   u_rev.display_name as reviewer_name
            FROM lessons l
            LEFT JOIN topics t ON l.topic_id = t.id
            LEFT JOIN courses c ON t.course_id = c.id
            LEFT JOIN users u_rev ON l.reviewed_by = u_rev.id
            ORDER BY l.id DESC
        `);
        res.status(200).json(lessons);
    } catch (error) {
        console.error('Lỗi lấy danh sách bài học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

export const createAdminLesson = async (req: Request, res: Response): Promise<void> => {
    const { topic_id, title, lesson_type, difficulty = 1, sort_order = 1 } = req.body;
    try {
        // BẮT BUỘC: Khi Admin tạo bài học mới, bài học tự động ở trạng thái PENDING (chờ chuyên gia duyệt)
        // và DRAFT (chưa xuất bản cho trẻ em)
        const [result]: any = await pool.query(
            'INSERT INTO lessons (topic_id, title, lesson_type, difficulty, sort_order, status, approval_status) VALUES (?, ?, ?, ?, ?, "DRAFT", "PENDING")',
            [topic_id, title, lesson_type, difficulty, sort_order]
        );
        res.status(201).json({ 
            message: 'Bài học đã được tạo thành công và gửi sang Hội đồng Chuyên gia để thẩm định!', 
            id: result.insertId,
            approval_status: 'PENDING',
            status: 'DRAFT'
        });
    } catch (error) {
        console.error('Lỗi tạo bài học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tạo bài học' });
    }
};

export const updateAdminLesson = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { topic_id, title, lesson_type, difficulty, sort_order } = req.body;
    try {
        // Khi Admin chỉnh sửa bài học, đưa bài trở lại trạng thái PENDING để chuyên gia tái thẩm định
        await pool.query(
            'UPDATE lessons SET topic_id = ?, title = ?, lesson_type = ?, difficulty = ?, sort_order = ?, status = "DRAFT", approval_status = "PENDING", reviewed_by = NULL, reviewed_at = NULL, review_notes = NULL WHERE id = ?',
            [topic_id, title, lesson_type, difficulty, sort_order, id]
        );
        res.status(200).json({ 
            message: 'Cập nhật bài học thành công! Bài học đã được gửi tới chuyên gia để kiểm duyệt lại.',
            approval_status: 'PENDING',
            status: 'DRAFT'
        });
    } catch (error) {
        console.error('Lỗi cập nhật bài học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật bài học' });
    }
};

export const deleteAdminLesson = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const [lessonRows]: any = await pool.query(
            'SELECT mini_game_id FROM lessons WHERE id = ?',
            [id]
        );

        // Delete dependent answers before their parent questions to satisfy FK constraints.
        await pool.query(
            `DELETE a FROM answers a
             INNER JOIN questions q ON q.id = a.question_id
             WHERE q.lesson_id = ?`,
            [id]
        );
        await pool.query('DELETE FROM questions WHERE lesson_id = ?', [id]);
        await pool.query('DELETE FROM user_progress WHERE lesson_id = ?', [id]);
        const [deleteResult]: any = await pool.query('DELETE FROM lessons WHERE id = ?', [id]);
        const miniGameId = lessonRows[0]?.mini_game_id;
        if (deleteResult.affectedRows > 0 && miniGameId) {
            await pool.query('DELETE FROM mini_games WHERE id = ?', [miniGameId]);
        }
        res.status(200).json({ message: 'Xóa bài học thành công!' });
    } catch (error) {
        console.error('Lỗi xóa bài học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi xóa bài học' });
    }
};

// 4. Quản lý Từ vựng và Media (A04)
export const getAdminVocabularies = async (req: Request, res: Response): Promise<void> => {
    try {
        const [vocabs]: any = await pool.query(`
            SELECT v.*, t.name as topic_name, m.file_url as image_url
            FROM vocabularies v
            LEFT JOIN topics t ON v.topic_id = t.id
            LEFT JOIN media_assets m ON v.image_id = m.id
            ORDER BY v.id DESC
        `);
        res.status(200).json(vocabs.map((v: any) => ({
            ...v,
            image_url: toPublicMediaUrl(req, v.image_url)
        })));
    } catch (error) {
        console.error('Lỗi lấy từ vựng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

export const createAdminVocabulary = async (req: Request, res: Response): Promise<void> => {
    const { topic_id, word, meaning_vi, phonetic, image_url, image_data } = req.body;
    try {
        const topicId = Number(topic_id);
        if (!Number.isInteger(topicId) || topicId <= 0) {
            res.status(400).json({ message: 'Vui lòng chọn một chủ đề hợp lệ.' });
            return;
        }
        if (typeof word !== 'string' || !word.trim() || typeof meaning_vi !== 'string' || !meaning_vi.trim()) {
            res.status(400).json({ message: 'Từ tiếng Anh và nghĩa tiếng Việt không được để trống.' });
            return;
        }
        const [topicRows]: any = await pool.query('SELECT id FROM topics WHERE id = ?', [topicId]);
        if (topicRows.length === 0) {
            res.status(404).json({ message: 'Chủ đề không tồn tại. Vui lòng tải lại danh sách chủ đề.' });
            return;
        }

        let imageId: number | null = null;
        const uploadedUrl = await saveImageData(image_data);
        const finalImageUrl = uploadedUrl || (typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null);
        if (finalImageUrl) {
            imageId = await createMediaAsset(word, finalImageUrl);
        }

        const [resWord]: any = await pool.query(
            'INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic, image_id) VALUES (?, ?, ?, ?, ?)',
            [topicId, word.trim(), meaning_vi.trim(), typeof phonetic === 'string' ? phonetic.trim() : '', imageId]
        );
        res.status(201).json({ message: 'Thêm từ vựng thành công!', id: resWord.insertId });
    } catch (error) {
        console.error('Lỗi tạo từ vựng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tạo từ vựng' });
    }
};

export const updateAdminVocabulary = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { topic_id, word, meaning_vi, phonetic, image_url, image_data } = req.body;
    try {
        const [existingRows]: any = await pool.query(
            `SELECT v.image_id, m.file_url AS image_url
             FROM vocabularies v
             LEFT JOIN media_assets m ON m.id = v.image_id
             WHERE v.id = ?`,
            [id]
        );
        if (existingRows.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy từ vựng cần cập nhật.' });
            return;
        }

        let imageId = existingRows[0].image_id || null;
        const uploadedUrl = await saveImageData(image_data);
        if (uploadedUrl) {
            imageId = await createMediaAsset(word, uploadedUrl);
        } else if (image_url === '') {
            imageId = null;
        } else if (
            typeof image_url === 'string' &&
            image_url.trim() &&
            image_url.trim() !== existingRows[0].image_url &&
            image_url.trim() !== toPublicMediaUrl(req, existingRows[0].image_url)
        ) {
            imageId = await createMediaAsset(word, image_url.trim());
        }

        await pool.query(
            'UPDATE vocabularies SET topic_id = ?, word = ?, meaning_vi = ?, phonetic = ?, image_id = ? WHERE id = ?',
            [topic_id, word, meaning_vi, phonetic, imageId, id]
        );
        res.status(200).json({ message: 'Cập nhật từ vựng thành công!' });
    } catch (error) {
        console.error('Lỗi sửa từ vựng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

export const deleteAdminVocabulary = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM vocabularies WHERE id = ?', [id]);
        res.status(200).json({ message: 'Xóa từ vựng thành công!' });
    } catch (error) {
        console.error('Lỗi xóa từ vựng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

// 5. Quản lý Quiz (A05)
export const getAdminQuizQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const [questions]: any = await pool.query(`
            SELECT q.*, l.title as lesson_title
            FROM questions q
            LEFT JOIN lessons l ON q.lesson_id = l.id
            ORDER BY q.id DESC
        `);

        for (const q of questions) {
            const [answers]: any = await pool.query(
                'SELECT a.*, m.file_url as media_url FROM answers a LEFT JOIN media_assets m ON a.media_id = m.id WHERE a.question_id = ? ORDER BY a.id ASC',
                [q.id]
            );
            q.answers = answers;
        }

        res.status(200).json(questions);
    } catch (error) {
        console.error('Lỗi lấy danh sách câu hỏi Quiz:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

const validateQuizQuestionPayload = (body: Record<string, any>): string | null => {
    if (!Number.isInteger(Number(body.lesson_id)) || Number(body.lesson_id) <= 0) return 'Vui lòng chọn bài Quiz hợp lệ.';
    if (typeof body.question_text !== 'string' || !body.question_text.trim()) return 'Nội dung câu hỏi không được để trống.';
    if (!Array.isArray(body.answers) || body.answers.length !== 4) return 'Câu hỏi Quiz phải có đúng 4 phương án.';

    const filledAnswers = body.answers.filter((answer: any) => typeof answer?.answer_text === 'string' && answer.answer_text.trim());
    if (filledAnswers.length !== 4) return 'Vui lòng nhập đủ 4 phương án trả lời.';
    const correctCount = filledAnswers.filter((answer: any) => answer.is_correct === true || Number(answer.is_correct) === 1).length;
    if (correctCount !== 1) return 'Vui lòng chọn đúng 1 đáp án đúng.';
    return null;
};

export const createAdminQuizQuestion = async (req: Request, res: Response): Promise<void> => {
    const { lesson_id, question_text, question_type = 'MULTIPLE_CHOICE', points = 10, answers = [] } = req.body;
    const validationMessage = validateQuizQuestionPayload(req.body);
    if (validationMessage) {
        res.status(400).json({ message: validationMessage });
        return;
    }
    try {
        const [lessons]: any = await pool.query('SELECT id FROM lessons WHERE id = ? AND lesson_type = "QUIZ" LIMIT 1', [lesson_id]);
        if (lessons.length === 0) {
            res.status(400).json({ message: 'Câu hỏi chỉ được gắn vào bài học loại QUIZ.' });
            return;
        }
        const [qRes]: any = await pool.query(
            'INSERT INTO questions (lesson_id, question_type, question_text, points) VALUES (?, ?, ?, ?)',
            [lesson_id, question_type, question_text, points]
        );
        const questionId = qRes.insertId;

        for (const ans of answers) {
            await pool.query(
                'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)',
                [questionId, ans.answer_text, ans.is_correct ? 1 : 0]
            );
        }

        res.status(201).json({ message: 'Tạo câu hỏi Quiz thành công!', id: questionId });
    } catch (error) {
        console.error('Lỗi tạo câu hỏi Quiz:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tạo Quiz' });
    }
};

export const updateAdminQuizQuestion = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { lesson_id, question_text, question_type = 'MULTIPLE_CHOICE', points = 10, answers = [] } = req.body;
    const validationMessage = validateQuizQuestionPayload(req.body);
    if (validationMessage) {
        res.status(400).json({ message: validationMessage });
        return;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [lessons]: any = await connection.query('SELECT id FROM lessons WHERE id = ? AND lesson_type = "QUIZ" LIMIT 1', [lesson_id]);
        if (lessons.length === 0) {
            await connection.rollback();
            res.status(400).json({ message: 'Câu hỏi chỉ được gắn vào bài học loại QUIZ.' });
            return;
        }

        const [questions]: any = await connection.query('SELECT id FROM questions WHERE id = ? LIMIT 1', [id]);
        if (questions.length === 0) {
            await connection.rollback();
            res.status(404).json({ message: 'Không tìm thấy câu hỏi Quiz cần sửa.' });
            return;
        }

        await connection.query(
            'UPDATE questions SET lesson_id = ?, question_type = ?, question_text = ?, points = ? WHERE id = ?',
            [lesson_id, question_type, question_text.trim(), Number(points) || 10, id]
        );
        await connection.query('DELETE FROM answers WHERE question_id = ?', [id]);
        for (const answer of answers) {
            await connection.query(
                'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)',
                [id, answer.answer_text.trim(), answer.is_correct === true || Number(answer.is_correct) === 1 ? 1 : 0]
            );
        }
        await connection.commit();
        res.status(200).json({ message: 'Cập nhật câu hỏi và thứ tự đáp án thành công!' });
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi cập nhật câu hỏi Quiz:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật Quiz.' });
    } finally {
        connection.release();
    }
};

export const deleteAdminQuizQuestion = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM answers WHERE question_id = ?', [id]);
        await pool.query('DELETE FROM questions WHERE id = ?', [id]);
        res.status(200).json({ message: 'Xóa câu hỏi thành công!' });
    } catch (error) {
        console.error('Lỗi xóa câu hỏi Quiz:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

// 6. Quản lý Chủ đề (Topics A08)
export const getAdminTopics = async (req: Request, res: Response): Promise<void> => {
    try {
        const [topics]: any = await pool.query(`
            SELECT t.*, c.title as course_title, c.age_group,
            (SELECT COUNT(*) FROM lessons l WHERE l.topic_id = t.id) as lesson_count,
            (SELECT COUNT(*) FROM vocabularies v WHERE v.topic_id = t.id) as vocab_count
            FROM topics t
            LEFT JOIN courses c ON t.course_id = c.id
            ORDER BY t.sort_order ASC, t.id DESC
        `);
        res.status(200).json(topics);
    } catch (error) {
        console.error('Lỗi lấy danh sách chủ đề:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

export const createAdminTopic = async (req: Request, res: Response): Promise<void> => {
    const { course_id = 1, name, description = '', sort_order = 1, status = 'PUBLISHED' } = req.body;
    try {
        const [result]: any = await pool.query(
            'INSERT INTO topics (course_id, name, description, sort_order, status) VALUES (?, ?, ?, ?, ?)',
            [course_id, name, description, sort_order, status]
        );
        res.status(201).json({ message: 'Tạo chủ đề mới thành công!', id: result.insertId });
    } catch (error) {
        console.error('Lỗi tạo chủ đề:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tạo chủ đề' });
    }
};

export const updateAdminTopic = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { course_id, name, description, sort_order, status } = req.body;
    try {
        await pool.query(
            'UPDATE topics SET course_id = ?, name = ?, description = ?, sort_order = ?, status = ? WHERE id = ?',
            [course_id, name, description, sort_order, status, id]
        );
        res.status(200).json({ message: 'Cập nhật chủ đề thành công!' });
    } catch (error) {
        console.error('Lỗi cập nhật chủ đề:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật chủ đề' });
    }
};

export const deleteAdminTopic = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const topicId = Number(id);

    if (!Number.isInteger(topicId) || topicId <= 0) {
        res.status(400).json({ message: 'ID chủ đề không hợp lệ.' });
        return;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Remove all dependent rows before deleting lessons and the topic itself.
        await connection.query(
            `DELETE a FROM answers a
             INNER JOIN questions q ON q.id = a.question_id
             INNER JOIN lessons l ON l.id = q.lesson_id
             WHERE l.topic_id = ?`,
            [topicId]
        );
        await connection.query(
            `DELETE q FROM questions q
             INNER JOIN lessons l ON l.id = q.lesson_id
             WHERE l.topic_id = ?`,
            [topicId]
        );
        await connection.query(
            `DELETE up FROM user_progress up
             INNER JOIN lessons l ON l.id = up.lesson_id
             WHERE l.topic_id = ?`,
            [topicId]
        );
        await connection.query('DELETE FROM vocabularies WHERE topic_id = ?', [topicId]);
        await connection.query('DELETE FROM lessons WHERE topic_id = ?', [topicId]);
        await connection.query('DELETE FROM mini_games WHERE topic_id = ?', [topicId]);

        const [deleteResult]: any = await connection.query('DELETE FROM topics WHERE id = ?', [topicId]);
        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            res.status(404).json({ message: 'Không tìm thấy chủ đề cần xóa.' });
            return;
        }

        await connection.commit();
        res.status(200).json({ message: 'Xóa chủ đề thành công!' });
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi xóa chủ đề:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi xóa chủ đề' });
    } finally {
        connection.release();
    }
};

// 7. Báo cáo & Thống kê hệ thống (A09 - System Analytics)
export const getSystemAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        // DAU - Daily Active Users (người dùng hoạt động hôm nay)
        const [dauRows]: any = await pool.query(
            `SELECT COUNT(DISTINCT user_id) as dau FROM user_progress WHERE DATE(completed_at) = CURDATE()`
        );

        // MAU - Monthly Active Users (30 ngày gần nhất)
        const [mauRows]: any = await pool.query(
            `SELECT COUNT(DISTINCT user_id) as mau FROM user_progress WHERE completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );

        // WAU - Weekly Active Users (7 ngày gần nhất)
        const [wauRows]: any = await pool.query(
            `SELECT COUNT(DISTINCT user_id) as wau FROM user_progress WHERE completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        // Top 10 bài học được hoàn thành nhiều nhất
        const [topLessons]: any = await pool.query(
            `SELECT l.id, l.title, l.lesson_type, t.name as topic_name,
                    COUNT(up.id) as completion_count,
                    AVG(up.score) as avg_score
             FROM user_progress up
             INNER JOIN lessons l ON l.id = up.lesson_id
             LEFT JOIN topics t ON t.id = l.topic_id
             WHERE up.status = 'COMPLETED'
             GROUP BY l.id, l.title, l.lesson_type, t.name
             ORDER BY completion_count DESC
             LIMIT 10`
        );

        // Tỷ lệ hoàn thành theo khóa học
        const [courseCompletion]: any = await pool.query(
            `SELECT c.id, c.title, c.age_group,
                    COUNT(DISTINCT l.id) as total_lessons,
                    COUNT(DISTINCT up.lesson_id) as completed_lessons,
                    COUNT(DISTINCT up.user_id) as active_learners
             FROM courses c
             LEFT JOIN topics t ON t.course_id = c.id
             LEFT JOIN lessons l ON l.topic_id = t.id
             LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.status = 'COMPLETED'
             GROUP BY c.id, c.title, c.age_group
             ORDER BY c.id ASC`
        );

        // Hoạt động theo 7 ngày gần nhất (biểu đồ đường)
        const [dailyActivity]: any = await pool.query(
            `SELECT DATE(completed_at) as date,
                    COUNT(*) as completions,
                    COUNT(DISTINCT user_id) as active_users
             FROM user_progress
             WHERE completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(completed_at)
             ORDER BY date ASC`
        );

        // Phân bố điểm số (score distribution)
        const [scoreDistribution]: any = await pool.query(
            `SELECT
                SUM(CASE WHEN score >= 90 THEN 1 ELSE 0 END) as excellent,
                SUM(CASE WHEN score >= 70 AND score < 90 THEN 1 ELSE 0 END) as good,
                SUM(CASE WHEN score >= 50 AND score < 70 THEN 1 ELSE 0 END) as average,
                SUM(CASE WHEN score < 50 THEN 1 ELSE 0 END) as needs_improvement
             FROM user_progress WHERE status = 'COMPLETED'`
        );

        // Tổng huy hiệu được trao
        const [badgeTotal]: any = await pool.query('SELECT COUNT(*) as cnt FROM user_badges');

        // Tổng sao được tích lũy
        const [starsTotal]: any = await pool.query('SELECT SUM(total_stars) as total FROM user_rewards');

        // New registrations (7 days)
        const [newUsers]: any = await pool.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM users
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC`
        );

        res.status(200).json({
            dau: dauRows[0]?.dau || 0,
            mau: mauRows[0]?.mau || 0,
            wau: wauRows[0]?.wau || 0,
            top_lessons: topLessons || [],
            course_completion: courseCompletion || [],
            daily_activity: dailyActivity || [],
            score_distribution: scoreDistribution[0] || { excellent: 0, good: 0, average: 0, needs_improvement: 0 },
            total_badges_awarded: badgeTotal[0]?.cnt || 0,
            total_stars_earned: starsTotal[0]?.total || 0,
            new_users_7days: newUsers || []
        });
    } catch (error) {
        console.error('Lỗi Analytics:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy báo cáo' });
    }
};

// 8. Quản lý Game Configs (A06 - lưu vào CSDL MySQL)
export const getGameConfigs = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.query(
            'SELECT id, topic_id, name, game_type, topic_name, difficulty, points, is_active FROM game_configs ORDER BY id ASC'
        );
        // Chuyển is_active từ 0/1 thành boolean
        const result = rows.map((r: any) => ({ ...r, is_active: r.is_active === 1 }));
        res.status(200).json(result);
    } catch (error) {
        console.error('Lỗi lấy game configs:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

export const updateGameConfig = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { is_active, points } = req.body;
    try {
        const updates: string[] = [];
        const values: any[] = [];

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active ? 1 : 0);
        }
        if (points !== undefined) {
            updates.push('points = ?');
            values.push(Number(points));
        }

        if (updates.length === 0) {
            res.status(400).json({ message: 'Không có gì để cập nhật' });
            return;
        }

        values.push(id);
        await pool.query(`UPDATE game_configs SET ${updates.join(', ')} WHERE id = ?`, values);

        const [updated]: any = await pool.query(
            'SELECT id, topic_id, name, game_type, topic_name, difficulty, points, is_active FROM game_configs WHERE id = ?',
            [id]
        );
        const row = updated[0];
        res.status(200).json({ ...row, is_active: row.is_active === 1 });
    } catch (error) {
        console.error('Lỗi cập nhật game config:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};
