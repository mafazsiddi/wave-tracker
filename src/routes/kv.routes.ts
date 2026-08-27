import { Router } from 'express';
import {
  getKV,
  putKV,
  deleteKV,
  listRevisions,
  getRevision,
  restoreRevision,
} from '../controllers/kv.controller';

const router = Router();

// Revision routes are declared before the bare `/:key` handlers. They are a
// path segment deeper so Express would not confuse them anyway, but keeping
// the more specific routes first means adding a wildcard later can't silently
// swallow them.
router.get('/:key/revisions', listRevisions);
router.get('/:key/revisions/:id', getRevision);
router.post('/:key/revisions/:id/restore', restoreRevision);

router.get('/:key', getKV);
router.put('/:key', putKV);
router.delete('/:key', deleteKV);

export default router;
