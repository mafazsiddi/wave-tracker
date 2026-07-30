import { Router } from 'express';
import { getKV, putKV, deleteKV } from '../controllers/kv.controller';

const router = Router();

router.get('/:key', getKV);
router.put('/:key', putKV);
router.delete('/:key', deleteKV);

export default router;
