import { Request, Response, NextFunction } from 'express';
export declare const JWT_SECRET: string;
export interface AuthPayload {
    id: number;
    username: string;
    role: 'USER' | 'ADMIN' | 'EXPERT' | 'PARENT';
    display_name?: string;
}
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
export declare const verifyToken: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware phân quyền theo vai trò (Role-Based Access Control)
 * @param allowedRoles Danh sách các vai trò được phép truy cập
 */
export declare const requireRole: (allowedRoles: Array<'USER' | 'ADMIN' | 'EXPERT' | 'PARENT'>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map