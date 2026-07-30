import { Router } from 'express';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../controllers/calendar.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createCalendarEventSchema } from '../validators';

const router = Router();

router.use(authenticateJWT);

router.get('/', getCalendarEvents);
router.post('/', authorizeRoles('ADMIN'), validateRequest(createCalendarEventSchema), createCalendarEvent);
router.put('/:id', authorizeRoles('ADMIN'), updateCalendarEvent);
router.delete('/:id', authorizeRoles('ADMIN'), deleteCalendarEvent);

export default router;
