import { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'kids_english_super_secret_jwt_key_2026';

export interface AuthPayload {
    id: number;
    username: string;
    role: 'USER' | 'ADMIN' | 'EXPERT' | 'PARENT';
    display_name?: string;
}

// Mở rộng Request type của Express để lưu user
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

/**
 * Middleware xác thực token JWT
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục! (Thiếu mã xác thực)' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Mã xác thực không hợp lệ!' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as AuthPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!' });
        return;
    }
};

/**
 * Middleware phân quyền theo vai trò (Role-Based Access Control)
 * @param allowedRoles Danh sách các vai trò được phép truy cập
 */
export const requireRole = (allowedRoles: Array<'USER' | 'ADMIN' | 'EXPERT' | 'PARENT'>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Chưa xác thực danh tính người dùng!' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ 
                message: `Quyền truy cập bị từ chối! Chức năng này chỉ dành cho vai trò: [${allowedRoles.join(', ')}]. Vai trò hiện tại của bạn là: [${req.user.role}]` 
            });
            return;
        }

        next();
    };
};
