import { Router } from 'express';
import {
  getWaveEntries,
  getWaveEntryById,
  createWaveEntry,
  updateWaveEntry,
  deleteWaveEntry,
  addWaveComment,
  deleteWaveComment,
  getWaveMeta,
  updateWaveMeta,
} from '../controllers/wave.controller';

const router = Router();

// Metadata routes
router.get('/meta', getWaveMeta);
router.put('/meta', updateWaveMeta);

// Entry routes
router.get('/entries', getWaveEntries);
router.get('/entries/:id', getWaveEntryById);
router.post('/entries', createWaveEntry);
router.put('/entries/:id', updateWaveEntry);
router.delete('/entries/:id', deleteWaveEntry);

// Comment routes
router.post('/entries/:id/comments', addWaveComment);
router.delete('/comments/:commentId', deleteWaveComment);

export default router;
