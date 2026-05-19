/**
 * STATEC commune names → data/lu-localities.json slug matcher.
 *
 * STATEC publishes commune-level prices using FR-flavored names with accents
 * ("Pétange", "Käerjeng", "Esch-sur-Alzette"). Our JSON slugs are lowercased,
 * accent-stripped, dash-separated ("petange", "kaerjeng", "esch-sur-alzette").
 * For 95%+ of communes a deterministic normalize() should match directly; the
 * audit script surfaces the rest so we can add them to STATEC_SLUG_ALIASES.
 */

export function normalizeCommuneName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[''‘’]/g, "")
    .replace(/[\s\-–—_/]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Manual overrides for STATEC names that don't normalize to our slugs.
 * Populate this map by running `bun run scripts/statec/audit-slug-match.ts`
 * against a fresh CSV — every "unmatched" line is a candidate entry here.
 *
 * Key: result of normalizeCommuneName() applied to STATEC's raw name.
 * Value: the slug used in data/lu-localities.json.
 */
export const STATEC_SLUG_ALIASES: Record<string, string> = {
  luxembourg: "luxembourg-city",
};

export interface MatchedRow {
  statecName: string;
  slug: string;
  via: "normalize" | "alias";
}

export interface MatchResult {
  matched: MatchedRow[];
  unmatched: string[];
  unseenSlugs: string[];
}

export function matchCommunes(
  statecNames: readonly string[],
  knownSlugs: ReadonlySet<string>,
): MatchResult {
  const matched: MatchedRow[] = [];
  const unmatched: string[] = [];
  const consumed = new Set<string>();

  for (const name of statecNames) {
    const norm = normalizeCommuneName(name);
    if (knownSlugs.has(norm)) {
      matched.push({ statecName: name, slug: norm, via: "normalize" });
      consumed.add(norm);
      continue;
    }
    const aliased = STATEC_SLUG_ALIASES[norm];
    if (aliased && knownSlugs.has(aliased)) {
      matched.push({ statecName: name, slug: aliased, via: "alias" });
      consumed.add(aliased);
      continue;
    }
    unmatched.push(name);
  }

  const unseenSlugs = [...knownSlugs].filter((s) => !consumed.has(s)).sort();
  return { matched, unmatched, unseenSlugs };
}
