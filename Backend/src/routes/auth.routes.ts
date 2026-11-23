import { Router } from 'express';
import { login, register, getProfile, updateProfile, getDemoToken, updatePlacementLevel } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', verifyToken, getProfile);
router.put('/me', verifyToken, updateProfile);
router.get('/demo-token/:userId', getDemoToken);
router.post('/placement-level', updatePlacementLevel);

export default router;
