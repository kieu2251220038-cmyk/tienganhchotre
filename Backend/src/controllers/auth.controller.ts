import { Request, Response } from 'express';
import pool from '../config/database';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middlewares/auth.middleware';
import { normalizeAge } from '../config/age';

export const login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu!' });
        return;
    }

    try {
        const [rows]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (rows.length === 0) {
            res.status(401).json({ message: 'Tên đăng nhập không tồn tại!' });
            return;
        }

        const user = rows[0];
        // Cho phép mật khẩu hash hoặc master password '123456' / 'admin123'
        const isValidPassword = 
            user.password_hash === password || 
            password === '123456' || 
            (user.role === 'ADMIN' && (password === 'admin123' || password === 'admin'));

        if (!isValidPassword) {
            res.status(401).json({ message: 'Mật khẩu không chính xác!' });
            return;
        }

        // Tạo JWT Token có thời hạn 7 ngày
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                display_name: user.display_name || user.username,
                role: user.role,
                age_group: user.age_group
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name || user.username,
                role: user.role,
                age_group: user.age_group
            }
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    const { username, password, displayName, role = 'USER', dailyGoalMinutes = 10 } = req.body;
    const ageGroup = normalizeAge(req.body.ageGroup ?? '3');

    if (!ageGroup) {
        res.status(400).json({ message: 'Tuoi cua be khong hop le. Vui long chon tu 3 den 8 tuoi.' });
        return;
    }

    if (!username || !password) {
        res.status(400).json({ message: 'Tên đăng nhập và mật khẩu không được để trống!' });
        return;
    }

    try {
        // 1. Kiểm tra xem username đã tồn tại chưa
        const [existing]: any = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
            return;
        }

        // 2. Thêm người dùng mới vào database
        const validRoles = ['USER', 'ADMIN', 'EXPERT', 'PARENT'];
        const userRole = validRoles.includes(role) ? role : 'USER';

        const [result]: any = await pool.query(
            'INSERT INTO users (username, password_hash, display_name, role, age_group, daily_goal_minutes) VALUES (?, ?, ?, ?, ?, ?)',
            [username, password, displayName || username, userRole, ageGroup, Number(dailyGoalMinutes) || 10]
        );

        const newUserId = result.insertId;

        // Tạo phần thưởng ban đầu
        await pool.query(
            'INSERT INTO user_rewards (user_id, total_stars, total_coins, current_streak) VALUES (?, 0, 0, 0) ON DUPLICATE KEY UPDATE user_id = user_id',
            [newUserId]
        );
        await pool.query(
            'INSERT INTO user_preferences (user_id, unlocked_age) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = user_id',
            [newUserId, Number(ageGroup)]
        );

        const token = jwt.sign(
            {
                id: newUserId,
                username,
                display_name: displayName || username,
                role: userRole,
                age_group: ageGroup
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ 
            message: 'Đăng ký tài khoản thành công!',
            token,
            user: {
                id: newUserId,
                username,
                display_name: displayName || username,
                role: userRole,
                age_group: ageGroup
            }
        });
    } catch (error: any) {
        console.error('Lỗi chi tiết khi đăng ký:', error);
        res.status(500).json({ message: error.message || 'Lỗi hệ thống khi đăng ký' });
    }
};

// Lấy thông tin user hiện tại từ token xác thực
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Chưa đăng nhập!' });
            return;
        }

        const [rows]: any = await pool.query('SELECT id, username, display_name, role, age_group, created_at FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
            return;
        }

        res.status(200).json({ user: rows[0] });
    } catch (error) {
        console.error('Lỗi lấy thông tin cá nhân:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

// API cấp nhanh token cho các tài khoản kiểm thử vai trò (Demo Switcher)
export const getDemoToken = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    try {
        const [rows]: any = await pool.query('SELECT id, username, display_name, role, age_group FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Tài khoản không tồn tại!' });
            return;
        }

        const user = rows[0];
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                role: user.role,
                age_group: user.age_group
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({ token, user });
    } catch (error) {
        console.error('Lỗi tạo demo token:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

// API lưu kết quả bài test đánh giá trình độ đầu vào cho bé
export const updatePlacementLevel = async (req: Request, res: Response): Promise<void> => {
    const { userId, level, ageGroup, testScore } = req.body;
    const normalizedAgeGroup = normalizeAge(ageGroup ?? '3');
    if (!normalizedAgeGroup) {
        res.status(400).json({ message: 'Tuoi cua be khong hop le. Vui long chon tu 3 den 8 tuoi.' });
        return;
    }
    try {
        const targetId = userId || req.user?.id || 6;

        // Cập nhật độ tuổi / cấp độ phù hợp của bé vào database
        await pool.query('UPDATE users SET age_group = ? WHERE id = ?', [normalizedAgeGroup, targetId]);

        // Thưởng ngay 20 sao và 50 xu khích lệ bé sau bài test đầu vào
        await pool.query(
            'UPDATE user_rewards SET total_stars = total_stars + 20, total_coins = total_coins + 50 WHERE user_id = ?',
            [targetId]
        );

        const [rows]: any = await pool.query('SELECT id, username, display_name, role, age_group FROM users WHERE id = ?', [targetId]);
        const user = rows[0];

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                role: user.role,
                age_group: user.age_group
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Đã hoàn thành khảo sát và xếp lớp thành công cho bé!',
            user,
            token,
            starsEarned: 20,
            coinsEarned: 50,
            recommendedLevel: level,
            ageGroup: normalizedAgeGroup
        });
    } catch (error) {
        console.error('Lỗi cập nhật kết quả khảo sát đầu vào:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lưu kết quả bài test' });
    }
};
