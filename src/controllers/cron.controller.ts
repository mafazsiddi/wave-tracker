import { Request, Response } from 'express';
import prisma from '../config/database';
import { env } from '../config/env';
import { syncInstantlyToQuarter } from '../services/instantlySync.service';
import { syncHubSpotToQuarter } from '../services/hubspotSync.service';
import { syncLinkedInToQuarter } from '../services/linkedinSync.service';
import { projectQuarter, checkProjection, QDATA_PREFIX } from '../services/entryProjection.service';

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
    try { perQ.linkedin = await syncLinkedInToQuarter(q); } catch (e: any) { perQ.linkedin = { error: e.message?.slice(0, 140) }; }

    // Reconcile the per-entry projection against the blob it shadows.
    //
    // Every write already projects itself, so this should find nothing to do.
    // It runs anyway because the projection is deliberately allowed to fail
    // without failing the write that triggered it - which means drift is
    // possible by design, and something has to close it. A full pass is
    // idempotent, so the normal outcome is that it changes nothing and reports
    // identical. `identical` going false here is the signal not to move the
    // read path onto these rows yet.
    try {
      const row = await prisma.kVStore.findUnique({ where: { key: QDATA_PREFIX + q } });
      if (row) {
        await projectQuarter(q, null, row.value);
        perQ.projection = await checkProjection(q);
      }
    } catch (e: any) {
      perQ.projection = { error: e.message?.slice(0, 140) };
    }

    results.push(perQ);
  }

  res.json({ success: true, ranAt: new Date().toISOString(), quarters, results });
};
