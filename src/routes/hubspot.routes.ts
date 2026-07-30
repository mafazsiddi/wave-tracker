import { Router } from 'express';
import { health, preview, sync } from '../controllers/hubspot.controller';

/**
 * HubSpot sync routes. Deliberately NOT behind JWT — the Wave Tracker frontend
 * has no login, and Vercel Cron calls these headlessly. The write endpoint can
 * be locked with SYNC_SECRET (checked in the controller) when needed.
 */
const router = Router();

router.get('/health', health);
router.get('/preview', preview);
router.post('/sync', sync);

export default router;
