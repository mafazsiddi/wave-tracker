import { Router } from 'express';
import { auth, callback, health, sync } from '../controllers/linkedin.controller';

const router = Router();

router.get('/auth', auth);
router.get('/callback', callback);
router.get('/health', health);
router.post('/sync', sync);

export default router;
