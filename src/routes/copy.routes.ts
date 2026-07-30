import { Router } from 'express';
import { getCopies, createCopy, updateCopy, deleteCopy } from '../controllers/copy.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createCopySchema } from '../validators';

const router = Router();

router.use(authenticateJWT);

router.get('/', getCopies);
router.post('/', authorizeRoles('ADMIN'), validateRequest(createCopySchema), createCopy);
router.put('/:id', authorizeRoles('ADMIN'), updateCopy);
router.delete('/:id', authorizeRoles('ADMIN'), deleteCopy);

export default router;
