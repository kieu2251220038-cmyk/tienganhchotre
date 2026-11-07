import { Router } from 'express';
import {
    getChildren,
    linkChild,
    createChild,
    getChildOverview,
    getChildActivityLog,
    getChildVocabularyProgress,
    updateStudyGoals,
    getChildSkillAssessment
} from '../controllers/parent.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Toàn bộ API Phụ huynh yêu cầu Token hợp lệ và Vai trò PARENT hoặc ADMIN
router.use(verifyToken, requireRole(['PARENT', 'ADMIN']));

// Quản lý danh sách con em
router.get('/children', getChildren);
router.get('/:parentId/children', getChildren);

// Liên kết con em an toàn hoặc tạo hồ sơ con mới
router.post('/children/link', linkChild);
router.post('/children/create', createChild);
router.post('/:parentId/children', linkChild);

// Chi tiết học tập từng con (yêu cầu quyền sở hữu hồ sơ trẻ)
router.get('/child/:childId/overview', getChildOverview);
router.get('/child/:childId/activity-log', getChildActivityLog);
router.get('/child/:childId/vocabulary-progress', getChildVocabularyProgress);
router.put('/child/:childId/goals', updateStudyGoals);
router.get('/child/:childId/skills', getChildSkillAssessment);

export default router;
