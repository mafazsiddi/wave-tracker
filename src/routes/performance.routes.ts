import { Router } from 'express';
import {
  getPerformanceMetrics,
  getPerformanceByCampaignId,
  createPerformanceMetric,
  updatePerformanceMetric,
} from '../controllers/performance.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createPerformanceSchema } from '../validators';

const router = Router();

router.use(authenticateJWT);

router.get('/', getPerformanceMetrics);
router.get('/:campaignId', getPerformanceByCampaignId);
router.post('/', authorizeRoles('ADMIN'), validateRequest(createPerformanceSchema), createPerformanceMetric);
router.put('/:id', authorizeRoles('ADMIN'), updatePerformanceMetric);

export default router;
