import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.string().default('development'),
  // Required, with no fallback. This used to default to localhost, which meant a
  // deploy that forgot the variable booted "fine" and then failed on every query
  // with a connection error that looked like a database outage. Failing at
  // startup instead points straight at the missing config.
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((u) => u.startsWith('postgres://') || u.startsWith('postgresql://'), {
      message: 'must be a postgres:// or postgresql:// connection string',
    }),
  // Direct (unpooled) connection, used only by `prisma migrate` / `prisma db push`.
  // The Prisma CLI reads this straight from the environment rather than through
  // this schema, so it is optional here — declared only so it is discoverable.
  DIRECT_URL: z.string().optional().default(''),
  // Integration credentials. All default to empty, never to a placeholder
  // string: a fake token is still a *valid-looking* token, so it gets sent to
  // the provider and comes back 401 — which reads as "the integration is
  // broken" instead of "nobody set the key". Empty means unconfigured, and
  // callers check for it explicitly (see assertConfigured in the services).
  SALESFORCE_CLIENT_ID: z.string().optional().default(''),
  SALESFORCE_CLIENT_SECRET: z.string().optional().default(''),
  HUBSPOT_ACCESS_TOKEN: z.string().optional().default(''),
  INSTANTLY_API_KEY: z.string().optional().default(''),
  // Optional shared secret. When set, the HubSpot sync write-endpoint requires
  // an `x-sync-secret` header (used by Vercel Cron). Left empty = endpoint open
  // (consistent with the rest of this internal tool).
  SYNC_SECRET: z.string().optional().default(''),
  // Master edit PIN for the Wave Tracker. Lives ONLY on the server — never sent
  // to the browser — so it can't be read from view-source / inspect element.
  // Editors (Shweta & Gourav) type it; the frontend verifies via /api/access/verify.
  EDIT_PIN: z.string().optional().default('wave2026'),

  // LinkedIn Developer App (Community Management API) — 3-legged OAuth.
  // Client ID/Secret from the app's Auth tab.
  //
  // The redirect URI is normally derived from the host the request arrived on,
  // so localhost and production each send their own without a per-environment
  // variable to keep in step - getting it wrong is invisible until the consent
  // screen fails, and it has to match on both the authorize and the token call.
  // Set this only to override that (e.g. a host the app sits behind but doesn't
  // see). Whatever is used must be registered on the app's Auth tab.
  LINKEDIN_CLIENT_ID: z.string().optional().default(''),
  LINKEDIN_CLIENT_SECRET: z.string().optional().default(''),
  LINKEDIN_REDIRECT_URI: z.string().optional().default(''),

  // Whether LinkedIn may write rows into a quarter. Off.
  //
  // Marketing wants Social Performance to hold what the team entered, not a
  // machine-generated row alongside it. LinkedIn's organic stats are
  // Page-level rather than per-country, so a sync can only file them under
  // "Unmapped (LinkedIn)" - a row nobody asked for, in a country that doesn't
  // exist, mixed in with hand-checked numbers.
  //
  // A flag rather than deleted code: the connection, the OAuth flow and the
  // health endpoint all still work, so re-enabling is one variable in Vercel
  // rather than a revert. Set to "true" to turn writing back on.
  LINKEDIN_SYNC_ENABLED: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // A raw ZodError in a serverless log is a wall of JSON. Print the offending
  // variables and where to set them, then exit.
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  console.error(
    [
      'Invalid environment configuration:',
      ...lines,
      '',
      'Set these in .env for local dev, or in Vercel -> Settings -> Environment',
      'Variables for a deploy (Vercel does not read .env). See .env.example.',
    ].join('\n')
  );
  process.exit(1);
}

export const env = parsed.data;

// The default PIN is committed to .env.example, so leaving it unset means the
// edit PIN is public to anyone who can read this repo.
export const DEFAULT_EDIT_PIN = 'wave2026';

/**
 * Config that is legal but probably not what you want in production. These are
 * warnings rather than startup failures on purpose — an unset integration key
 * should degrade that one feature, not take the dashboard down.
 */
const warnings: string[] = [];
if (!env.HUBSPOT_ACCESS_TOKEN) warnings.push('HUBSPOT_ACCESS_TOKEN unset - HubSpot sync disabled');
if (!env.INSTANTLY_API_KEY) warnings.push('INSTANTLY_API_KEY unset - Instantly sync disabled');
if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET)
  warnings.push('LINKEDIN_CLIENT_ID/SECRET unset - LinkedIn sync disabled');
if (env.EDIT_PIN === DEFAULT_EDIT_PIN)
  warnings.push('EDIT_PIN is the default from .env.example - anyone who can read the repo can edit');
if (!env.SYNC_SECRET)
  warnings.push('SYNC_SECRET unset - /api/cron/sync and the sync write-endpoints are unauthenticated');

if (warnings.length) {
  console.warn(['Configuration warnings:', ...warnings.map((w) => `  - ${w}`)].join('\n'));
}
