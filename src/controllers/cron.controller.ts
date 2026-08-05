import { Request, Response } from 'express';
import prisma from '../config/database';
import { env } from '../config/env';
import { syncInstantlyToQuarter } from '../services/instantlySync.service';
import { syncHubSpotToQuarter } from '../services/hubspotSync.service';

async function activeQuarters(): Promise<string[]> {
  const row = await prisma.kVStore.findUnique({ where: { key: 'meta' } });
  if (!row) return [];
  try {
    const m = JSON.parse(row.value);
    return Array.isArray(m.quarters) ? m.quarters : [];
  } catch {
    return [];
  }
}

/**
 * GET /api/cron/sync — the once-a-day job. Syncs every active quarter from
 * both live sources. Each source is isolated so a failing one (e.g. HubSpot
 * while its token is being sorted) never blocks the other.
 *
 * Vercel Cron calls this with `Authorization: Bearer <CRON_SECRET>`. If
 * SYNC_SECRET is set we require it (bearer or x-sync-secret header); otherwise
 * the endpoint is open, consistent with the rest of this internal tool.
 */
export const runDailySync = async (req: Request, res: Response): Promise<void> => {
  if (env.SYNC_SECRET) {
    const auth = req.header('authorization') || '';
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (bearer !== env.SYNC_SECRET && req.header('x-sync-secret') !== env.SYNC_SECRET) {
      res.status(401).json({ success: false, error: 'unauthorized' });
      return;
    }
  }

  const quarters = await activeQuarters();
  const results: any[] = [];
  for (const q of quarters) {
    const perQ: any = { quarter: q };
    try { perQ.instantly = await syncInstantlyToQuarter(q); } catch (e: any) { perQ.instantly = { error: e.message?.slice(0, 140) }; }
    try { perQ.hubspot = await syncHubSpotToQuarter(q); } catch (e: any) { perQ.hubspot = { error: e.message?.slice(0, 140) }; }
    results.push(perQ);
  }

  res.json({ success: true, ranAt: new Date().toISOString(), quarters, results });
};
