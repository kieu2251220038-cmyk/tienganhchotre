import { Router } from 'express';
import { getAllCourses } from '../controllers/course.controller';
import { 
    getTopicsByCourse, 
    getLessonsByTopic, 
    getVocabulariesByTopic 
} from '../controllers/content.controller';

const router = Router();

// API lấy toàn bộ danh sách khóa học: /api/courses
router.get('/', getAllCourses);

// API lấy Chủ đề theo Khóa học: /api/courses/:courseId/topics
router.get('/:courseId/topics', getTopicsByCourse);

// API lấy Bài học theo Chủ đề: /api/courses/topics/:topicId/lessons
router.get('/topics/:topicId/lessons', getLessonsByTopic);

// API lấy Từ vựng theo Chủ đề: /api/courses/topics/:topicId/vocabularies
router.get('/topics/:topicId/vocabularies', getVocabulariesByTopic);

export default router;