#!/usr/bin/env bun
/**
 * fetch:statec-prices — refresh price_per_sqm_{min,median,max} in
 * data/lu-localities.json from STATEC's quarterly commune-level publication.
 *
 * Pipeline (Option B):
 *   STATEC CSV ──> rewrite data/lu-localities.json in place ──(separate GHA step)──> PR
 * After the PR merges, seed-localities.yml syncs the updated JSON to Supabase.
 *
 * Usage:
 *   bun run scripts/statec/fetch-prices.ts --source path/to/statec.csv [--as-of YYYY-MM-DD] [--dry-run]
 *
 * Safety:
 *   - Refuses to write if any STATEC commune is unmatched (run audit-slug-match first).
 *   - Refuses to write if any single price field moved >QOQ_SANITY_PCT quarter-over-quarter.
 *     STATEC has shipped bad data before; a human should look at large swings.
 *
 * TODO: replace --source with a live STATEC download once we confirm the
 * stable CSV URL + column names (see appendix-e-neighborhood-design.md).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { matchCommunes } from "./slug-match";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, "..", "..", "data", "lu-localities.json");
const QOQ_SANITY_PCT = 30;

interface Args {
  source: string;
  asOf: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const sourceIdx = argv.indexOf("--source");
  if (sourceIdx === -1 || !argv[sourceIdx + 1]) {
    throw new Error(
      "Usage: --source <csv> [--as-of YYYY-MM-DD] [--dry-run]",
    );
  }
  const asOfIdx = argv.indexOf("--as-of");
  const asOf =
    asOfIdx !== -1 && argv[asOfIdx + 1]
      ? argv[asOfIdx + 1]
      : new Date().toISOString().slice(0, 10);
  return {
    source: argv[sourceIdx + 1],
    asOf,
    dryRun: argv.includes("--dry-run"),
  };
}

interface StatecRow {
  commune: string;
  pricePerSqmMin: number | null;
  pricePerSqmMedian: number | null;
  pricePerSqmMax: number | null;
}

async function parseStatecCsv(file: string): Promise<StatecRow[]> {
  const text = await fs.readFile(file, "utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].split(sep).map((c) => c.trim().toLowerCase());
  const col = (...names: string[]) =>
    header.findIndex((h) => names.includes(h));
  const idx = {
    commune: col("commune", "municipality"),
    min: col("price_min", "price_per_sqm_min", "min"),
    median: col("price_median", "price_per_sqm_median", "median"),
    max: col("price_max", "price_per_sqm_max", "max"),
  };
  if (idx.commune === -1 || idx.median === -1) {
    throw new Error(
      `Missing required columns in ${file}. Got: ${header.join(", ")}`,
    );
  }
  const num = (cells: string[], i: number): number | null => {
    if (i === -1) return null;
    const v = parseFloat((cells[i] ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(v) ? v : null;
  };
  return lines
    .slice(1)
    .map((line) => {
      const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        commune: cells[idx.commune] ?? "",
        pricePerSqmMin: num(cells, idx.min),
        pricePerSqmMedian: num(cells, idx.median),
        pricePerSqmMax: num(cells, idx.max),
      };
    })
    .filter((r) => r.commune);
}

interface LocalityRow {
  kind: string;
  slug: string;
  price_per_sqm_min?: number | null;
  price_per_sqm_median?: number | null;
  price_per_sqm_max?: number | null;
  [k: string]: unknown;
}

interface SeedFile {
  _meta: {
    country_code: string;
    source: string;
    data_as_of: string;
    notes?: string;
  };
  localities: LocalityRow[];
}

interface FieldDiff {
  slug: string;
  field: "min" | "median" | "max";
  before: number | null;
  after: number;
  pctChange: number | null;
}

function pctChange(before: number | null, after: number): number | null {
  if (before == null || before === 0) return null;
  return ((after - before) / before) * 100;
}

const FIELDS = [
  ["min", "price_per_sqm_min"],
  ["median", "price_per_sqm_median"],
  ["max", "price_per_sqm_max"],
] as const;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [statecRows, seedText] = await Promise.all([
    parseStatecCsv(args.source),
    fs.readFile(DATA_FILE, "utf-8"),
  ]);
  const seed = JSON.parse(seedText) as SeedFile;

  const communeSlugs = new Set(
    seed.localities.filter((l) => l.kind === "commune").map((l) => l.slug),
  );
  const match = matchCommunes(
    statecRows.map((r) => r.commune),
    communeSlugs,
  );

  if (match.unmatched.length > 0) {
    console.error(
      `Unmatched STATEC communes (${match.unmatched.length}). Run audit-slug-match first:`,
    );
    for (const n of match.unmatched) console.error(`  ${n}`);
    process.exit(1);
  }

  const bySlug = new Map<string, StatecRow>();
  for (const m of match.matched) {
    const row = statecRows.find((r) => r.commune === m.statecName);
    if (row) bySlug.set(m.slug, row);
  }

  const diffs: FieldDiff[] = [];
  const flagged: FieldDiff[] = [];

  for (const loc of seed.localities) {
    if (loc.kind !== "commune") continue;
    const stat = bySlug.get(loc.slug);
    if (!stat) continue;
    const sources = {
      min: stat.pricePerSqmMin,
      median: stat.pricePerSqmMedian,
      max: stat.pricePerSqmMax,
    };
    for (const [field, key] of FIELDS) {
      const after = sources[field];
      if (after == null) continue;
      const before = (loc[key] as number | null | undefined) ?? null;
      if (before === after) continue;
      const change = pctChange(before, after);
      const diff: FieldDiff = { slug: loc.slug, field, before, after, pctChange: change };
      diffs.push(diff);
      if (change != null && Math.abs(change) > QOQ_SANITY_PCT) {
        flagged.push(diff);
      }
      loc[key] = after;
    }
  }

  console.log(
    `STATEC fetch: ${statecRows.length} CSV rows → ${match.matched.length} matched → ${diffs.length} field updates`,
  );
  for (const d of diffs.slice(0, 20)) {
    const pct =
      d.pctChange != null
        ? ` (${d.pctChange >= 0 ? "+" : ""}${d.pctChange.toFixed(1)}%)`
        : "";
    console.log(`  ${d.slug}.${d.field}: ${d.before ?? "null"} → ${d.after}${pct}`);
  }
  if (diffs.length > 20) console.log(`  ... +${diffs.length - 20} more`);

  if (flagged.length > 0) {
    console.error(
      `\n⚠ ${flagged.length} field(s) moved >${QOQ_SANITY_PCT}% — refusing to write. Re-run with a wider threshold only after eyeballing the source.`,
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

  seed._meta.data_as_of = args.asOf;
  await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2) + "\n", "utf-8");
  console.log(`\nWrote ${DATA_FILE} (data_as_of=${args.asOf})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
