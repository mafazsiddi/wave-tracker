import { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { getAuthorizationUrl, exchangeCodeForToken, getAdminOrganizations } from '../services/linkedin.service';
import {
  getStoredToken,
  storeToken,
  syncLinkedInToQuarter,
  rememberState,
  consumeState,
} from '../services/linkedinSync.service';

/**
 * The callback URL to hand LinkedIn, derived from the host this request came in
 * on: localhost when run locally, the live domain when run on Vercel.
 *
 * A single configured value cannot be right in both places, and a wrong one
 * fails late and unhelpfully - LinkedIn shows a generic error page at the
 * consent screen, or, worse, authorize succeeds and the token exchange is
 * rejected for a mismatch. Deriving it removes an environment variable that had
 * to be remembered per deployment and could silently drift.
 *
 * Express is not behind `trust proxy` here, so `req.protocol` reports http even
 * on HTTPS; the forwarded header is what Vercel actually sets. Falls back to
 * https for anything that isn't localhost, since LinkedIn rejects plaintext
 * redirect URLs anyway.
 *
 * env.LINKEDIN_REDIRECT_URI still wins when set, for a host this process cannot
 * see itself. Whatever is used must be registered on the app's Auth tab.
 */
function redirectUriFor(req: Request): string {
  if (env.LINKEDIN_REDIRECT_URI) return env.LINKEDIN_REDIRECT_URI;
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:5000';
  const forwardedProto = (req.get('x-forwarded-proto') || '').split(',')[0].trim();
  const proto = forwardedProto || (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https');
  return `${proto}://${host}/api/linkedin/callback`;
}

/** GET /api/linkedin/auth — redirect a Page admin through LinkedIn's OAuth consent screen. */
export const auth = async (req: Request, res: Response): Promise<void> => {
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
    res.status(500).send('LinkedIn is not configured: set LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET.');
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
  await rememberState(state);
  res.redirect(getAuthorizationUrl(state, redirectUriFor(req)));
};

/** GET /api/linkedin/callback — exchange the code, look up admin orgs, store the token. */
export const callback = async (req: Request, res: Response): Promise<void> => {
  const { code, state, error, error_description } = req.query as Record<string, string>;
  if (error) {
    res.status(400).send(`LinkedIn declined: ${error} — ${error_description || ''}`);
    return;
  }
  if (!state || !(await consumeState(state))) {
    res.status(401).send('LinkedIn callback rejected: missing or expired state (possible CSRF, or you took >10min to approve). Try /api/linkedin/auth again.');
    return;
  }
  if (!code) {
    res.status(400).send('LinkedIn callback missing "code".');
    return;
  }
  try {
    // Must be byte-identical to the one sent to /authorization, or LinkedIn
    // rejects the exchange - hence deriving it the same way from the same host.
    const token = await exchangeCodeForToken(code, redirectUriFor(req));
    const orgUrns = await getAdminOrganizations(token.access_token);
    const now = Date.now();
    await storeToken({
      accessToken: token.access_token,
      expiresAt: now + token.expires_in * 1000,
      refreshToken: token.refresh_token,
      refreshTokenExpiresAt: token.refresh_token_expires_in ? now + token.refresh_token_expires_in * 1000 : undefined,
      scope: token.scope,
      orgUrns,
      connectedAt: now,
    });
    res.send(
      `<html><body style="font-family:sans-serif;padding:40px;max-width:560px;margin:0 auto;">` +
      `<h2>LinkedIn connected ✅</h2>` +
      `<p>Found ${orgUrns.length} organization(s) you administer: ${orgUrns.map((u) => `<code>${u}</code>`).join(', ') || '(none — you may not be an ADMINISTRATOR on the Page yet)'}.</p>` +
      `<p>Token expires in ${Math.round(token.expires_in / 86400)} days${token.refresh_token ? ' (refresh token issued)' : ' — you will need to reconnect via /api/linkedin/auth after that'}.</p>` +
      `<p><a href="/">Back to Wave Tracker</a></p></body></html>`
    );
  } catch (e: any) {
    res.status(502).send(`LinkedIn token exchange failed: ${e.message}`);
  }
};

/** GET /api/linkedin/health — connection status, no writes. */
export const health = async (_req: Request, res: Response): Promise<void> => {
  const rec = await getStoredToken();
  if (!rec) {
    res.json({ success: true, data: { connected: false, syncEnabled: env.LINKEDIN_SYNC_ENABLED } });
    return;
  }
  res.json({
    success: true,
    data: {
      connected: true,
      // Connected and allowed-to-write are separate states: the account can be
      // linked while the dashboard is still entered by hand.
      syncEnabled: env.LINKEDIN_SYNC_ENABLED,
      expiresAt: new Date(rec.expiresAt).toISOString(),
      expired: Date.now() >= rec.expiresAt,
      hasRefreshToken: !!rec.refreshToken,
      orgUrns: rec.orgUrns,
      connectedAt: new Date(rec.connectedAt).toISOString(),
    },
  });
};

/** POST /api/linkedin/sync?quarter=JAS'26 — pull + write into the dashboard KV. */
export const sync = async (req: Request, res: Response): Promise<void> => {
  // Gated alongside the cron, so "LinkedIn does not write rows" holds with no
  // exception for whoever finds this URL. Reading LinkedIn is still fine -
  // /health and the OAuth flow are untouched.
  if (!env.LINKEDIN_SYNC_ENABLED) {
    res.status(409).json({
      success: false,
      error:
        'LinkedIn sync is disabled: Social Performance is entered manually. ' +
        'Set LINKEDIN_SYNC_ENABLED=true to allow it to write rows again.',
    });
    return;
  }
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
    const result = await syncLinkedInToQuarter(quarter);
    res.json({ success: true, message: `Synced LinkedIn into ${quarter}`, data: result });
  } catch (error: any) {
    res.status(502).json({ success: false, error: error.message });
  }
};
