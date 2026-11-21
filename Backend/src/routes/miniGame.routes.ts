import { Router } from 'express';
import { getActiveMiniGames, getMiniGameBilingualContent } from '../controllers/miniGame.controller';

const router = Router();

router.get('/:gameId/bilingual-content', getMiniGameBilingualContent);
router.get('/', getActiveMiniGames);

export default router;
