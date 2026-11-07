import { Request, Response } from 'express';
export declare const AVATAR_ITEMS: {
    id: number;
    name: string;
    emoji: string;
    cost_stars: number;
    description: string;
}[];
export declare const completeLesson: (req: Request, res: Response) => Promise<void>;
export declare const getUserRewards: (req: Request, res: Response) => Promise<void>;
export declare const getLeaderboard: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=progress.controller.d.ts.map