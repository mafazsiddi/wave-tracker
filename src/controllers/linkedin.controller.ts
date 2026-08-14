import { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { getAuthorizationUrl, exchangeCodeForToken, getAdminOrganizations } from '../services/linkedin.service';
import { getStoredToken, storeToken, syncLinkedInToQuarter } from '../services/linkedinSync.service';

// In-memory CSRF state for the OAuth redirect — short-lived, single admin flow,
// consistent with this internal tool's security posture (no user accounts).
const pendingStates = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000;

function newState(): string {
  const s = crypto.randomBytes(16).toString('hex');
  pendingStates.set(s, Date.now() + STATE_TTL_MS);
  return s;
}
function consumeState(s: string): boolean {
  const exp = pendingStates.get(s);
  pendingStates.delete(s);
  return !!exp && Date.now() < exp;
}

/** GET /api/linkedin/auth — redirect a Page admin through LinkedIn's OAuth consent screen. */
export const auth = (_req: Request, res: Response): void => {
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
    res.status(500).send('LinkedIn is not configured: set LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET.');
    return;
  }
  res.redirect(getAuthorizationUrl(newState()));
};

/** GET /api/linkedin/callback — exchange the code, look up admin orgs, store the token. */
export const callback = async (req: Request, res: Response): Promise<void> => {
  const { code, state, error, error_description } = req.query as Record<string, string>;
  if (error) {
    res.status(400).send(`LinkedIn declined: ${error} — ${error_description || ''}`);
    return;
  }
  if (!state || !consumeState(state)) {
    res.status(401).send('LinkedIn callback rejected: missing or expired state (possible CSRF, or you took >10min to approve). Try /api/linkedin/auth again.');
    return;
  }
  if (!code) {
    res.status(400).send('LinkedIn callback missing "code".');
    return;
  }
  try {
    const token = await exchangeCodeForToken(code);
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
    res.json({ success: true, data: { connected: false } });
    return;
  }
  res.json({
    success: true,
    data: {
      connected: true,
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
