/**
 * LinkedIn -> Wave Tracker sync.
 *
 * Unlike HubSpot/Instantly (a static API key), LinkedIn requires a Page admin
 * to complete a one-time OAuth click (see linkedin.controller.ts). The
 * resulting token + admin org URNs are stored in the KVStore under
 * `linkedin:tokens` (same generic table everything else uses).
 *
 * LinkedIn's stats are Page-level (not per-country), so each sync writes ONE
 * performance_social entry per administered org, keyed by org URN, that gets
 * updated in place every run — same "existing row gets refreshed" pattern as
 * Instantly's per-campaign rows.
 */
import prisma from '../config/database';
import { getAdminOrganizations, getFollowerGains, getShareStats } from './linkedin.service';

interface LinkedInTokenRecord {
  accessToken: string;
  expiresAt: number; // ms epoch
  refreshToken?: string;
  refreshTokenExpiresAt?: number;
  scope: string;
  orgUrns: string[];
  connectedAt: number;
}

interface Entry {
  id: string;
  channel: string;
  kind: string;
  group?: string;
  country?: string;
  source?: string;
  linkedinOrgUrn?: string;
  [k: string]: any;
}
interface QData { entries: Entry[]; }

const UNMAPPED_COUNTRY = 'Unmapped (LinkedIn)';
const TOKEN_KEY = 'linkedin:tokens';

async function readKV<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.kVStore.findUnique({ where: { key } });
  if (!row) return fallback;
  try { return JSON.parse(row.value) as T; } catch { return fallback; }
}
async function writeKV(key: string, value: unknown): Promise<void> {
  const v = JSON.stringify(value);
  await prisma.kVStore.upsert({ where: { key }, update: { value: v }, create: { key, value: v } });
}

export async function getStoredToken(): Promise<LinkedInTokenRecord | null> {
  return readKV<LinkedInTokenRecord | null>(TOKEN_KEY, null);
}

export async function storeToken(rec: LinkedInTokenRecord): Promise<void> {
  await writeKV(TOKEN_KEY, rec);
}

function requireLiveToken(rec: LinkedInTokenRecord | null): LinkedInTokenRecord {
  if (!rec) throw new Error('LinkedIn not connected — visit /api/linkedin/auth to connect a Page admin account.');
  if (Date.now() >= rec.expiresAt) {
    throw new Error('LinkedIn access token expired (60-day lifetime) — visit /api/linkedin/auth to reconnect.');
  }
  return rec;
}

export interface LinkedInSyncResult {
  quarter: string;
  orgsSynced: number;
  created: number;
  updated: number;
  ranAt: string;
}

export async function syncLinkedInToQuarter(quarter: string): Promise<LinkedInSyncResult> {
  const rec = requireLiveToken(await getStoredToken());
  const orgUrns = rec.orgUrns?.length ? rec.orgUrns : await getAdminOrganizations(rec.accessToken);

  const qkey = `qdata:${quarter}`;
  const qdata = await readKV<QData>(qkey, { entries: [] });
  if (!Array.isArray(qdata.entries)) qdata.entries = [];

  const byOrg = new Map<string, Entry>();
  for (const en of qdata.entries) if (en.linkedinOrgUrn) byOrg.set(en.linkedinOrgUrn, en);

  let created = 0, updated = 0;
  const now = Date.now();

  for (const orgUrn of orgUrns) {
    const [followers, shares] = await Promise.all([
      getFollowerGains(rec.accessToken, orgUrn, 30),
      getShareStats(rec.accessToken, orgUrn, 30),
    ]);
    const ctr = shares.impressionCount > 0 ? Math.round((shares.clickCount / shares.impressionCount) * 1000) / 10 : 0;
    const auto = {
      title: 'LinkedIn Page — organic (last 30 days)',
      date: new Date(now).toISOString().slice(0, 10),
      impressions: shares.impressionCount,
      views: shares.uniqueImpressionsCount,
      clicks: shares.clickCount,
      ctr,
      likes: shares.likeCount,
      comments: shares.commentCount,
      reposts: shares.shareCount,
      engagementRate: Math.round(shares.engagement * 1000) / 10,
      notes: `LinkedIn: +${followers.organicFollowerGain} organic / +${followers.paidFollowerGain} paid followers (30d)`,
    };
    const orgId = orgUrn.split(':').pop();
    const existing = byOrg.get(orgUrn);
    if (existing) {
      Object.assign(existing, auto, { updatedAt: now, syncedAt: now });
      updated++;
    } else {
      qdata.entries.push({
        id: 'li' + orgId,
        channel: 'social',
        kind: 'performance',
        group: 'watch',
        country: UNMAPPED_COUNTRY,
        source: 'linkedin',
        linkedinOrgUrn: orgUrn,
        ...auto,
        createdAt: now,
        updatedAt: now,
        syncedAt: now,
      });
      created++;
    }
  }

  await writeKV(qkey, qdata);
  return { quarter, orgsSynced: orgUrns.length, created, updated, ranAt: new Date(now).toISOString() };
}
