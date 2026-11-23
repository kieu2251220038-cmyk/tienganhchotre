import { Router } from 'express';
import { getLessonsForReview, getLessonReviewDetail, reviewLesson, getExpertStats, getCurriculumStandards } from '../controllers/expert.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Toàn bộ API Chuyên gia yêu cầu Token hợp lệ và Vai trò EXPERT hoặc ADMIN
router.use(verifyToken, requireRole(['EXPERT', 'ADMIN']));

router.get('/lessons', getLessonsForReview);
router.get('/lessons/:id/detail', getLessonReviewDetail);
router.put('/lessons/:id/review', requireRole(['EXPERT', 'ADMIN']), reviewLesson);
router.get('/stats', getExpertStats);
router.get('/standards', getCurriculumStandards);

export default router;
