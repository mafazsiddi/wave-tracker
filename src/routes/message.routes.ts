import { Router } from 'express';
import {
  getMessages,
  getMessageById,
  createMessage,
  updateMessage,
  updateMessageStatus,
  deleteMessage,
} from '../controllers/message.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createDashboardMessageSchema, updateMessageStatusSchema } from '../validators';

const router = Router();

router.use(authenticateJWT);

router.get('/', getMessages);
router.get('/:id', getMessageById);
router.post('/', authorizeRoles('ADMIN'), validateRequest(createDashboardMessageSchema), createMessage);
router.put('/:id', authorizeRoles('ADMIN'), updateMessage);
router.patch('/:id/status', authorizeRoles('ADMIN'), validateRequest(updateMessageStatusSchema), updateMessageStatus);
router.delete('/:id', authorizeRoles('ADMIN'), deleteMessage);

export default router;
