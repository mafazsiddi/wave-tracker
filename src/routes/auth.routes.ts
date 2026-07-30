import { Router } from 'express';
import { login, logout, getMe } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { loginSchema } from '../validators';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticateJWT, getMe);

export default router;
