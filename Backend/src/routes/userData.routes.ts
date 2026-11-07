import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  getUserPreferences,
  updateUserPreferences,
  saveSpeakingSummary,
  getLatestSpeakingSummary
} from '../controllers/userData.controller';

const router = Router();

router.use(verifyToken);
router.get('/preferences', getUserPreferences);
router.put('/preferences', updateUserPreferences);
router.post('/speaking-summaries', saveSpeakingSummary);
router.get('/speaking-summaries/latest', getLatestSpeakingSummary);

export default router;
