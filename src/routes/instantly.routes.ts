import { Router } from 'express';
import { health, preview, sync } from '../controllers/instantly.controller';

/** Instantly sync routes — same open/Cron-friendly posture as the HubSpot routes. */
const router = Router();

router.get('/health', health);
router.get('/preview', preview);
router.post('/sync', sync);

export default router;
