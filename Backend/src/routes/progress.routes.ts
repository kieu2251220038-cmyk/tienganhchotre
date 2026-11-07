import { Router } from 'express';
import { completeLesson, markVocabularyLearned, getUserRewards, getLeaderboard } from '../controllers/progress.controller';
import { claimChest, getChestStatus } from '../controllers/chest.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// API lấy bảng xếp hạng đua rank: GET /api/progress/leaderboard
router.get('/leaderboard', getLeaderboard);

// API lưu tiến độ khi học xong 1 bài: POST /api/progress/complete
router.post('/complete', completeLesson);
router.post('/vocabulary/learned', markVocabularyLearned);

// API xem điểm thưởng/huy hiệu của bé: GET /api/progress/rewards/:userId
router.get('/rewards/:userId', getUserRewards);

// API kiểm tra và nhận phần thưởng Rương theo từng Bậc: GET/POST /api/progress/chest
router.get('/chest/status/:ageGroup', getChestStatus);
router.post('/chest/claim', claimChest);

export default router;
