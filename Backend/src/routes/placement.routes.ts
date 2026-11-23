import { Router } from 'express';
import { getPlacementQuestions } from '../controllers/placement.controller';

const router = Router();

router.get('/questions', getPlacementQuestions);

export default router;
