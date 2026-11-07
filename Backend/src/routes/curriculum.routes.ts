import { Router } from 'express';
import { getCurriculumRoadmap, searchMaterials, getLessonPedagogyDetail } from '../controllers/curriculum.controller';

const router = Router();

router.get('/roadmap', getCurriculumRoadmap);
router.get('/materials', searchMaterials);
router.get('/lessons/:lessonId/pedagogy', getLessonPedagogyDetail);

export default router;
