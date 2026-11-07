import { Request, Response } from 'express';
import pool from '../config/database';

// 1. Lấy toàn bộ Lộ trình chuẩn 3 - 8 tuổi kèm bài mẫu
export const getCurriculumRoadmap = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestedAges = String(req.query.ages || req.query.age || '')
            .split(',')
            .map((age) => age.trim())
            .filter((age) => /^(3|4|5|6|7|8)$/.test(age));

        // Lấy danh sách khóa học theo độ tuổi (3 đến 8)
        const courseParams = requestedAges.length > 0 ? requestedAges : [];
        const courseAgeFilter = requestedAges.length > 0
            ? ` AND age_group IN (${requestedAges.map(() => '?').join(', ')})`
            : '';
        const [courses]: any = await pool.query(
            `SELECT * FROM courses
             WHERE status = "PUBLISHED"${courseAgeFilter}
             ORDER BY CAST(age_group AS UNSIGNED) ASC`,
            courseParams
        );

        const ageMilestones: Record<string, { stage: string; summary: string; cefr: string; coreFocus: string[] }> = {
            '3': {
                stage: 'Làm quen tiếng Anh (Nursery)',
                summary: 'Nghe, nhận biết và bắt chước âm thanh tiếng Anh qua bảng chữ cái, màu sắc, con vật, trái cây, bài hát và vận động.',
                cefr: 'Pre-A1 Early Explorer',
                coreFocus: ['Alphabet - Bảng chữ cái A-Z', 'Letter Sounds - Âm chữ cái', 'Basic Colors, Animals & Fruits', 'Songs & Actions - Nghe và vận động']
            },
            '4': {
                stage: 'Mầm Non Nhỡ (Pre-Kindergarten)',
                summary: 'Tập đếm số 1 đến 10, phân biệt hình khối kỳ diệu, gọi tên đồ chơi và trái cây quen thuộc mỗi ngày.',
                cefr: 'Pre-A1 Wonder Kid',
                coreFocus: ['Tập đếm số 1 - 10 (Numbers)', 'Hình khối (Shapes: Circle, Square, Star...)', 'Hoa quả tươi (Fruits)', 'Đồ chơi bé thích (Toys)']
            },
            '5': {
                stage: 'Mầm Non Lớn (Kindergarten)',
                summary: 'Mở rộng thế giới xung quanh: Gọi tên thành viên gia đình, bộ phận cơ thể, nhận diện cảm xúc vui/buồn và trang phục thường ngày.',
                cefr: 'Pre-A1 Young Communicator',
                coreFocus: ['Gia đình thân yêu (My Family)', 'Bộ phận cơ thể (My Body)', 'Cảm xúc của bé (Feelings)', 'Trang phục & Quần áo (Clothes)']
            },
            '6': {
                stage: 'Tiền Tiểu Học (Prep Grade 1)',
                summary: 'Chuẩn bị hành trang vào Lớp 1: Tự tin chào hỏi giới thiệu bản thân, dụng cụ học tập trong cặp sách và các động từ hành động.',
                cefr: 'A1 Starter Level 1',
                coreFocus: ['Trường học & Đồ dùng học tập (School & Classroom)', 'Chào hỏi & Giới thiệu bản thân (Greetings & Intro)', 'Hành động vận động (Action Verbs)', 'Ghép từ thành cụm ngắn']
            },
            '7': {
                stage: 'Tiểu Học Lớp 2 (Primary Grade 2)',
                summary: 'Phát triển phản xạ giao tiếp tự nhiên: Mô tả thời tiết 4 mùa, gọi tên món ăn yêu thích, hỏi đáp giờ giấc và nghe kể chuyện tranh ngắn.',
                cefr: 'A1 Starter Level 2',
                coreFocus: ['Thời tiết & 4 Mùa (Weather & Seasons)', 'Món ăn & Đồ uống (Food & Drinks)', 'Thói quen mỗi ngày & Giờ giấc (Daily Routine)', 'Hội thoại & Kể chuyện ngắn']
            },
            '8': {
                stage: 'Tiểu Học Lớp 3 (Primary Grade 3)',
                summary: 'Bứt phá kỹ năng đọc hiểu và tư duy ngôn ngữ: Nói về ước mơ nghề nghiệp, khám phá thiên nhiên khoa học, đọc hiểu đoạn văn và viết câu hoàn chỉnh.',
                cefr: 'A1+ Explorer Mover',
                coreFocus: ['Ước mơ nghề nghiệp tương lai (Future Jobs)', 'Thiên nhiên & Khoa học vũ trụ (Nature & Science)', 'Đọc hiểu đoạn văn 4-6 câu (Reading Comprehension)', 'Ghép câu hoàn chỉnh (Simple Sentence Writing)']
            }
        };

        ageMilestones['3'] = {
            stage: 'Làm quen chữ cái (Nursery)',
            summary: 'Trẻ nhận diện 26 chữ cái qua 3 chặng lớn; học xong từng chặng sẽ được chơi trò chọn chữ và lật thẻ.',
            cefr: 'Pre-A1 Early Explorer',
            coreFocus: ['Chặng 1: Chữ A-J', 'Chặng 2: Chữ K-T', 'Chặng 3: Chữ U-Z']
        };

        const roadmapData = [];

        for (const course of courses) {
            const ageKey = course.age_group;
            const milestone = ageMilestones[ageKey] || {
                stage: `Trẻ ${ageKey} Tuổi`,
                summary: `Chương trình tiếng Anh chuẩn quốc tế cho trẻ ${ageKey} tuổi.`,
                cefr: 'Pre-A1',
                coreFocus: ['Từ vựng chủ đề', 'Phát âm chuẩn', 'Trò chơi tương tác']
            };

            // Lấy các topics của khóa học
            const [topics]: any = await pool.query(
                'SELECT * FROM topics WHERE course_id = ? AND status = "PUBLISHED" ORDER BY sort_order ASC',
                [course.id]
            );

            for (const topic of topics) {
                // Lấy các bài học mẫu của topic
                const [lessons]: any = await pool.query(
                    `SELECT l.id, l.topic_id, l.title, l.lesson_type, l.difficulty, l.approval_status, l.target_age, l.learning_outcomes, l.sample_materials_url,
                            l.reviewed_at, u_rev.display_name as reviewer_name
                     FROM lessons l
                     LEFT JOIN mini_games mg ON mg.id = l.mini_game_id
                     LEFT JOIN users u_rev ON l.reviewed_by = u_rev.id
                     WHERE l.topic_id = ?
                       AND l.status = "PUBLISHED"
                       AND l.approval_status = "APPROVED"
                       AND (l.lesson_type <> "GAME" OR (mg.id IS NOT NULL AND mg.is_active = 1))
                     ORDER BY l.sort_order ASC`,
                    [topic.id]
                );

                // Trả về toàn bộ từ vựng của chủ đề để ứng dụng có thể xây dựng
                // flashcard, ôn tập và thống kê vốn từ ngay từ một response.
                const [vocabularies]: any = await pool.query(
                    `SELECT id, topic_id, word, meaning_vi, phonetic
                     FROM vocabularies
                     WHERE topic_id = ?
                     ORDER BY id ASC`,
                    [topic.id]
                );

                topic.lessons = lessons;
                topic.vocabularies = vocabularies;
                topic.vocabulary_count = vocabularies.length;
                topic.lesson_count = lessons.length;
            }

            roadmapData.push({
                course_id: course.id,
                title: course.title,
                age_group: course.age_group,
                thumbnail: course.thumbnail,
                ...milestone,
                topics
            });
        }

        res.status(200).json(roadmapData);
    } catch (error) {
        console.error('Lỗi khi lấy lộ trình học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải lộ trình học' });
    }
};

// 2. Tìm kiếm và lọc tài liệu / bài học mẫu theo nhiều tiêu chí
export const searchMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            age,          // '3', '4', '5', '6', '7', '8', 'all'
            type,         // 'FLASHCARD', 'VIDEO', 'QUIZ', 'GAME', 'all'
            keyword,      // text search
            approval      // 'APPROVED', 'all'
        } = req.query;

        let sql = `
            SELECT 
                l.id, l.title, l.lesson_type, l.difficulty, l.approval_status, 
                l.target_age, l.learning_outcomes, l.sample_materials_url,
                l.reviewed_at, l.review_notes,
                t.id as topic_id, t.name as topic_name,
                c.id as course_id, c.title as course_title, c.age_group,
                u_rev.display_name as reviewer_name
            FROM lessons l
            JOIN topics t ON l.topic_id = t.id
            JOIN courses c ON t.course_id = c.id
            LEFT JOIN users u_rev ON l.reviewed_by = u_rev.id
            WHERE l.status = 'PUBLISHED'
              AND l.approval_status = 'APPROVED'
        `;

        const params: any[] = [];

        if (age && age !== 'all') {
            sql += ' AND (l.target_age = ? OR c.age_group = ?)';
            params.push(age, age);
        }

        if (type && type !== 'all') {
            sql += ' AND l.lesson_type = ?';
            params.push(type);
        }

        if (approval && approval !== 'all') {
            sql += ' AND l.approval_status = ?';
            params.push(approval);
        }

        if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
            sql += ' AND (l.title LIKE ? OR t.name LIKE ? OR l.learning_outcomes LIKE ?)';
            const term = `%${keyword.trim()}%`;
            params.push(term, term, term);
        }

        sql += ' ORDER BY CAST(c.age_group AS UNSIGNED) ASC, l.sort_order ASC LIMIT 50';

        const [lessons]: any = await pool.query(sql, params);

        // Lấy từ vựng mẫu cho từng bài học
        for (const lesson of lessons) {
            const [vocab]: any = await pool.query(
                'SELECT word, meaning_vi, phonetic FROM vocabularies WHERE topic_id = ? LIMIT 3',
                [lesson.topic_id]
            );
            lesson.vocab_preview = vocab;
        }

        res.status(200).json({
            total: lessons.length,
            filters: { age, type, keyword, approval },
            lessons
        });
    } catch (error) {
        console.error('Lỗi tìm kiếm tài liệu bài mẫu:', error);
        res.status(500).json({ message: 'Lỗi khi tìm kiếm tài liệu' });
    }
};

// 3. Lấy chi tiết phương pháp sư phạm & tài liệu mẫu của một bài học
export const getLessonPedagogyDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lessonId } = req.params;

        const [rows]: any = await pool.query(`
            SELECT 
                l.*,
                t.name as topic_name, t.description as topic_description,
                c.title as course_title, c.age_group,
                u_rev.display_name as reviewer_name
            FROM lessons l
            JOIN topics t ON l.topic_id = t.id
            JOIN courses c ON t.course_id = c.id
            LEFT JOIN users u_rev ON l.reviewed_by = u_rev.id
            WHERE l.id = ?
              AND l.status = 'PUBLISHED'
              AND l.approval_status = 'APPROVED'
        `, [lessonId]);

        if (rows.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy bài học' });
            return;
        }

        const lesson = rows[0];

        // Lấy đầy đủ từ vựng
        const [vocabularies]: any = await pool.query(
            'SELECT * FROM vocabularies WHERE topic_id = ?',
            [lesson.topic_id]
        );

        // Lấy câu hỏi trắc nghiệm nếu có
        const [questions]: any = await pool.query(
            'SELECT * FROM questions WHERE lesson_id = ?',
            [lessonId]
        );

        res.status(200).json({
            lesson,
            vocabularies,
            questions_count: questions.length,
            teaching_guide: {
                parent_tips: [
                    'Mỗi buổi chỉ nên cho bé học từ 10 - 15 phút để duy trì sự tập trung.',
                    'Khuyến khích bé nói to theo âm thanh mẫu (Phonics/Flashcard).',
                    'Khen ngợi và tặng sao cho bé sau mỗi câu trả lời đúng để tạo cảm hứng tự nhiên.'
                ],
                expert_standards: [
                    'Hình ảnh hoạt hình trực quan, an toàn, không có yếu tố gây xao nhãng.',
                    'Giọng đọc audio chuẩn tiếng Anh - Mỹ (General American) rõ ràng.',
                    'Độ khó phù hợp với tâm sinh lý và năng lực ngôn ngữ của độ tuổi ' + (lesson.target_age || lesson.age_group) + ' tuổi.'
                ]
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết sư phạm bài học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};
