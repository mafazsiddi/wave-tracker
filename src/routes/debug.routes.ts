import { Router } from 'express';

/**
 * TEMPORARY diagnostic — reports which critical env vars are PRESENT in the
 * running function (booleans only, never the values). Used to confirm Vercel is
 * injecting them. Safe to remove once the deploy is verified.
 */
const router = Router();

router.get('/env', (_req, res) => {
  res.json({
    runtime: process.version,
    present: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
      INSTANTLY_API_KEY: !!process.env.INSTANTLY_API_KEY,
      EDIT_PIN: !!process.env.EDIT_PIN,
      HUBSPOT_ACCESS_TOKEN: !!process.env.HUBSPOT_ACCESS_TOKEN,
    },
    // helps spot a malformed URL without leaking it
    DATABASE_URL_len: (process.env.DATABASE_URL || '').length,
    DATABASE_URL_prefix: (process.env.DATABASE_URL || '').slice(0, 22),
  });
});

export default router;
