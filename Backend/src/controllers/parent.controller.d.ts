import { Request, Response } from 'express';
/**
 * Hàm kiểm tra quyền sở hữu hồ sơ trẻ (Bảo mật RBAC & chống IDOR)
 * Phụ huynh chỉ được xem dữ liệu của con em mà mình đã liên kết. Admin có toàn quyền.
 */
export declare const verifyChildOwnership: (parentId: number, childId: number, role: string) => Promise<boolean>;
export declare const getChildren: (req: Request, res: Response) => Promise<void>;
export declare const linkChild: (req: Request, res: Response) => Promise<void>;
export declare const createChild: (req: Request, res: Response) => Promise<void>;
export declare const getChildOverview: (req: Request, res: Response) => Promise<void>;
export declare const getChildActivityLog: (req: Request, res: Response) => Promise<void>;
export declare const updateStudyGoals: (req: Request, res: Response) => Promise<void>;
export declare const getChildSkillAssessment: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=parent.controller.d.ts.map