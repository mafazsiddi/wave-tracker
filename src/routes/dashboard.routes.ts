import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', getDashboardSummary);

export default router;
