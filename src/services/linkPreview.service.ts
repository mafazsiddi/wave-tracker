/**
 * Fetches a public page's Open Graph preview image (og:image / twitter:image)
 * so webinar "Recording link" URLs (LinkedIn posts, Vimeo, etc.) can show a
 * real thumbnail on their tracker card instead of the plain gradient
 * placeholder. YouTube is handled entirely client-side (predictable CDN
 * thumbnail URL, no fetch needed) — this covers everything else.
 *
 * Only ever fetches a public HTML page and reads its <meta> tags; no auth,
 * no LinkedIn API. Domain-allowlisted and size/time-capped since it fetches
 * a URL supplied by whoever fills in the tracker form.
 */

const ALLOWED_HOSTS = [
  'linkedin.com',
  'vimeo.com',
  'youtube.com',
  'youtu.be',
];

const FETCH_TIMEOUT_MS = 6000;
const MAX_BYTES = 500_000; // enough for the <head>; avoids downloading a whole video page
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map<string, { image: string | null; expiresAt: number }>();

function isAllowedUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  return allowed ? url : null;
}

async function fetchCappedText(url: URL): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Identifies itself honestly as a link-preview fetcher (the same
        // pattern Slack/iMessage use) rather than spoofing a browser or a
        // specific platform's own crawler.
        'User-Agent': 'Mozilla/5.0 (compatible; WaveTrackerLinkPreview/1.0)',
        Accept: 'text/html',
      },
    });
    if (!res.ok || !res.body) return '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    let bytes = 0;
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      text += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function extractOgImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

export async function getPreviewImage(rawUrl: string): Promise<string | null> {
  const url = isAllowedUrl(rawUrl);
  if (!url) return null;

  const key = url.toString();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.image;

  let image: string | null = null;
  try {
    const html = await fetchCappedText(url);
    image = extractOgImage(html);
  } catch {
    image = null;
  }
  cache.set(key, { image, expiresAt: Date.now() + CACHE_TTL_MS });
  return image;
}
