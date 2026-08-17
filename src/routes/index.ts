import { Router } from 'express';
import healthRoutes from './health.routes';
import accessRoutes from './access.routes';
import kvRoutes from './kv.routes';
import hubspotRoutes from './hubspot.routes';
import instantlyRoutes from './instantly.routes';
import linkedinRoutes from './linkedin.routes';
import cronRoutes from './cron.routes';
import linkPreviewRoutes from './linkPreview.routes';

const router = Router();

// The Wave Tracker frontend persists everything through /kv, and pulls live
// metrics from /hubspot, /instantly and /linkedin.
router.use('/health', healthRoutes);
router.use('/access', accessRoutes);
router.use('/kv', kvRoutes);
router.use('/hubspot', hubspotRoutes);
router.use('/instantly', instantlyRoutes);
router.use('/linkedin', linkedinRoutes);
router.use('/cron', cronRoutes);
router.use('/link-preview', linkPreviewRoutes);

export default router;
