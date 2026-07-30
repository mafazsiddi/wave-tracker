import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createUserSchema } from '../validators';

const router = Router();

router.use(authenticateJWT);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', authorizeRoles('ADMIN'), validateRequest(createUserSchema), createUser);
router.put('/:id', authorizeRoles('ADMIN'), updateUser);
router.delete('/:id', authorizeRoles('ADMIN'), deleteUser);

export default router;
