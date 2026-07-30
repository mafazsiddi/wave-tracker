import { Router } from 'express';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from '../controllers/campaign.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createCampaignSchema, updateCampaignSchema } from '../validators';

const router = Router();

router.use(authenticateJWT);

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/', authorizeRoles('ADMIN'), validateRequest(createCampaignSchema), createCampaign);
router.put('/:id', authorizeRoles('ADMIN'), validateRequest(updateCampaignSchema), updateCampaign);
router.delete('/:id', authorizeRoles('ADMIN'), deleteCampaign);

export default router;
