/**
 * HubSpot API client — real calls (no SDK, uses global fetch / Node 18+).
 *
 * Auth: HubSpot Private App token (Bearer). Set HUBSPOT_ACCESS_TOKEN in .env.
 * Required scopes for the calls below:
 *   - crm.objects.contacts.read   (contact counts)
 *   - crm.objects.companies.read  (company / account counts)
 *   - marketing-email  OR  content (marketing email list + statistics)
 *
 * Everything here is READ-ONLY. Nothing in this file mutates HubSpot data.
 */
import { env } from '../config/env';

const BASE = 'https://api.hubapi.com';

export class HubSpotError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`HubSpot API ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

async function hs<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Fail before the network call. Without this an unset token goes out as
  // `Bearer ` and HubSpot answers 401, which is indistinguishable from a
  // revoked or wrongly-scoped token.
  if (!env.HUBSPOT_ACCESS_TOKEN) {
    throw new HubSpotError(0, 'HUBSPOT_ACCESS_TOKEN is not set — HubSpot integration is not configured.');
  }
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new HubSpotError(res.status, text);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};
// HubSpot's ratio fields (openratio, deliveredratio, ...) are already percentages
// (e.g. 2.347 means 2.347%), not 0-1 fractions — just round to 1 decimal.
const pct = (v: unknown): number => Math.round(num(v) * 10) / 10;

/** Verify the token works and report which portal it belongs to. */
export async function getAccountInfo(): Promise<{ portalId: number; timeZone?: string; uiDomain?: string }> {
  return hs('/account-info/v3/details');
}

/** Total contacts in the portal (via the search endpoint, which returns `total`). */
export async function getContactsCount(): Promise<number> {
  const r = await hs<{ total: number }>('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify({ filterGroups: [], limit: 1 }),
  });
  return num(r.total);
}

/** Total companies (accounts) in the portal. */
export async function getCompaniesCount(): Promise<number> {
  const r = await hs<{ total: number }>('/crm/v3/objects/companies/search', {
    method: 'POST',
    body: JSON.stringify({ filterGroups: [], limit: 1 }),
  });
  return num(r.total);
}

export interface HubSpotEmailStat {
  emailId: string;
  name: string;
  subject: string;
  publishDate: string | null;
  sent: number;
  delivered: number;
  open: number;
  click: number;
  bounce: number;
  unsubscribed: number;
  openRate: number;   // %
  clickRate: number;  // %
  deliveredRate: number; // %
}

/**
 * List marketing emails and their aggregate statistics.
 *
 * HubSpot's Marketing Emails v3 returns each email with a `stats.counters` /
 * `stats.ratios` block. Field names vary slightly across portals, so we read
 * defensively with fallbacks. `limit` caps how many emails we pull.
 */
export async function getMarketingEmailStats(limit = 100): Promise<HubSpotEmailStat[]> {
  const r = await hs<{ results: any[] }>(
    `/marketing/v3/emails?limit=${limit}&includeStats=true&sort=-publishDate`
  );
  const results = Array.isArray(r.results) ? r.results : [];
  return results.map((e) => {
    const c = e?.stats?.counters ?? e?.counters ?? {};
    const ra = e?.stats?.ratios ?? e?.ratios ?? {};
    return {
      emailId: String(e.id ?? e.emailId ?? ''),
      name: String(e.name ?? ''),
      subject: String(e.subject ?? e?.content?.subject ?? ''),
      publishDate: e.publishDate ?? e.publishedAt ?? null,
      sent: num(c.sent),
      delivered: num(c.delivered),
      open: num(c.open ?? c.uniqueOpen),
      click: num(c.click ?? c.uniqueClick),
      bounce: num(c.bounce ?? c.hardBounce),
      unsubscribed: num(c.unsubscribed),
      openRate: pct(ra.openratio ?? ra.openRate),
      clickRate: pct(ra.clickratio ?? ra.clickRate),
      deliveredRate: pct(ra.deliveredratio ?? ra.deliveredRate),
    };
  });
}

/** One-shot connectivity + scope probe. Returns which capabilities are reachable. */
export async function probe(): Promise<{
  tokenValid: boolean;
  portalId?: number;
  contacts: { ok: boolean; error?: string };
  companies: { ok: boolean; error?: string };
  marketingEmails: { ok: boolean; error?: string };
}> {
  const out: any = { tokenValid: false, contacts: {}, companies: {}, marketingEmails: {} };
  try {
    const acct = await getAccountInfo();
    out.tokenValid = true;
    out.portalId = acct.portalId;
  } catch (e: any) {
    out.contacts = out.companies = out.marketingEmails = { ok: false, error: 'token invalid' };
    return out;
  }
  await Promise.all([
    getContactsCount().then(() => (out.contacts = { ok: true })).catch((e) => (out.contacts = { ok: false, error: e.message })),
    getCompaniesCount().then(() => (out.companies = { ok: true })).catch((e) => (out.companies = { ok: false, error: e.message })),
    getMarketingEmailStats(1).then(() => (out.marketingEmails = { ok: true })).catch((e) => (out.marketingEmails = { ok: false, error: e.message })),
  ]);
  return out;
}
