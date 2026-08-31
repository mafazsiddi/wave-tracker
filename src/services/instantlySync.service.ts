/**
 * Instantly -> Wave Tracker sync.
 *
 * Pulls per-campaign analytics from Instantly and writes them into the same
 * `qdata:<quarter>` KV record as `performance_email` entries. Same guardrail as
 * the HubSpot sync: only entries carrying `instantlyCampaignId` are ever
 * created/updated; manual rows are never touched.
 */
import prisma from '../config/database';
import { quarterFromKey, projectQuarter } from './entryProjection.service';
import { getCampaignAnalytics, InstantlyCampaignAnalytics } from './instantly.service';
import { SyncMeta, buildCountryToGroup, inferCountryAndGroup } from './mapping.util';

interface Entry {
  id: string;
  channel: string;
  kind: string;
  group?: string;
  country?: string;
  source?: string;
  instantlyCampaignId?: string;
  [k: string]: any;
}
interface QData { entries: Entry[]; }

const UNMAPPED_COUNTRY = 'Unmapped (Instantly)';

async function readKV<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.kVStore.findUnique({ where: { key } });
  if (!row) return fallback;
  try { return JSON.parse(row.value) as T; } catch { return fallback; }
}
async function writeKV(key: string, value: unknown): Promise<void> {
  const v = JSON.stringify(value);
  const quarter = quarterFromKey(key);
  // Read back first so the projection below can be a delta rather than a
  // rewrite of every row - this runs on a serverless cron against a database
  // in another region, where ~1,500 upserts would not finish.
  const previous = quarter ? (await prisma.kVStore.findUnique({ where: { key } }))?.value ?? null : null;
  await prisma.kVStore.upsert({ where: { key }, update: { value: v }, create: { key, value: v } });
  if (quarter) {
    try {
      await projectQuarter(quarter, previous, v);
    } catch (error: any) {
      console.error(`[entry] projection failed for "${key}": ${error.message}`);
    }
  }
}

/** Map Instantly analytics onto the dashboard's performance_email field keys. */
function automatedFields(a: InstantlyCampaignAnalytics) {
  const delivered = Math.max(a.emailsSent - a.bounced, 0);
  return {
    title: a.campaignName,
    emailsSent: a.emailsSent,
    emailsOpened: a.uniqueOpens || a.opens,
    totalDelivered: delivered,
    bounced: a.bounced,
    uniqueClicks: a.clicks,
    openRate: a.openRate,
    deliveryRate: a.emailsSent > 0 ? Math.round((delivered / a.emailsSent) * 1000) / 10 : 0,
    deliverabilityRate: a.bounceRate ? Math.round((100 - a.bounceRate) * 10) / 10 : 0,
    optOuts: a.unsubscribed,
    // Instantly is outreach: surface reply/lead context in notes (no dashboard field for it)
    notes: `Instantly: ${a.replies} replies · ${a.contacted} contacted · ${a.leads} leads`,
  };
}

export interface InstantlySyncResult {
  quarter: string;
  pulledFromInstantly: number;
  created: number;
  updated: number;
  unmapped: number;
  ranAt: string;
}

export async function syncInstantlyToQuarter(quarter: string): Promise<InstantlySyncResult> {
  const meta = await readKV<SyncMeta>('meta', {});
  const countryToGroup = buildCountryToGroup(meta);

  const campaigns = await getCampaignAnalytics();

  const qkey = `qdata:${quarter}`;
  const qdata = await readKV<QData>(qkey, { entries: [] });
  if (!Array.isArray(qdata.entries)) qdata.entries = [];

  const byId = new Map<string, Entry>();
  for (const en of qdata.entries) if (en.instantlyCampaignId) byId.set(en.instantlyCampaignId, en);

  let created = 0, updated = 0, unmapped = 0;
  const now = Date.now();

  for (const c of campaigns) {
    if (!c.campaignId) continue;
    const { country, group, mapped } = inferCountryAndGroup(c.campaignName, countryToGroup, UNMAPPED_COUNTRY);
    if (!mapped) unmapped++;
    const auto = automatedFields(c);
    const existing = byId.get(c.campaignId);
    if (existing) {
      Object.assign(existing, auto, { updatedAt: now, syncedAt: now });
      updated++;
    } else {
      qdata.entries.push({
        id: 'inst' + c.campaignId,
        channel: 'email',
        kind: 'performance',
        group,
        country,
        source: 'instantly',
        instantlyCampaignId: c.campaignId,
        ...auto,
        createdAt: now,
        updatedAt: now,
        syncedAt: now,
      });
      created++;
    }
  }

  await writeKV(qkey, qdata);
  return { quarter, pulledFromInstantly: campaigns.length, created, updated, unmapped, ranAt: new Date(now).toISOString() };
}
