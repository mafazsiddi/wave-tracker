/**
 * Shared mapping helpers for external-source syncs (HubSpot, Instantly, …).
 *
 * The country/stage inference is the ONE rule that depends on how marketing
 * names their campaigns/emails. Update `inferCountryAndGroup` here and every
 * sync picks it up.
 */
export interface SyncMeta {
  stageGroups?: Record<string, string[]>;
  [k: string]: any;
}

// 'webinar' and 'lifecycle' are separate nurture-tab overlays, not journey
// stages — they list nearly every country and would clobber the real stage
// (postwave/live/attack/activate/watch) if included here.
const NON_STAGE_GROUPS = new Set(['webinar', 'lifecycle']);

/** Build country -> stage-group lookup from the dashboard's meta.stageGroups. */
export function buildCountryToGroup(meta: SyncMeta): Map<string, string> {
  const map = new Map<string, string>();
  for (const [group, countries] of Object.entries(meta.stageGroups ?? {})) {
    if (NON_STAGE_GROUPS.has(group)) continue;
    for (const c of countries || []) map.set(c, group);
  }
  return map;
}

/**
 * Find which dashboard country + stage a piece of source text (an email or
 * campaign name/subject) belongs to, by matching a known country name inside it.
 * e.g. "Spain Warmup Email" -> { country: 'Spain', group: 'attack' }.
 */
export function inferCountryAndGroup(
  text: string,
  countryToGroup: Map<string, string>,
  unmappedCountry: string,
  unmappedGroup = 'watch'
): { country: string; group: string; mapped: boolean } {
  const hay = (text || '').toLowerCase();
  for (const [country, group] of countryToGroup) {
    const esc = country.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-z])${esc}([^a-z]|$)`);
    if (re.test(hay)) return { country, group, mapped: true };
  }
  return { country: unmappedCountry, group: unmappedGroup, mapped: false };
}
