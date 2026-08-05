import { Router } from 'express';
import { runDailySync } from '../controllers/cron.controller';

/** Scheduled daily sync, triggered by Vercel Cron (see vercel.json). */
const router = Router();

router.get('/sync', runDailySync);

export default router;
