/**
 * LinkedIn API client — Community Management API (organic Page analytics).
 *
 * Auth is 3-legged OAuth (not a static key like HubSpot/Instantly): a Page
 * admin clicks through /api/linkedin/auth once, LinkedIn redirects back to
 * /api/linkedin/callback with a code, which we exchange for an access token.
 * Access tokens last 60 days; refresh tokens are only issued to select
 * partners, so re-auth is a manual click roughly every 2 months unless
 * LinkedIn has granted this app programmatic refresh.
 *
 * Docs verified live 2026-08-13 against learn.microsoft.com/en-us/linkedin/marketing.
 */
import { env } from '../config/env';

const AUTH_BASE = 'https://www.linkedin.com/oauth/v2';
const API_BASE = 'https://api.linkedin.com/rest';

// Community Management API scopes needed for organic Page + post analytics.
export const LINKEDIN_SCOPES = ['r_organization_social', 'r_organization_followers', 'rw_organization_admin'];

export class LinkedInError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`LinkedIn API ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * LinkedIn versions its REST API monthly (YYYYMM). Using last month rather
 * than the current one avoids racing a version LinkedIn hasn't published yet.
 */
function linkedInVersion(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.LINKEDIN_CLIENT_ID,
    redirect_uri: env.LINKEDIN_REDIRECT_URI,
    state,
    scope: LINKEDIN_SCOPES.join(' '),
  });
  return `${AUTH_BASE}/authorization?${params.toString()}`;
}

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

export async function exchangeCodeForToken(code: string): Promise<LinkedInTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: env.LINKEDIN_CLIENT_ID,
    client_secret: env.LINKEDIN_CLIENT_SECRET,
    redirect_uri: env.LINKEDIN_REDIRECT_URI,
  });
  const res = await fetch(`${AUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new LinkedInError(res.status, text);
  return JSON.parse(text) as LinkedInTokenResponse;
}

async function li<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': linkedInVersion(),
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  if (!res.ok) throw new LinkedInError(res.status, text);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

/** Organization URNs (urn:li:organization:{id}) the authenticated member administers. */
export async function getAdminOrganizations(accessToken: string): Promise<string[]> {
  const r = await li<{ elements: any[] }>(
    accessToken,
    '/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED'
  );
  const elements = Array.isArray(r.elements) ? r.elements : [];
  const urns = elements.map((e) => e.organizationTarget || e.organization).filter(Boolean);
  return [...new Set(urns)] as string[];
}

export interface LinkedInFollowerGains {
  organicFollowerGain: number;
  paidFollowerGain: number;
}

/** Follower gains over the last `days`. */
export async function getFollowerGains(accessToken: string, orgUrn: string, days = 30): Promise<LinkedInFollowerGains> {
  const end = Date.now();
  const start = end - days * 24 * 60 * 60 * 1000;
  const q =
    `?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}` +
    `&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${start}&timeIntervals.timeRange.end=${end}`;
  const r = await li<{ elements: any[] }>(accessToken, `/organizationalEntityFollowerStatistics${q}`);
  const elements = Array.isArray(r.elements) ? r.elements : [];
  return elements.reduce(
    (acc, e) => ({
      organicFollowerGain: acc.organicFollowerGain + (e.followerGains?.organicFollowerGain || 0),
      paidFollowerGain: acc.paidFollowerGain + (e.followerGains?.paidFollowerGain || 0),
    }),
    { organicFollowerGain: 0, paidFollowerGain: 0 }
  );
}

export interface LinkedInShareStats {
  impressionCount: number;
  uniqueImpressionsCount: number;
  clickCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagement: number;
}

/** Aggregate organic post/share stats over the last `days` (rolling window, capped at 12 months by LinkedIn). */
export async function getShareStats(accessToken: string, orgUrn: string, days = 30): Promise<LinkedInShareStats> {
  const end = Date.now();
  const start = end - days * 24 * 60 * 60 * 1000;
  const q =
    `?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}` +
    `&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${start}&timeIntervals.timeRange.end=${end}`;
  const r = await li<{ elements: any[] }>(accessToken, `/organizationalEntityShareStatistics${q}`);
  const elements = Array.isArray(r.elements) ? r.elements : [];
  const zero: LinkedInShareStats = {
    impressionCount: 0,
    uniqueImpressionsCount: 0,
    clickCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    engagement: 0,
  };
  const total = elements.reduce((acc, e) => {
    const s = e.totalShareStatistics || {};
    return {
      impressionCount: acc.impressionCount + (s.impressionCount || 0),
      uniqueImpressionsCount: acc.uniqueImpressionsCount + (s.uniqueImpressionsCount || 0),
      clickCount: acc.clickCount + (s.clickCount || 0),
      likeCount: acc.likeCount + (s.likeCount || 0),
      commentCount: acc.commentCount + (s.commentCount || 0),
      shareCount: acc.shareCount + (s.shareCount || 0),
      engagement: acc.engagement, // recomputed below from totals, per-day engagement isn't additive
    };
  }, zero);
  total.engagement = total.impressionCount > 0
    ? (total.clickCount + total.likeCount + total.commentCount + total.shareCount) / total.impressionCount
    : 0;
  return total;
}
