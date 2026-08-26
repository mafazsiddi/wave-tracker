/**
 * Instantly.ai API client (v2) — real calls, READ-ONLY.
 *
 * Auth: Instantly v2 API key as Bearer token. Set INSTANTLY_API_KEY in .env.
 * Base: https://api.instantly.ai/api/v2
 */
import { env } from '../config/env';

const BASE = 'https://api.instantly.ai/api/v2';

export class InstantlyError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`Instantly API ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

async function inst<T>(path: string, init: RequestInit = {}): Promise<T> {
  // See the matching guard in hubspot.service.ts — an empty key would otherwise
  // surface as a 401 that looks like a credential problem rather than a missing one.
  if (!env.INSTANTLY_API_KEY) {
    throw new InstantlyError(0, 'INSTANTLY_API_KEY is not set — Instantly integration is not configured.');
  }
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.INSTANTLY_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new InstantlyError(res.status, text);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};
const rate = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

export interface InstantlyCampaignAnalytics {
  campaignId: string;
  campaignName: string;
  leads: number;
  contacted: number;
  emailsSent: number;
  opens: number;
  uniqueOpens: number;
  replies: number;
  clicks: number;
  bounced: number;
  unsubscribed: number;
  completed: number;
  openRate: number;    // %
  replyRate: number;   // %
  bounceRate: number;  // %
}

/** All campaigns' aggregate analytics. */
export async function getCampaignAnalytics(): Promise<InstantlyCampaignAnalytics[]> {
  const arr = await inst<any[]>('/campaigns/analytics');
  const rows = Array.isArray(arr) ? arr : [];
  return rows.map((a) => {
    const sent = num(a.emails_sent_count);
    return {
      campaignId: String(a.campaign_id ?? ''),
      campaignName: String(a.campaign_name ?? ''),
      leads: num(a.leads_count),
      contacted: num(a.contacted_count),
      emailsSent: sent,
      opens: num(a.open_count),
      uniqueOpens: num(a.open_count_unique),
      replies: num(a.reply_count),
      clicks: num(a.link_click_count),
      bounced: num(a.bounced_count),
      unsubscribed: num(a.unsubscribed_count),
      completed: num(a.completed_count),
      openRate: rate(num(a.open_count_unique ?? a.open_count), sent),
      replyRate: rate(num(a.reply_count_unique ?? a.reply_count), sent),
      bounceRate: rate(num(a.bounced_count), sent),
    };
  });
}

/** Connectivity probe: does the key work, and how many campaigns are visible. */
export async function probe(): Promise<{ tokenValid: boolean; campaigns: number; error?: string }> {
  try {
    const a = await getCampaignAnalytics();
    return { tokenValid: true, campaigns: a.length };
  } catch (e: any) {
    return { tokenValid: false, campaigns: 0, error: e.message };
  }
}
