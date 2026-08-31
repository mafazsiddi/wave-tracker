/**
 * HubSpot -> Wave Tracker sync.
 *
 * Pulls marketing-email statistics from HubSpot and writes them into the SAME
 * `qdata:<quarter>` KV record the dashboard reads, as `performance_email`
 * entries. Manual rows are never touched — we only ever create/update entries
 * that carry a `hubspotEmailId`, and even on those we preserve human-entered
 * fields (notes, links) and overwrite only the automated metric fields.
 */
import prisma from '../config/database';
import { quarterFromKey, projectQuarter } from './entryProjection.service';
import { getMarketingEmailStats, getContactsCount, getCompaniesCount, HubSpotEmailStat } from './hubspot.service';
import { SyncMeta, buildCountryToGroup, inferCountryAndGroup } from './mapping.util';

interface Entry {
  id: string;
  channel: string;
  kind: string;
  group?: string;
  country?: string;
  source?: string;
  hubspotEmailId?: string;
  [k: string]: any;
}
interface QData { entries: Entry[]; }

const UNMAPPED_COUNTRY = 'Unmapped (HubSpot)';

async function readKV<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.kVStore.findUnique({ where: { key } });
  if (!row) return fallback;
  try { return JSON.parse(row.value) as T; } catch { return fallback; }
}
async function writeKV(key: string, value: unknown): Promise<void> {
  const v = JSON.stringify(value);
  const quarter = quarterFromKey(key);
  // Delta, not a full rewrite - see the same note in instantlySync.service.ts.
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

/** Map HubSpot stats onto the dashboard's performance_email field keys. */
function automatedFields(e: HubSpotEmailStat) {
  return {
    date: e.publishDate ? String(e.publishDate).slice(0, 10) : '',
    title: e.name,
    subjectLine: e.subject,
    emailsSent: e.sent,
    emailsOpened: e.open,
    totalDelivered: e.delivered,
    bounced: e.bounce,
    uniqueClicks: e.click,
    openRate: e.openRate,
    deliveryRate: e.deliveredRate,
    deliverabilityRate: e.deliveredRate,
    optOuts: e.unsubscribed,
  };
}

export interface SyncResult {
  quarter: string;
  pulledFromHubSpot: number;
  created: number;
  updated: number;
  unmapped: number;
  crm: { contacts: number; companies: number };
  ranAt: string;
}

export async function syncHubSpotToQuarter(quarter: string): Promise<SyncResult> {
  const meta = await readKV<SyncMeta>('meta', {});
  const countryToGroup = buildCountryToGroup(meta);

  const [emails, contacts, companies] = await Promise.all([
    getMarketingEmailStats(100),
    getContactsCount().catch(() => 0),
    getCompaniesCount().catch(() => 0),
  ]);

  const qkey = `qdata:${quarter}`;
  const qdata = await readKV<QData>(qkey, { entries: [] });
  if (!Array.isArray(qdata.entries)) qdata.entries = [];

  const byHsId = new Map<string, Entry>();
  for (const en of qdata.entries) if (en.hubspotEmailId) byHsId.set(en.hubspotEmailId, en);

  let created = 0, updated = 0, unmapped = 0;
  const now = Date.now();

  for (const e of emails) {
    if (!e.emailId) continue;
    const { country, group, mapped } = inferCountryAndGroup(`${e.name} ${e.subject}`, countryToGroup, UNMAPPED_COUNTRY);
    if (!mapped) unmapped++;
    const auto = automatedFields(e);
    const existing = byHsId.get(e.emailId);
    if (existing) {
      // preserve manual fields; overwrite only the automated metrics
      Object.assign(existing, auto, { updatedAt: now, syncedAt: now });
      updated++;
    } else {
      qdata.entries.push({
        id: 'hs' + e.emailId,
        channel: 'email',
        kind: 'performance',
        group,
        country,
        source: 'hubspot',
        hubspotEmailId: e.emailId,
        ...auto,
        notes: '',
        createdAt: now,
        updatedAt: now,
        syncedAt: now,
      });
      created++;
    }
  }

  await writeKV(qkey, qdata);

  return {
    quarter,
    pulledFromHubSpot: emails.length,
    created,
    updated,
    unmapped,
    crm: { contacts, companies },
    ranAt: new Date(now).toISOString(),
  };
}
