import { Router } from 'express';
import { verifyEditAccess } from '../controllers/access.controller';

const router = Router();

router.post('/verify', verifyEditAccess);

export default router;
