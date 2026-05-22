/**
 * STATEC locality names → data/lu-localities.json slug matcher.
 *
 * STATEC publishes names with accents and FR/LU spelling variants ("Pétange",
 * "Käerjeng", "Ville-Haute"). Our JSON slugs are lowercased, accent-stripped,
 * dash-separated. For most localities a deterministic normalize() matches
 * directly; the audit script surfaces the rest as alias-map candidates.
 *
 * Two alias maps — communes and Luxembourg-Ville quartiers are matched against
 * separate slug sets (and from separate STATEC datasets), so they keep separate
 * override tables.
 */

export function normalizeName(name: string): string {
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
 * Populate by running `bun run statec:audit` against fresh files — every
 * "unmatched" line is a candidate entry.
 *
 * Key: result of normalizeName() on STATEC's raw name. Value: the JSON slug.
 */
export const STATEC_COMMUNE_ALIASES: Record<string, string> = {
  luxembourg: "luxembourg-city",
  // STATEC uses the short name; the JSON slug carries the full commune name.
  erpeldange: "erpeldange-sur-sure",
  // STATEC uses the Lëtzebuergesch spelling; the JSON slug is FR-flavored.
  "groussbus-wal": "grosbous-wahl",
  // normalize() drops the apostrophe in "l'Ernz" → "lernz"; slug keeps "l-ernz".
  "vallee-de-lernz": "vallee-de-l-ernz",
};

export const STATEC_QUARTIER_ALIASES: Record<string, string> = {
  // STATEC lists the historic centre as "Ville-Haute"; our slug is centre-ville.
  "ville-haute": "centre-ville",
  // STATEC splits at "Neudorf"; our slug merges the twin quartier.
  neudorf: "neudorf-weimershof",
  // STATEC spelling carries a trailing "e".
  pulvermuhle: "pulvermuhl",
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

export function matchLocalities(
  statecNames: readonly string[],
  knownSlugs: ReadonlySet<string>,
  aliases: Record<string, string>,
): MatchResult {
  const matched: MatchedRow[] = [];
  const unmatched: string[] = [];
  const consumed = new Set<string>();

  for (const name of statecNames) {
    const norm = normalizeName(name);
    if (knownSlugs.has(norm)) {
      matched.push({ statecName: name, slug: norm, via: "normalize" });
      consumed.add(norm);
      continue;
    }
    const aliased = aliases[norm];
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
