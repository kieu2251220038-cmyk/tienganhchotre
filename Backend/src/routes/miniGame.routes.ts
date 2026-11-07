import { Router } from 'express';
import { getActiveMiniGames } from '../controllers/miniGame.controller';

const router = Router();

router.get('/', getActiveMiniGames);

export default router;
