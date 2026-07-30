import { Router } from 'express';
import {
  syncSalesforce,
  getSalesforceStatus,
  syncHubspot,
  getHubspotStatus,
} from '../controllers/integration.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/salesforce/sync', authorizeRoles('ADMIN'), syncSalesforce);
router.get('/salesforce/status', getSalesforceStatus);
router.post('/hubspot/sync', authorizeRoles('ADMIN'), syncHubspot);
router.get('/hubspot/status', getHubspotStatus);

export default router;
