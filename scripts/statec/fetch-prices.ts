#!/usr/bin/env bun
/**
 * fetch:statec-prices — refresh asking_price_per_sqm_{apt,house} in
 * data/lu-localities.json from STATEC / Observatoire de l'Habitat
 * (data.public.lu, CC0). Covers two datasets: commune-level prices and
 * Luxembourg-Ville quartier-level prices.
 *
 * Pipeline (Option B):
 *   STATEC XLS ──> rewrite data/lu-localities.json ──(GHA: PR)──> review ──> merge
 * After the PR merges, seed-localities.yml syncs the JSON to Supabase.
 *
 * Usage:
 *   bun run statec:fetch                      # resolve + download from data.public.lu
 *   bun run statec:fetch --fixtures <dir>     # use local files (CI / testing)
 *   bun run statec:fetch --dry-run            # no file write
 *   bun run statec:fetch --as-of YYYY-MM-DD   # override snapshot date
 *   bun run statec:fetch --force              # refetch even if last_modified is unchanged
 *
 * On a normal run the fetcher first asks the data.public.lu API for each
 * dataset's last_modified and exits early if it matches _meta.statec_last_modified
 * — so a frequent cron is cheap and silent until STATEC actually republishes.
 *
 * --fixtures <dir> expects: commune-apartment.xls, commune-house.xls,
 * quartier-apartment.xlsx, quartier-house.xlsx.
 *
 * STATEC publishes a single mean asking €/m² per locality per type — not a
 * min/median/max band. Localities with <30 listings are suppressed ("*") and
 * left untouched here. Quartier coverage is Luxembourg-Ville only.
 *
 * Safety: refuses to write if any STATEC name is unmatched (run statec:audit
 * first) or if any value moved >QOQ_SANITY_PCT quarter-over-quarter.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  matchLocalities,
  STATEC_COMMUNE_ALIASES,
  STATEC_QUARTIER_ALIASES,
} from "./slug-match";
import { parseStatecXls, type StatecPriceRow } from "./parse-xls";
import { resolveStatec, downloadStatec, type StatecSources } from "./source";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, "..", "..", "data", "lu-localities.json");
const QOQ_SANITY_PCT = 30;
const LU_VILLE = "luxembourg-city";

interface Args {
  fixturesDir: string | null;
  asOf: string | null;
  dryRun: boolean;
  force: boolean;
}

function flag(argv: string[], name: string): string | null {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
}

function parseArgs(argv: string[]): Args {
  return {
    fixturesDir: flag(argv, "--fixtures"),
    asOf: flag(argv, "--as-of"),
    dryRun: argv.includes("--dry-run"),
    force: argv.includes("--force"),
  };
}

interface LocalityRow {
  kind: string;
  slug: string;
  parent_slug: string | null;
  asking_price_per_sqm_apt?: number | null;
  asking_price_per_sqm_house?: number | null;
  [k: string]: unknown;
}

interface SeedFile {
  _meta: {
    country_code: string;
    source: string;
    data_as_of: string;
    notes?: string;
    /** last_modified of the STATEC datasets at the last successful fetch. */
    statec_last_modified?: string;
  };
  localities: LocalityRow[];
}

type PriceField = "asking_price_per_sqm_apt" | "asking_price_per_sqm_house";

interface FieldDiff {
  slug: string;
  field: PriceField;
  before: number | null;
  after: number;
  pctChange: number | null;
}

function pctChange(before: number | null, after: number): number | null {
  if (before == null || before === 0) return null;
  return ((after - before) / before) * 100;
}

function fixturePaths(dir: string): StatecSources {
  return {
    communeApartmentXls: path.join(dir, "commune-apartment.xls"),
    communeHouseXls: path.join(dir, "commune-house.xls"),
    quartierApartmentXls: path.join(dir, "quartier-apartment.xlsx"),
    quartierHouseXls: path.join(dir, "quartier-house.xlsx"),
  };
}

/** Match one dataset's names to slugs; exit with guidance on any miss. */
function matchOrExit(
  rows: StatecPriceRow[],
  knownSlugs: Set<string>,
  aliases: Record<string, string>,
  label: string,
): Map<string, string> {
  const names = [...new Set(rows.map((r) => r.name))];
  const result = matchLocalities(names, knownSlugs, aliases);
  if (result.unmatched.length > 0) {
    console.error(
      `Unmatched STATEC ${label} (${result.unmatched.length}). Run statec:audit and add aliases:`,
    );
    for (const n of result.unmatched) console.error(`  ${n}`);
    process.exit(1);
  }
  return new Map(result.matched.map((m) => [m.statecName, m.slug]));
}

/** slug → rounded mean €/m², for localities STATEC didn't suppress. */
function priceBySlug(
  rows: StatecPriceRow[],
  matchedBy: Map<string, string>,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows) {
    const slug = matchedBy.get(row.name);
    if (slug && row.pricePerSqm != null) {
      out.set(slug, Math.round(row.pricePerSqm));
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seed = JSON.parse(await fs.readFile(DATA_FILE, "utf-8")) as SeedFile;

  let sources: StatecSources;
  let publishedOn: string | null = null;
  if (args.fixturesDir) {
    sources = fixturePaths(args.fixturesDir);
  } else {
    console.log("Resolving STATEC datasets on data.public.lu …");
    const resolved = await resolveStatec();
    if (!args.force && resolved.lastModified === seed._meta.statec_last_modified) {
      console.log(
        `STATEC data unchanged since ${resolved.lastModified} — nothing to do. (--force to refetch.)`,
      );
      return;
    }
    console.log(`Downloading STATEC files (last_modified ${resolved.lastModified}) …`);
    sources = await downloadStatec(resolved);
    seed._meta.statec_last_modified = resolved.lastModified;
    publishedOn = resolved.lastModified.slice(0, 10);
  }

  const communeAptRows = parseStatecXls(sources.communeApartmentXls);
  const communeHouseRows = parseStatecXls(sources.communeHouseXls);
  const quartierAptRows = parseStatecXls(sources.quartierApartmentXls);
  const quartierHouseRows = parseStatecXls(sources.quartierHouseXls);

  const communeSlugs = new Set(
    seed.localities.filter((l) => l.kind === "commune").map((l) => l.slug),
  );
  // STATEC's quartier dataset is Luxembourg-Ville only.
  const quartierSlugs = new Set(
    seed.localities
      .filter((l) => l.kind === "quartier" && l.parent_slug === LU_VILLE)
      .map((l) => l.slug),
  );

  const communeMatch = matchOrExit(
    [...communeAptRows, ...communeHouseRows],
    communeSlugs,
    STATEC_COMMUNE_ALIASES,
    "communes",
  );
  const quartierMatch = matchOrExit(
    [...quartierAptRows, ...quartierHouseRows],
    quartierSlugs,
    STATEC_QUARTIER_ALIASES,
    "Luxembourg-Ville quartiers",
  );

  const aptPrices = new Map<string, number>([
    ...priceBySlug(communeAptRows, communeMatch),
    ...priceBySlug(quartierAptRows, quartierMatch),
  ]);
  const housePrices = new Map<string, number>([
    ...priceBySlug(communeHouseRows, communeMatch),
    ...priceBySlug(quartierHouseRows, quartierMatch),
  ]);

  const diffs: FieldDiff[] = [];
  const flagged: FieldDiff[] = [];

  for (const loc of seed.localities) {
    if (loc.kind !== "commune" && loc.kind !== "quartier") continue;
    for (const [field, after] of [
      ["asking_price_per_sqm_apt", aptPrices.get(loc.slug)],
      ["asking_price_per_sqm_house", housePrices.get(loc.slug)],
    ] as const) {
      if (after == null) continue;
      const before = (loc[field] as number | null | undefined) ?? null;
      if (before === after) continue;
      const change = pctChange(before, after);
      const diff: FieldDiff = { slug: loc.slug, field, before, after, pctChange: change };
      diffs.push(diff);
      if (change != null && Math.abs(change) > QOQ_SANITY_PCT) flagged.push(diff);
      loc[field] = after;
    }
  }

  console.log(
    `STATEC fetch: ${communeMatch.size} communes + ${quartierMatch.size} quartiers matched → ${diffs.length} field updates`,
  );
  for (const d of diffs.slice(0, 24)) {
    const label = d.field === "asking_price_per_sqm_apt" ? "apt" : "house";
    const pct =
      d.pctChange != null
        ? ` (${d.pctChange >= 0 ? "+" : ""}${d.pctChange.toFixed(1)}%)`
        : "";
    console.log(`  ${d.slug}.${label}: ${d.before ?? "null"} → ${d.after}${pct}`);
  }
  if (diffs.length > 24) console.log(`  ... +${diffs.length - 24} more`);

  if (flagged.length > 0) {
    console.error(
      `\n⚠ ${flagged.length} value(s) moved >${QOQ_SANITY_PCT}% — refusing to write. Eyeball the source before overriding.`,
    );
    for (const d of flagged) {
      console.error(
        `  ${d.slug}.${d.field}: ${d.before} → ${d.after} (${d.pctChange!.toFixed(1)}%)`,
      );
    }
    process.exit(2);
  }

  if (args.dryRun) {
    console.log("\n[dry-run] No file changes written.");
    return;
  }

  // data_as_of reflects when the data was *published*, not when we fetched it:
  // explicit --as-of wins, else STATEC's last_modified date, else today.
  const asOf =
    args.asOf ?? publishedOn ?? new Date().toISOString().slice(0, 10);
  seed._meta.data_as_of = asOf;
  await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2) + "\n", "utf-8");
  console.log(`\nWrote ${DATA_FILE} (data_as_of=${asOf})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
