import { Request, Response } from 'express';
import { env } from '../config/env';
import { probe, getMarketingEmailStats, getContactsCount, getCompaniesCount } from '../services/hubspot.service';
import { syncHubSpotToQuarter } from '../services/hubspotSync.service';

/** GET /api/hubspot/health — verify the token and which capabilities are reachable. */
export const health = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await probe();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/** GET /api/hubspot/preview — real HubSpot data, NO writes. For eyeballing before syncing. */
export const preview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [emails, contacts, companies] = await Promise.all([
      getMarketingEmailStats(25),
      getContactsCount().catch(() => null),
      getCompaniesCount().catch(() => null),
    ]);
    res.json({ success: true, data: { crm: { contacts, companies }, emailCount: emails.length, emails } });
  } catch (error: any) {
    res.status(502).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/hubspot/sync?quarter=JAS'26 — pull from HubSpot and write into the
 * dashboard's KV store. Protected by x-sync-secret ONLY if SYNC_SECRET is set.
 */
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
    const result = await syncHubSpotToQuarter(quarter);
    res.json({ success: true, message: `Synced HubSpot into ${quarter}`, data: result });
  } catch (error: any) {
    res.status(502).json({ success: false, error: error.message });
  }
};
