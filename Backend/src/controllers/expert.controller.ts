import { Request, Response } from 'express';
import pool from '../config/database';

function toPublicMediaUrl(req: Request, fileUrl: string | null | undefined): string | null {
    if (!fileUrl) return null;
    if (/^(https?:)?\/\//i.test(fileUrl) || fileUrl.startsWith('data:')) return fileUrl;
    const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${req.protocol}://${req.get('host')}${normalizedPath}`;
}

// 1. Lấy danh sách bài học cần duyệt / lịch sử duyệt cho chuyên gia
export const getLessonsForReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, age, type } = req.query;

        let sql = `
            SELECT 
                l.id, l.title, l.lesson_type, l.difficulty, l.sort_order,
                l.status as publish_status, l.approval_status, 
                l.target_age, l.learning_outcomes, l.sample_materials_url,
                l.review_notes, l.reviewed_at, l.reviewed_by,
                t.id as topic_id, t.name as topic_name,
                c.id as course_id, c.title as course_title, c.age_group,
                u_rev.display_name as reviewer_name,
                (SELECT COUNT(*) FROM vocabularies WHERE topic_id = t.id) as vocab_count,
                (SELECT COUNT(*) FROM questions WHERE lesson_id = l.id) as question_count
            FROM lessons l
            JOIN topics t ON l.topic_id = t.id
            JOIN courses c ON t.course_id = c.id
            LEFT JOIN users u_rev ON l.reviewed_by = u_rev.id
            WHERE 1 = 1
        `;

        const params: any[] = [];

        if (status && status !== 'ALL') {
            sql += ' AND l.approval_status = ?';
            params.push(status);
        }

        if (age && age !== 'ALL') {
            sql += ' AND (l.target_age = ? OR c.age_group = ?)';
            params.push(age, age);
        }

        if (type && type !== 'ALL') {
            sql += ' AND l.lesson_type = ?';
            params.push(type);
        }

        sql += ' ORDER BY CASE l.approval_status WHEN "PENDING" THEN 1 WHEN "REJECTED" THEN 2 ELSE 3 END, l.id DESC';

        const [lessons]: any = await pool.query(sql, params);

        res.status(200).json(lessons);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách duyệt bài học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải danh sách kiểm duyệt' });
    }
};

// 2. Chuyên gia thực hiện Duyệt hoặc Trả về yêu cầu sửa bài
export const reviewLesson = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { approval_status, review_notes } = req.body;
        const reviewerId = req.user?.id;

        if (!reviewerId) {
            res.status(401).json({ message: 'Không xác định được chuyên gia đang đăng nhập.' });
            return;
        }

        if (!['APPROVED', 'REJECTED'].includes(approval_status)) {
            res.status(400).json({ message: 'Trạng thái kiểm duyệt không hợp lệ!' });
            return;
        }

        const [reviewerRows]: any = await pool.query(
            'SELECT id, role FROM users WHERE id = ? AND role IN ("EXPERT", "ADMIN")',
            [reviewerId]
        );
        if (reviewerRows.length === 0) {
            res.status(403).json({ message: 'Chỉ tài khoản Chuyên Gia mới được phép duyệt bài.' });
            return;
        }

        const [lessonRows]: any = await pool.query(
            `SELECT id, lesson_type,
                    (SELECT COUNT(*) FROM questions q WHERE q.lesson_id = lessons.id) AS question_count
             FROM lessons
             WHERE id = ?`,
            [id]
        );
        if (lessonRows.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy bài học cần kiểm duyệt.' });
            return;
        }

        if (approval_status === 'APPROVED'
            && lessonRows[0].lesson_type === 'QUIZ'
            && Number(lessonRows[0].question_count) < 1) {
            res.status(400).json({ message: 'Quiz chưa có câu hỏi. Hãy tạo câu hỏi trong Quản lý Quiz trước khi duyệt.' });
            return;
        }

        // Cập nhật trạng thái duyệt bài và trạng thái phát hành trong CSDL
        const publishStatus = approval_status === 'APPROVED' ? 'PUBLISHED' : 'DRAFT';
        await pool.query(
            `UPDATE lessons 
             SET approval_status = ?, 
                 status = ?,
                 review_notes = ?, 
                 reviewed_by = ?, 
                 reviewed_at = NOW() 
             WHERE id = ?`,
            [approval_status, publishStatus, review_notes || null, reviewerId, id]
        );

        // Lấy lại thông tin bài học vừa cập nhật
        const [updated]: any = await pool.query(`
            SELECT l.*, u.display_name as reviewer_name 
            FROM lessons l 
            LEFT JOIN users u ON l.reviewed_by = u.id 
            WHERE l.id = ?
        `, [id]);

        res.status(200).json({
            message: approval_status === 'APPROVED' ? 'Phê duyệt bài học thành công!' : 'Đã gửi phản hồi yêu cầu hoàn thiện bài học!',
            lesson: updated[0]
        });
    } catch (error) {
        console.error('Lỗi khi duyệt bài học:', error);
        res.status(500).json({ message: 'Lỗi khi lưu kết quả kiểm duyệt' });
    }
};

// Chuyên gia xem đầy đủ nội dung bài trước khi quyết định duyệt hoặc góp ý
export const getLessonReviewDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [lessonRows]: any = await pool.query(`
            SELECT
                l.*,
                t.name AS topic_name,
                t.description AS topic_description,
                c.title AS course_title,
                c.age_group,
                u_rev.display_name AS reviewer_name
            FROM lessons l
            JOIN topics t ON l.topic_id = t.id
            JOIN courses c ON t.course_id = c.id
            LEFT JOIN users u_rev ON l.reviewed_by = u_rev.id
            WHERE l.id = ? AND l.lesson_type <> 'VIDEO'
        `, [id]);

        if (lessonRows.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy bài học cần xem.' });
            return;
        }

        const lesson = lessonRows[0];
        let miniGame = null;
        if (lesson.mini_game_id) {
            const [miniGameRows]: any = await pool.query(`
                SELECT id, name, game_type, difficulty, points, item_count, is_active, sort_order
                FROM mini_games
                WHERE id = ?
            `, [lesson.mini_game_id]);
            miniGame = miniGameRows[0] || null;
        }

        const [vocabularies]: any = await pool.query(`
            SELECT v.*, m_img.file_url AS image_url, m_aud.file_url AS audio_url
            FROM vocabularies v
            LEFT JOIN media_assets m_img ON v.image_id = m_img.id
            LEFT JOIN media_assets m_aud ON v.audio_id = m_aud.id
            WHERE v.topic_id = ?
            ORDER BY v.id ASC
        `, [lesson.topic_id]);

        const [questions]: any = await pool.query(`
            SELECT q.*, m.file_url AS media_url
            FROM questions q
            LEFT JOIN media_assets m ON q.media_id = m.id
            WHERE q.lesson_id = ?
            ORDER BY q.id ASC
        `, [id]);

        for (const question of questions) {
            const [answers]: any = await pool.query(`
                SELECT a.*, m.file_url AS media_url, v.meaning_vi
                FROM answers a
                LEFT JOIN media_assets m ON a.media_id = m.id
                LEFT JOIN vocabularies v
                  ON LOWER(TRIM(v.word)) = LOWER(TRIM(a.answer_text))
                 AND v.topic_id = ?
                WHERE a.question_id = ?
                ORDER BY a.id ASC
            `, [lesson.topic_id, question.id]);
            question.answers = answers.map((answer: any) => ({
                ...answer,
                media_url: toPublicMediaUrl(req, answer.media_url)
            }));
            question.media_url = toPublicMediaUrl(req, question.media_url);
        }

        res.status(200).json({
            lesson,
            vocabularies: vocabularies.map((vocabulary: any) => ({
                ...vocabulary,
                image_url: toPublicMediaUrl(req, vocabulary.image_url),
                audio_url: toPublicMediaUrl(req, vocabulary.audio_url)
            })),
            questions,
            mini_game: miniGame
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết bài học cho chuyên gia:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải nội dung bài học.' });
    }
};

// 3. Thống kê kiểm duyệt bài học cho Dashboard Chuyên gia
export const getExpertStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const [counts]: any = await pool.query(`
            SELECT 
                COUNT(*) as total_lessons,
                SUM(CASE WHEN approval_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN approval_status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN approval_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count
            FROM lessons
        `);

        // Thống kê theo độ tuổi
        const [byAge]: any = await pool.query(`
            SELECT 
                c.age_group,
                COUNT(l.id) as total,
                SUM(CASE WHEN l.approval_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN l.approval_status = 'PENDING' THEN 1 ELSE 0 END) as pending
            FROM courses c
            JOIN topics t ON t.course_id = c.id
            JOIN lessons l ON l.topic_id = t.id
            GROUP BY c.age_group
            ORDER BY CAST(c.age_group AS UNSIGNED) ASC
        `);

        const stats = counts[0];
        const approvalRate = stats.total_lessons > 0 
            ? Math.round((stats.approved_count / stats.total_lessons) * 100) 
            : 0;

        res.status(200).json({
            total_lessons: Number(stats.total_lessons) || 0,
            approved_count: Number(stats.approved_count) || 0,
            pending_count: Number(stats.pending_count) || 0,
            rejected_count: Number(stats.rejected_count) || 0,
            approval_rate: approvalRate,
            by_age: byAge
        });
    } catch (error) {
        console.error('Lỗi khi lấy thống kê chuyên gia:', error);
        res.status(500).json({ message: 'Lỗi khi tải thống kê chuyên gia' });
    }
};

// 4. Khung tiêu chuẩn kiểm định sư phạm cho trẻ 3-8 tuổi
export const getCurriculumStandards = async (req: Request, res: Response): Promise<void> => {
    const standards = [
        {
            age: '3 Tuổi',
            focus: 'Nhận biết âm vị, màu sắc và cảm quan hình ảnh',
            criteria: [
                'Hình ảnh minh họa có độ tương phản cao, đường nét to, màu sắc tươi vui.',
                'Thời lượng video/bài học lý tưởng: 3 - 5 phút/buổi.',
                'Tập trung phát âm Phonics chuẩn từng âm tiết đơn giản (A, B, C, Dog, Cat).',
                'Không dùng văn bản phức tạp, 100% kết hợp âm thanh tự nhiên sinh động.'
            ]
        },
        {
            age: '4 Tuổi',
            focus: 'Đếm số lượng 1-10, hình học và phản xạ từ vựng trực quan',
            criteria: [
                'Gắn liền từ vựng với các đồ vật trẻ tiếp xúc mỗi ngày (đồ chơi, hoa quả).',
                'Bài tập đếm số kết hợp hình ảnh động và âm thanh chúc mừng.',
                'Cung cấp tối đa 4 - 5 từ mới trong một bài học để tránh quá tải.',
                'Khuyến khích thao tác chạm kéo thả đơn giản.'
            ]
        },
        {
            age: '5 Tuổi',
            focus: 'Gia đình, bộ phận cơ thể và biểu đạt cảm xúc cơ bản',
            criteria: [
                'Bé bắt đầu nhận diện cụm từ 2 từ (e.g., Happy baby, Big dog).',
                'Chủ đề giáo dục nhân cách: yêu thương gia đình, bảo vệ cơ thể.',
                'Trắc nghiệm 2 - 3 lựa chọn trực quan có audio hỗ trợ.',
                'Khen thưởng sao và huy hiệu tích cực sau khi bé hoàn thành.'
            ]
        },
        {
            age: '6 Tuổi',
            focus: 'Hành trang vào Lớp 1 - Chào hỏi và Đồ dùng học tập',
            criteria: [
                'Thực hành phát âm mẫu câu giao tiếp: "Hello, what is your name?".',
                'Làm quen nhận diện mặt chữ hoàn chỉnh đi kèm phiên âm chuẩn IPA.',
                'Tích hợp Mini-game ghép từ vào tranh tăng khả năng nhớ từ sâu.',
                'Độ chính xác ngữ pháp và phát âm đạt chuẩn tối thiểu 80%.'
            ]
        },
        {
            age: '7 Tuổi',
            focus: 'Mô tả thời tiết, thức ăn, thói quen sinh hoạt và mẩu chuyện ngắn',
            criteria: [
                'Hỏi và trả lời câu hỏi đơn giản (How is the weather? It is sunny).',
                'Tập nghe hiểu các đoạn audio hội thoại 2 nhân vật dài 20 - 30 giây.',
                'Trắc nghiệm câu hỏi tình huống có phản biện nhẹ nhàng.',
                'Hình ảnh thẩm mỹ, đa dạng văn hóa và thân thiện với học sinh tiểu học.'
            ]
        },
        {
            age: '8 Tuổi',
            focus: 'Nghề nghiệp tương lai, tự nhiên khoa học, đọc hiểu và viết câu',
            criteria: [
                'Đọc hiểu mẩu truyện tranh ngắn 4 - 6 câu và trả lời trắc nghiệm ý chính.',
                'Làm quen cấu trúc câu: Chủ ngữ + Động từ + Tân ngữ.',
                'Tăng cường vốn từ học thuật mầm non/tiểu học (Science, Jobs, Environment).',
                'Tỉ lệ thử thách câu hỏi nâng cao chiếm khoảng 25% bài học.'
            ]
        }
    ];

    res.status(200).json(standards);
};
