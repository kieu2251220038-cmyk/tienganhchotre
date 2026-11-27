import { Router } from 'express';
import { login, register, registerParent, requestPasswordReset, resetPassword, getProfile, updateProfile, getDemoToken, updatePlacementLevel } from '../controllers/auth.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/register/parent', registerParent);
router.post('/forgot-password/request-otp', requestPasswordReset);
router.post('/forgot-password/reset', resetPassword);
router.get('/me', verifyToken, getProfile);
router.put('/me', verifyToken, updateProfile);
// Demo token chỉ dành cho quản trị viên; không để user thường tự cấp token PARENT.
router.get('/demo-token/:userId', verifyToken, requireRole(['ADMIN']), getDemoToken);
router.post('/placement-level', updatePlacementLevel);

export default router;
