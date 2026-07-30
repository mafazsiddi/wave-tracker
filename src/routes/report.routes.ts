import { Router } from 'express';
import { getReports, exportReports } from '../controllers/report.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', getReports);
router.get('/export', exportReports);

export default router;
