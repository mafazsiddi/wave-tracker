import { Request, Response } from 'express';
import { env } from '../config/env';
import { probe, getCampaignAnalytics } from '../services/instantly.service';
import { syncInstantlyToQuarter } from '../services/instantlySync.service';

/** GET /api/instantly/health — verify the key works. */
export const health = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, data: await probe() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/** GET /api/instantly/preview — real campaign analytics, NO writes. */
export const preview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const campaigns = await getCampaignAnalytics();
    res.json({ success: true, data: { campaignCount: campaigns.length, campaigns } });
  } catch (error: any) {
    res.status(502).json({ success: false, error: error.message });
  }
};

/** POST /api/instantly/sync?quarter=JAS'26 — pull + write into the dashboard KV. */
export const sync = async (req: Request, res: Response): Promise<void> => {
  if (env.SYNC_SECRET && req.header('x-sync-secret') !== env.SYNC_SECRET) {
    res.status(401).json({ success: false, error: 'invalid or missing x-sync-secret' });
    return;
  }
  const q = req.query.quarter;
  const quarter = (Array.isArray(q) ? q[0] : q) as string | undefined;
  if (!quarter) {
    res.status(400).json({ success: false, error: 'quarter query param is required, e.g. ?quarter=JAS\'26' });
    return;
  }
  try {
    const result = await syncInstantlyToQuarter(quarter);
    res.json({ success: true, message: `Synced Instantly into ${quarter}`, data: result });
  } catch (error: any) {
    res.status(502).json({ success: false, error: error.message });
  }
};
