import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';
import messageRoutes from './message.routes';
import campaignRoutes from './campaign.routes';
import calendarRoutes from './calendar.routes';
import copyRoutes from './copy.routes';
import performanceRoutes from './performance.routes';
import reportRoutes from './report.routes';
import integrationRoutes from './integration.routes';
import healthRoutes from './health.routes';
import waveRoutes from './wave.routes';
import kvRoutes from './kv.routes';
import hubspotRoutes from './hubspot.routes';
import instantlyRoutes from './instantly.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard/messages', messageRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/calendar', calendarRoutes);
router.use('/copies', copyRoutes);
router.use('/performance', performanceRoutes);
router.use('/reports', reportRoutes);
router.use('/integrations', integrationRoutes);
router.use('/wave', waveRoutes);
router.use('/kv', kvRoutes);
router.use('/hubspot', hubspotRoutes);
router.use('/instantly', instantlyRoutes);

export default router;
