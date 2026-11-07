import { Router } from 'express';
import { login, register, getProfile, getDemoToken, updatePlacementLevel } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', verifyToken, getProfile);
router.get('/demo-token/:userId', getDemoToken);
router.post('/placement-level', updatePlacementLevel);

export default router;