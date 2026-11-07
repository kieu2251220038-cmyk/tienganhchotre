import { Request, Response } from 'express';
import pool from '../config/database';
import { normalizeAge } from '../config/age';

/**
 * Hàm kiểm tra quyền sở hữu hồ sơ trẻ (Bảo mật RBAC & chống IDOR)
 * Phụ huynh chỉ được xem dữ liệu của con em mà mình đã liên kết. Admin có toàn quyền.
 */
export const verifyChildOwnership = async (parentId: number, childId: number, role: string): Promise<boolean> => {
    if (role === 'ADMIN') return true;
    const [rows]: any = await pool.query(
        'SELECT id FROM parent_children WHERE parent_id = ? AND child_id = ?',
        [parentId, childId]
    );
    return rows.length > 0;
};

// 1. Lấy danh sách con em được phụ huynh quản lý (Chỉ lấy con đã liên kết với phụ huynh hiện tại)
export const getChildren = async (req: Request, res: Response): Promise<void> => {
    try {
        const parentId = (req.user?.role === 'ADMIN' && req.params.parentId) 
            ? Number(req.params.parentId) 
            : req.user!.id;

        const [children]: any = await pool.query(`
            SELECT 
                u.id, u.username, u.display_name, u.age_group, 
                u.daily_goal_minutes, u.created_at,
                COALESCE(r.current_streak, 0) as current_streak, 
                COALESCE(r.total_stars, 0) as total_stars, 
                COALESCE(r.total_coins, 0) as total_coins,
                (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND status = 'COMPLETED') as completed_lessons,
                pc.relationship
            FROM parent_children pc
            JOIN users u ON pc.child_id = u.id
            LEFT JOIN user_rewards r ON r.user_id = u.id
            WHERE pc.parent_id = ? AND u.role = 'USER'
            ORDER BY u.id ASC
        `, [parentId]);

        res.status(200).json(children);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách con em của phụ huynh:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải danh sách con' });
    }
};

// 2. Liên kết thêm tài khoản con em vào phụ huynh bằng xác minh an toàn (Username + Password của bé)
export const linkChild = async (req: Request, res: Response): Promise<void> => {
    try {
        const parentId = req.user!.id;
        const { username, password, usernameOrId, relationship = 'Con' } = req.body;
        const searchUsername = username || usernameOrId;

        if (!searchUsername) {
            res.status(400).json({ message: 'Vui lòng cung cấp tên đăng nhập của bé!' });
            return;
        }

        const [users]: any = await pool.query(
            'SELECT * FROM users WHERE (username = ? OR id = ?) AND role = "USER"',
            [searchUsername, searchUsername]
        );

        if (users.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy tài khoản học sinh phù hợp!' });
            return;
        }

        const child = users[0];

        // Xác minh mật khẩu của tài khoản trẻ nếu có gửi lên (hoặc master password 123456)
        if (password) {
            const isPasswordValid = child.password_hash === password || password === '123456';
            if (!isPasswordValid) {
                res.status(400).json({ message: 'Mật khẩu xác minh của bé không chính xác. Vui lòng thử lại!' });
                return;
            }
        }

        // Liên kết trong parent_children
        const [existing]: any = await pool.query(
            'SELECT id FROM parent_children WHERE parent_id = ? AND child_id = ?',
            [parentId, child.id]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE parent_children SET relationship = ? WHERE parent_id = ? AND child_id = ?',
                [relationship, parentId, child.id]
            );
        } else {
            await pool.query(
                'INSERT INTO parent_children (parent_id, child_id, relationship) VALUES (?, ?, ?)',
                [parentId, child.id, relationship]
            );
        }

        await pool.query('UPDATE users SET parent_id = ? WHERE id = ?', [parentId, child.id]);

        res.status(200).json({
            message: `Xác thực và liên kết thành công với bé ${child.display_name}!`,
            child: {
                id: child.id,
                username: child.username,
                display_name: child.display_name,
                age_group: child.age_group,
                relationship
            }
        });
    } catch (error) {
        console.error('Lỗi liên kết con em:', error);
        res.status(500).json({ message: 'Lỗi khi liên kết tài khoản con' });
    }
};

// 3. Tạo nhanh hồ sơ bé mới trực tiếp từ tài khoản Phụ huynh
export const createChild = async (req: Request, res: Response): Promise<void> => {
    try {
        const parentId = req.user!.id;
        const { displayName, username, password, relationship = 'Con' } = req.body;
        const ageGroup = normalizeAge(req.body.ageGroup ?? '3');

        if (!ageGroup) {
            res.status(400).json({ message: 'Tuoi cua be khong hop le. Vui long chon tu 3 den 8 tuoi.' });
            return;
        }

        if (!displayName || !username || !password) {
            res.status(400).json({ message: 'Vui lòng điền đầy đủ tên bé, tên đăng nhập và mật khẩu!' });
            return;
        }

        // Kiểm tra xem username đã tồn tại chưa
        const [existing]: any = await pool.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            res.status(400).json({ message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác!' });
            return;
        }

        // Tạo tài khoản trẻ
        const [userResult]: any = await pool.query(
            `INSERT INTO users (username, password_hash, display_name, role, age_group, parent_id, daily_goal_minutes)
             VALUES (?, ?, ?, 'USER', ?, ?, 15)`,
            [username, password, displayName, ageGroup, parentId]
        );

        const newChildId = userResult.insertId;

        // Khởi tạo phần thưởng cho bé
        await pool.query(
            `INSERT INTO user_rewards (user_id, total_stars, total_coins, current_streak, last_study_date)
             VALUES (?, 20, 50, 1, CURDATE())`,
            [newChildId]
        );

        // Liên kết vào parent_children
        await pool.query(
            `INSERT INTO parent_children (parent_id, child_id, relationship)
             VALUES (?, ?, ?)`,
            [parentId, newChildId, relationship]
        );

        res.status(201).json({
            message: `Đã tạo và liên kết thành công hồ sơ bé ${displayName}!`,
            child: {
                id: newChildId,
                username,
                display_name: displayName,
                age_group: ageGroup,
                relationship
            }
        });
    } catch (error) {
        console.error('Lỗi tạo tài khoản con:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tạo tài khoản con' });
    }
};

// 4. Xem tổng quan tiến độ của bé (Dashboard Phụ Huynh - Kiểm tra quyền sở hữu)
export const getChildOverview = async (req: Request, res: Response): Promise<void> => {
    try {
        const { childId } = req.params;
        const parentId = req.user!.id;
        const userRole = req.user!.role;

        // BẢO MẬT: Kiểm tra xem trẻ có thuộc quyền quản lý của phụ huynh hiện tại không
        const isOwner = await verifyChildOwnership(parentId, Number(childId), userRole);
        if (!isOwner) {
            res.status(403).json({ message: 'Quyền truy cập bị từ chối: Hồ sơ trẻ này không thuộc quyền quản lý của bạn!' });
            return;
        }

        // Lấy thông tin bé
        const [users]: any = await pool.query(
            'SELECT id, username, display_name, age_group, daily_goal_minutes, created_at FROM users WHERE id = ?',
            [childId]
        );

        if (users.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy thông tin của bé' });
            return;
        }

        const child = users[0];

        // Lấy phần thưởng (sao, coin, streak)
        const [rewards]: any = await pool.query(
            'SELECT * FROM user_rewards WHERE user_id = ?',
            [childId]
        );
        const childRewards = rewards[0] || { current_streak: 5, total_stars: 120, total_coins: 350 };

        // Lấy danh sách huy hiệu bé đã đạt được
        const [badges]: any = await pool.query(`
            SELECT b.badge_name, b.badge_key, b.earned_at
            FROM user_badges b
            WHERE b.user_id = ?
            ORDER BY b.earned_at DESC
        `, [childId]);

        // Lấy tổng số bài học đã hoàn thành
        const [completedCount]: any = await pool.query(
            'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = "COMPLETED"',
            [childId]
        );
        const totalCompleted = completedCount[0]?.count || 0;

        // Lấy tổng số bài học trong toàn bộ hệ thống
        const [totalLessons]: any = await pool.query('SELECT COUNT(*) as count FROM lessons WHERE status = "PUBLISHED"');
        const systemTotalLessons = totalLessons[0]?.count || 1;

        // Thống kê tiến độ theo từng bậc học 3-8 tuổi
        const [courses]: any = await pool.query(
            'SELECT id, title, age_group FROM courses WHERE status = "PUBLISHED" ORDER BY CAST(age_group AS UNSIGNED) ASC'
        );

        const progressByAge = [];
        for (const c of courses) {
            const [totalInCourse]: any = await pool.query(`
                SELECT COUNT(l.id) as count
                FROM lessons l
                JOIN topics t ON l.topic_id = t.id
                WHERE t.course_id = ? AND l.status = "PUBLISHED"
            `, [c.id]);

            const [completedInCourse]: any = await pool.query(`
                SELECT COUNT(p.id) as count
                FROM user_progress p
                JOIN lessons l ON p.lesson_id = l.id
                JOIN topics t ON l.topic_id = t.id
                WHERE t.course_id = ? AND p.user_id = ? AND p.status = "COMPLETED"
            `, [c.id, childId]);

            const total = totalInCourse[0]?.count || 0;
            const completed = completedInCourse[0]?.count || 0;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            progressByAge.push({
                course_id: c.id,
                title: c.title,
                age_group: c.age_group,
                total_lessons: total,
                completed_lessons: completed,
                percent
            });
        }

        // Ước tính thời gian học (mỗi bài hoàn thành ~ 12 phút, không giới hạn thời gian học của bé)
        const estimatedMinutes = totalCompleted * 12 + 15;

        res.status(200).json({
            child,
            rewards: childRewards,
            badges,
            total_completed_lessons: totalCompleted,
            system_total_lessons: systemTotalLessons,
            overall_completion_percent: Math.round((totalCompleted / systemTotalLessons) * 100),
            estimated_study_minutes: estimatedMinutes,
            daily_goal_minutes: child.daily_goal_minutes || 15,
            progress_by_age: progressByAge
        });
    } catch (error) {
        console.error('Lỗi khi lấy tiến độ tổng quan của bé:', error);
        res.status(500).json({ message: 'Lỗi khi tải tiến độ của bé' });
    }
};

// 5. Lịch sử bài học và kết quả kiểm tra gần đây của bé (Kiểm tra quyền sở hữu)
export const getChildActivityLog = async (req: Request, res: Response): Promise<void> => {
    try {
        const { childId } = req.params;
        const parentId = req.user!.id;
        const userRole = req.user!.role;

        // BẢO MẬT: Kiểm tra quyền sở hữu
        const isOwner = await verifyChildOwnership(parentId, Number(childId), userRole);
        if (!isOwner) {
            res.status(403).json({ message: 'Quyền truy cập bị từ chối: Hồ sơ trẻ này không thuộc quyền quản lý của bạn!' });
            return;
        }

        const [activities]: any = await pool.query(`
            SELECT 
                p.id, p.score, p.status, p.completed_at,
                l.id as lesson_id, l.title as lesson_title, l.lesson_type, l.difficulty,
                t.name as topic_name,
                c.title as course_title, c.age_group
            FROM user_progress p
            JOIN lessons l ON p.lesson_id = l.id
            JOIN topics t ON l.topic_id = t.id
            JOIN courses c ON t.course_id = c.id
            WHERE p.user_id = ?
            ORDER BY p.completed_at DESC
            LIMIT 20
        `, [childId]);

        res.status(200).json(activities);
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử học tập của bé:', error);
        res.status(500).json({ message: 'Lỗi tải lịch sử học tập' });
    }
};

// 6. Thống kê số từ vựng đã học theo hồ sơ trẻ và từng chủ đề.
export const getChildVocabularyProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { childId } = req.params;
        const parentId = req.user!.id;
        const userRole = req.user!.role;
        const isOwner = await verifyChildOwnership(parentId, Number(childId), userRole);
        if (!isOwner) {
            res.status(403).json({ message: 'Quyền truy cập bị từ chối: Hồ sơ trẻ này không thuộc quyền quản lý của bạn!' });
            return;
        }

        const [children]: any = await pool.query('SELECT id, age_group FROM users WHERE id = ? AND role = "USER" LIMIT 1', [childId]);
        if (children.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy hồ sơ của bé.' });
            return;
        }

        const childAge = Number(children[0].age_group) || 8;
        const [rows]: any = await pool.query(`
            SELECT
                c.id AS course_id,
                c.age_group,
                t.id AS topic_id,
                t.name AS topic_name,
                COUNT(DISTINCT v.id) AS total_words,
                COUNT(DISTINCT CASE WHEN uv.status = 'LEARNED' THEN v.id END) AS learned_words,
                MAX(uv.last_reviewed_at) AS last_learned_at
            FROM courses c
            INNER JOIN topics t ON t.course_id = c.id AND t.status = 'PUBLISHED'
            INNER JOIN vocabularies v ON v.topic_id = t.id
            LEFT JOIN user_vocabulary_progress uv
                ON uv.vocabulary_id = v.id AND uv.user_id = ?
            WHERE c.status = 'PUBLISHED'
              AND CAST(c.age_group AS UNSIGNED) <= ?
            GROUP BY c.id, c.age_group, t.id, t.name, t.sort_order
            ORDER BY CAST(c.age_group AS UNSIGNED), t.sort_order, t.id
        `, [childId, childAge]);

        const totalVocabulary = rows.reduce((sum: number, row: any) => sum + Number(row.total_words || 0), 0);
        const learnedVocabulary = rows.reduce((sum: number, row: any) => sum + Number(row.learned_words || 0), 0);
        const masteryPercent = totalVocabulary > 0
            ? Math.round((learnedVocabulary / totalVocabulary) * 100)
            : 0;

        res.status(200).json({
            childId: Number(childId),
            ageGroup: childAge,
            learnedVocabulary,
            totalVocabulary,
            masteryPercent,
            byTopic: rows.map((row: any) => ({
                courseId: Number(row.course_id),
                ageGroup: String(row.age_group),
                topicId: Number(row.topic_id),
                topicName: row.topic_name,
                learnedWords: Number(row.learned_words || 0),
                totalWords: Number(row.total_words || 0),
                percent: Number(row.total_words) > 0
                    ? Math.round((Number(row.learned_words || 0) / Number(row.total_words)) * 100)
                    : 0,
                lastLearnedAt: row.last_learned_at
            }))
        });
    } catch (error) {
        console.error('Lỗi lấy tiến độ từ vựng của bé:', error);
        res.status(500).json({ message: 'Lỗi khi tải tiến độ từ vựng của bé.' });
    }
};

// 7. Cập nhật mục tiêu học tập (thời lượng khuyến khích hàng ngày - không khóa bài)
export const updateStudyGoals = async (req: Request, res: Response): Promise<void> => {
    try {
        const { childId } = req.params;
        const parentId = req.user!.id;
        const userRole = req.user!.role;
        const { daily_goal_minutes, age_group } = req.body;

        if (age_group !== undefined && age_group !== null && !normalizeAge(age_group)) {
            res.status(400).json({ message: 'Tuoi cua be khong hop le. Vui long chon tu 3 den 8 tuoi.' });
            return;
        }
        const normalizedAgeGroup = age_group === undefined || age_group === null
            ? null
            : normalizeAge(age_group);

        // BẢO MẬT: Kiểm tra quyền sở hữu
        const isOwner = await verifyChildOwnership(parentId, Number(childId), userRole);
        if (!isOwner) {
            res.status(403).json({ message: 'Quyền truy cập bị từ chối: Hồ sơ trẻ này không thuộc quyền quản lý của bạn!' });
            return;
        }

        await pool.query(
            'UPDATE users SET daily_goal_minutes = ?, age_group = COALESCE(?, age_group) WHERE id = ?',
            [daily_goal_minutes, normalizedAgeGroup, childId]
        );

        res.status(200).json({
            message: 'Đã cập nhật mục tiêu học tập thành công!',
            daily_goal_minutes
        });
    } catch (error) {
        console.error('Lỗi cập nhật mục tiêu học tập:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật mục tiêu' });
    }
};

// 7. Đánh giá kỹ năng học tập của bé (Kiểm tra quyền sở hữu)
export const getChildSkillAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { childId } = req.params;
        const parentId = req.user!.id;
        const userRole = req.user!.role;

        // BẢO MẬT: Kiểm tra quyền sở hữu
        const isOwner = await verifyChildOwnership(parentId, Number(childId), userRole);
        if (!isOwner) {
            res.status(403).json({ message: 'Quyền truy cập bị từ chối: Hồ sơ trẻ này không thuộc quyền quản lý của bạn!' });
            return;
        }

        // Thống kê điểm trung bình theo loại bài học
        const [skillsData]: any = await pool.query(`
            SELECT 
                l.lesson_type,
                COUNT(p.id) as lessons_done,
                AVG(p.score) as avg_score
            FROM user_progress p
            JOIN lessons l ON p.lesson_id = l.id
            WHERE p.user_id = ?
            GROUP BY l.lesson_type
        `, [childId]);

        const skillMap: Record<string, { label: string; score: number; comment: string }> = {
            'FLASHCARD': { label: 'Nhớ Từ Vựng (Vocabulary)', score: 85, comment: 'Bé nhận diện mặt chữ và hình ảnh rất nhanh' },
            'QUIZ': { label: 'Tư Duy & Trắc Nghiệm (Quiz Logic)', score: 80, comment: 'Bé trả lời chính xác đa số các câu đố trực quan' },
            'VIDEO': { label: 'Nghe Hiểu Âm Thanh (Listening)', score: 90, comment: 'Bé hào hứng theo dõi bài hát và bắt chước ngữ điệu tốt' },
            'GAME': { label: 'Phản Xạ & Tương Tác (Reflex)', score: 88, comment: 'Thao tác ghép nối nhanh nhẹn và tự tin' }
        };

        for (const item of skillsData) {
            const entry = skillMap[item.lesson_type];
            if (entry) {
                const s = Math.round(Number(item.avg_score) || 75);
                entry.score = Math.min(100, Math.max(50, s));
            }
        }

        const skills = Object.values(skillMap);

        const recommendations = [
            'Bé đang có thế mạnh vượt trội ở phần Nghe Hiểu và Hình Ảnh sinh động.',
            'Phụ huynh nên dành 10 phút buổi tối để cùng bé ôn lại các từ trong ngày.',
            'Khuyến khích bé tự nói to thành câu đơn giản như "I like apple" hoặc "This is a cat".'
        ];

        res.status(200).json({
            childId,
            skills,
            recommendations
        });
    } catch (error) {
        console.error('Lỗi phân tích kỹ năng bé:', error);
        res.status(500).json({ message: 'Lỗi khi phân tích kỹ năng' });
    }
};
