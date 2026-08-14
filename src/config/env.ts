import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().optional().default('postgresql://postgres:postgres@localhost:5432/marketing_dashboard'),
  JWT_SECRET: z.string().default('cleartax_marketing_dashboard_secret_key_2026'),
  SALESFORCE_CLIENT_ID: z.string().optional().default('sf_demo_client_id'),
  SALESFORCE_CLIENT_SECRET: z.string().optional().default('sf_demo_client_secret'),
  HUBSPOT_ACCESS_TOKEN: z.string().optional().default('hb_demo_access_token'),
  INSTANTLY_API_KEY: z.string().optional().default('instantly_demo_api_key'),
  // Optional shared secret. When set, the HubSpot sync write-endpoint requires
  // an `x-sync-secret` header (used by Vercel Cron). Left empty = endpoint open
  // (consistent with the rest of this internal tool).
  SYNC_SECRET: z.string().optional().default(''),
  // Master edit PIN for the Wave Tracker. Lives ONLY on the server — never sent
  // to the browser — so it can't be read from view-source / inspect element.
  // Editors (Shweta & Gourav) type it; the frontend verifies via /api/access/verify.
  EDIT_PIN: z.string().optional().default('wave2026'),

  // LinkedIn Developer App (Community Management API) — 3-legged OAuth.
  // Client ID/Secret from the app's Auth tab. Redirect URI must exactly match
  // one registered there (Auth tab -> OAuth 2.0 settings -> Redirect URLs).
  LINKEDIN_CLIENT_ID: z.string().optional().default(''),
  LINKEDIN_CLIENT_SECRET: z.string().optional().default(''),
  LINKEDIN_REDIRECT_URI: z.string().optional().default('http://localhost:5000/api/linkedin/callback'),
});

export const env = envSchema.parse(process.env);
