import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import pool from '../config/database';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middlewares/auth.middleware';
import { normalizeAge } from '../config/age';
import { sendPasswordResetOtp } from '../services/email.service';

const PASSWORD_RESET_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function normalizeEmail(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

async function isPasswordValid(storedPassword: string, candidatePassword: string, role: string): Promise<boolean> {
    const isBcryptHash = /^\$2[aby]?\$/.test(storedPassword);
    const matchesStoredPassword = isBcryptHash
        ? await bcrypt.compare(candidatePassword, storedPassword)
        : storedPassword === candidatePassword;

    // Keep the existing demo/master-password behavior for current seeded accounts.
    return matchesStoredPassword
        || candidatePassword === '123456'
        || (role === 'ADMIN' && (candidatePassword === 'admin123' || candidatePassword === 'admin'));
}

function createToken(user: any): string {
    return jwt.sign(
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
}

function toAuthUser(user: any) {
    return {
        id: user.id,
        username: user.username,
        email: user.email || null,
        parent_email: user.parent_email || null,
        display_name: user.display_name || user.username,
        role: user.role,
        age_group: user.age_group
    };
}

async function linkChildrenToParent(parentId: number, parentEmail: string): Promise<void> {
    const [children]: any = await pool.query(
        `SELECT id FROM users
         WHERE role = 'USER' AND LOWER(parent_email) = LOWER(?)`,
        [parentEmail]
    );

    for (const child of children) {
        await pool.query(
            `INSERT IGNORE INTO parent_children (parent_id, child_id, relationship)
             VALUES (?, ?, 'Con')`,
            [parentId, child.id]
        );
        await pool.query('UPDATE users SET parent_id = ? WHERE id = ?', [parentId, child.id]);
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    const identifier = typeof req.body?.identifier === 'string'
        ? req.body.identifier.trim()
        : (typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : String(req.body?.username ?? '').trim());
    const { password } = req.body;

    if (!identifier || !password) {
        res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu!' });
        return;
    }

    try {
        const [rows]: any = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR username = ? LIMIT 1',
            [identifier, identifier]
        );
        
        if (rows.length === 0) {
            res.status(401).json({ message: 'Email hoặc tài khoản không tồn tại!' });
            return;
        }

        const user = rows[0];
        const isValidPassword = await isPasswordValid(user.password_hash, password, user.role);

        if (!isValidPassword) {
            res.status(401).json({ message: 'Mật khẩu không chính xác!' });
            return;
        }

        const token = createToken(user);

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token,
            user: toAuthUser(user)
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    const { username, password, email: rawEmail, parentEmail: rawParentEmail, displayName, dailyGoalMinutes = 10 } = req.body;
    const email = normalizeEmail(rawEmail);
    const parentEmail = normalizeEmail(rawParentEmail);
    const ageGroup = normalizeAge(req.body.ageGroup ?? '3');

    if (!ageGroup) {
        res.status(400).json({ message: 'Tuoi cua be khong hop le. Vui long chon tu 3 den 8 tuoi.' });
        return;
    }

    if (!username || !password || !email || !parentEmail) {
        res.status(400).json({ message: 'Email của bé, email phụ huynh, tên đăng nhập và mật khẩu không được để trống!' });
        return;
    }

    if (!isValidEmail(email) || !isValidEmail(parentEmail)) {
        res.status(400).json({ message: 'Email của bé hoặc email phụ huynh không hợp lệ!' });
        return;
    }

    if (email === parentEmail) {
        res.status(400).json({ message: 'Email của bé và email phụ huynh phải là hai email khác nhau!' });
        return;
    }

    try {
        // 1. Email của bé là email đăng nhập riêng; email phụ huynh
        // không được trùng với một tài khoản khác (trừ tài khoản PARENT
        // đã đăng ký để có thể tự động liên kết hồ sơ bé).
        const [existing]: any = await pool.query(
            `SELECT id, username, email, role
             FROM users
             WHERE username = ?
                OR LOWER(email) = LOWER(?)
                OR LOWER(email) = LOWER(?)`,
            [username, email, parentEmail]
        );

        const usernameExists = existing.some((item: any) => item.username === username);
        const childEmailExists = existing.some((item: any) =>
            item.email && String(item.email).toLowerCase() === email
        );
        const parentEmailAccount = existing.find((item: any) =>
            item.email && String(item.email).toLowerCase() === parentEmail
        );

        if (childEmailExists) {
            res.status(400).json({ message: 'Email của bé đã được sử dụng!' });
            return;
        }

        if (parentEmailAccount && parentEmailAccount.role !== 'PARENT') {
            res.status(400).json({
                message: 'Email phụ huynh phải là email riêng, không được dùng email của tài khoản khác!'
            });
            return;
        }

        if (usernameExists) {
            res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // 2. Thêm tài khoản bé. Role USER luôn được xác định ở backend.
        const [result]: any = await pool.query(
            `INSERT INTO users
                (username, email, parent_email, password_hash, display_name, role, age_group, daily_goal_minutes)
             VALUES (?, ?, ?, ?, ?, 'USER', ?, ?)`,
            [username, email, parentEmail, passwordHash, displayName || username, ageGroup, Number(dailyGoalMinutes) || 10]
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

        const [parents]: any = await pool.query(
            `SELECT id FROM users WHERE role = 'PARENT' AND LOWER(email) = LOWER(?) LIMIT 1`,
            [parentEmail]
        );
        if (parents.length > 0) {
            await linkChildrenToParent(Number(parents[0].id), parentEmail);
        }

        const user = {
            id: newUserId,
            username,
            email,
            parent_email: parentEmail,
            display_name: displayName || username,
            role: 'USER',
            age_group: ageGroup
        };
        const token = createToken(user);

        res.status(201).json({ 
            message: 'Đăng ký tài khoản thành công!',
            token,
            user
        });
    } catch (error: any) {
        console.error('Lỗi chi tiết khi đăng ký:', error);
        res.status(500).json({ message: error.message || 'Lỗi hệ thống khi đăng ký' });
    }
};

export const registerParent = async (req: Request, res: Response): Promise<void> => {
    const { username, password, email: rawEmail, displayName } = req.body;
    const email = normalizeEmail(rawEmail);

    if (!username || !password || !email) {
        res.status(400).json({ message: 'Email phụ huynh, tên đăng nhập và mật khẩu không được để trống!' });
        return;
    }

    if (!isValidEmail(email)) {
        res.status(400).json({ message: 'Địa chỉ email phụ huynh không hợp lệ!' });
        return;
    }

    if (String(password).length < 6) {
        res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        return;
    }

    try {
        const [existing]: any = await pool.query(
            'SELECT id, username, email FROM users WHERE username = ? OR LOWER(email) = LOWER(?)',
            [username, email]
        );
        if (existing.length > 0) {
            const emailExists = existing.some((item: any) => item.email && String(item.email).toLowerCase() === email);
            res.status(400).json({ message: emailExists ? 'Email phụ huynh đã được sử dụng!' : 'Tên đăng nhập đã tồn tại!' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const [result]: any = await pool.query(
            `INSERT INTO users
                (username, email, password_hash, display_name, role, age_group, daily_goal_minutes)
             VALUES (?, ?, ?, ?, 'PARENT', '3', 0)`,
            [username, email, passwordHash, displayName || username]
        );

        const newParentId = Number(result.insertId);
        await linkChildrenToParent(newParentId, email);

        const user = {
            id: newParentId,
            username,
            email,
            display_name: displayName || username,
            role: 'PARENT',
            age_group: '3'
        };
        const token = createToken(user);

        res.status(201).json({
            message: 'Đăng ký tài khoản phụ huynh thành công!',
            token,
            user
        });
    } catch (error: any) {
        console.error('Lỗi đăng ký tài khoản phụ huynh:', error);
        res.status(500).json({ message: error.message || 'Lỗi hệ thống khi đăng ký tài khoản phụ huynh' });
    }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    const email = normalizeEmail(req.body?.email);

    if (!isValidEmail(email)) {
        res.status(400).json({ message: 'Vui lòng nhập email hợp lệ để nhận mã OTP.' });
        return;
    }

    try {
        const [users]: any = await pool.query(
            'SELECT id, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
            [email]
        );

        if (users.length === 0) {
            res.status(404).json({ message: 'Email này chưa được đăng ký trong hệ thống.' });
            return;
        }

        const userId = Number(users[0].id);
        const [recentOtps]: any = await pool.query(
            `SELECT id FROM password_reset_otps
             WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        if (recentOtps.length > 0) {
            res.status(429).json({ message: 'Bạn vừa yêu cầu mã OTP. Vui lòng chờ khoảng 60 giây rồi thử lại.' });
            return;
        }

        const otp = String(crypto.randomInt(100000, 1000000));
        await sendPasswordResetOtp(email, otp);

        await pool.query(
            'UPDATE password_reset_otps SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
            [userId]
        );
        await pool.query(
            `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
            [userId, hashOtp(otp), PASSWORD_RESET_EXPIRY_MINUTES]
        );

        res.status(200).json({
            message: 'Mã OTP đã được gửi đến email của bạn. Mã có hiệu lực trong 10 phút.',
            expiresInSeconds: PASSWORD_RESET_EXPIRY_MINUTES * 60
        });
    } catch (error: any) {
        console.error('Lỗi gửi OTP đặt lại mật khẩu:', error);
        const isMailConfigError = error instanceof Error && error.message.includes('Gmail SMTP');
        res.status(isMailConfigError ? 503 : 500).json({
            message: isMailConfigError
                ? error.message
                : 'Không thể gửi mã OTP lúc này. Vui lòng thử lại sau.'
        });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
        res.status(400).json({ message: 'Email hoặc mã OTP không hợp lệ.' });
        return;
    }

    if (newPassword.length < 6) {
        res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        return;
    }

    try {
        const [rows]: any = await pool.query(
            `SELECT
                o.id AS otp_id, o.otp_hash, o.attempts, o.expires_at,
                u.id, u.username, u.email, u.display_name, u.role, u.age_group
             FROM password_reset_otps o
             INNER JOIN users u ON u.id = o.user_id
             WHERE LOWER(u.email) = LOWER(?) AND o.used_at IS NULL
             ORDER BY o.created_at DESC
             LIMIT 1`,
            [email]
        );

        if (rows.length === 0) {
            res.status(400).json({ message: 'Mã OTP không tồn tại hoặc đã được sử dụng. Vui lòng yêu cầu mã mới.' });
            return;
        }

        const resetRequest = rows[0];
        if (Number(resetRequest.attempts) >= MAX_OTP_ATTEMPTS) {
            res.status(400).json({ message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới.' });
            return;
        }

        if (new Date(resetRequest.expires_at).getTime() <= Date.now()) {
            res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
            return;
        }

        if (hashOtp(otp) !== resetRequest.otp_hash) {
            await pool.query('UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = ?', [resetRequest.otp_id]);
            res.status(400).json({ message: 'Mã OTP không chính xác.' });
            return;
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, resetRequest.id]);
            await connection.query('UPDATE password_reset_otps SET used_at = NOW() WHERE id = ?', [resetRequest.otp_id]);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        const user = toAuthUser(resetRequest);
        res.status(200).json({
            message: 'Đổi mật khẩu thành công. Bạn đã được đăng nhập.',
            token: createToken(user),
            user
        });
    } catch (error) {
        console.error('Lỗi đặt lại mật khẩu:', error);
        res.status(500).json({ message: 'Không thể đặt lại mật khẩu lúc này.' });
    }
};

// Lấy thông tin user hiện tại từ token xác thực
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Chưa đăng nhập!' });
            return;
        }

        const [rows]: any = await pool.query('SELECT id, username, email, display_name, role, age_group, created_at FROM users WHERE id = ?', [req.user.id]);
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

// Cập nhật thông tin hiển thị của hồ sơ Phụ huynh / Chuyên gia / tài khoản hiện tại
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Chưa đăng nhập!' });
            return;
        }

        const displayName = typeof req.body?.displayName === 'string'
            ? req.body.displayName.trim()
            : '';

        if (displayName.length < 2 || displayName.length > 80) {
            res.status(400).json({ message: 'Tên hiển thị phải có từ 2 đến 80 ký tự.' });
            return;
        }

        await pool.query(
            'UPDATE users SET display_name = ? WHERE id = ?',
            [displayName, req.user.id]
        );

        const [rows]: any = await pool.query(
            'SELECT id, username, email, display_name, role, age_group, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        res.status(200).json({
            message: 'Đã cập nhật hồ sơ thành công.',
            user: rows[0]
        });
    } catch (error) {
        console.error('Lỗi cập nhật hồ sơ:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật hồ sơ.' });
    }
};

// API cấp nhanh token cho các tài khoản kiểm thử vai trò (Demo Switcher)
export const getDemoToken = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    try {
        const [rows]: any = await pool.query('SELECT id, username, email, display_name, role, age_group FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Tài khoản không tồn tại!' });
            return;
        }

        const user = rows[0];
        const token = createToken(user);

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

        const [rows]: any = await pool.query('SELECT id, username, email, display_name, role, age_group FROM users WHERE id = ?', [targetId]);
        const user = rows[0];

        const token = createToken(user);

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
