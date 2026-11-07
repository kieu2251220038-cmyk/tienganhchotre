import { Router } from 'express';
import { 
    getTopicsByCourse, 
    getLessonsByTopic, 
    getVocabulariesByTopic,
    getLessonById,
    addVocabulary
} from '../controllers/content.controller';

const router = Router();

// API lấy Chủ đề theo Khóa học: /api/content/courses/:courseId/topics
router.get('/courses/:courseId/topics', getTopicsByCourse);

// API lấy Bài học theo Chủ đề: /api/content/topics/:topicId/lessons
router.get('/topics/:topicId/lessons', getLessonsByTopic);

// API lấy Từ vựng theo Chủ đề: /api/content/topics/:topicId/vocabularies
router.get('/topics/:topicId/vocabularies', getVocabulariesByTopic);

// API lấy Chi tiết bài học (kèm câu hỏi, đáp án, từ vựng): /api/content/lessons/:lessonId
router.get('/lessons/:lessonId', getLessonById);

// API thêm từ vựng mới dành cho Admin
router.post('/vocabularies', addVocabulary);

export default router;