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
});

export const env = envSchema.parse(process.env);
