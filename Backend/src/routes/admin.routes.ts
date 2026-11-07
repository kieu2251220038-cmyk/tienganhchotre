import { Router } from 'express';
import {
    getAdminStats,
    getAdminCourses,
    createAdminCourse,
    updateAdminCourse,
    deleteAdminCourse,
    getAdminUsers,
    updateAdminUser,
    deleteAdminUser,
    getAdminLessons,
    createAdminLesson,
    updateAdminLesson,
    deleteAdminLesson,
    getAdminVocabularies,
    createAdminVocabulary,
    updateAdminVocabulary,
    deleteAdminVocabulary,
    getAdminQuizQuestions,
    createAdminQuizQuestion,
    updateAdminQuizQuestion,
    deleteAdminQuizQuestion,
    getAdminTopics,
    createAdminTopic,
    updateAdminTopic,
    deleteAdminTopic,
    getSystemAnalytics,
    getGameConfigs,
    updateGameConfig
} from '../controllers/admin.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';
import {
    getAdminMiniGames,
    createAdminMiniGame,
    updateAdminMiniGame,
    updateAdminMiniGameStatus,
    deleteAdminMiniGame
} from '../controllers/miniGame.controller';

const router = Router();

// Toàn bộ API Quản trị yêu cầu Token hợp lệ và Vai trò ADMIN
router.use(verifyToken, requireRole(['ADMIN']));

// A01: Dashboard Thống Kê
router.get('/stats', getAdminStats);

// A03: Quản lý Khóa học
router.get('/courses', getAdminCourses);
router.post('/courses', createAdminCourse);
router.put('/courses/:id', updateAdminCourse);
router.delete('/courses/:id', deleteAdminCourse);

// A02: Quản lý Users
router.get('/users', getAdminUsers);
router.put('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);

// A03: Quản lý Bài học
router.get('/lessons', getAdminLessons);
router.post('/lessons', createAdminLesson);
router.put('/lessons/:id', updateAdminLesson);
router.delete('/lessons/:id', deleteAdminLesson);

// A04: Quản lý Từ vựng & Media
router.get('/vocabularies', getAdminVocabularies);
router.post('/vocabularies', createAdminVocabulary);
router.put('/vocabularies/:id', updateAdminVocabulary);
router.delete('/vocabularies/:id', deleteAdminVocabulary);

// A05: Quản lý Quiz
router.get('/questions', getAdminQuizQuestions);
router.post('/questions', createAdminQuizQuestion);
router.put('/questions/:id', updateAdminQuizQuestion);
router.delete('/questions/:id', deleteAdminQuizQuestion);

// A08: Quản lý Chủ đề (Topics)
router.get('/topics', getAdminTopics);
router.post('/topics', createAdminTopic);
router.put('/topics/:id', updateAdminTopic);
router.delete('/topics/:id', deleteAdminTopic);

// A09: Báo cáo & Thống kê hệ thống
router.get('/analytics', getSystemAnalytics);

// A06: Game Configs - lưu vào MySQL (thay thế localStorage)
router.get('/game-configs', getGameConfigs);
router.put('/game-configs/:id', updateGameConfig);

// A06: Mini game chuẩn hóa, liên kết trực tiếp với topics/courses trong CSDL.
router.get('/mini-games', getAdminMiniGames);
router.post('/mini-games', createAdminMiniGame);
router.put('/mini-games/:id', updateAdminMiniGame);
router.patch('/mini-games/:id/status', updateAdminMiniGameStatus);
router.delete('/mini-games/:id', deleteAdminMiniGame);

export default router;
