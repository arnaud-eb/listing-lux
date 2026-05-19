#!/usr/bin/env bun
/**
 * audit:statec-slug-match — one-shot sanity check that STATEC's commune names
 * align with the slugs in data/lu-localities.json before fetch-prices.ts runs
 * for real. Every unmatched row becomes a candidate STATEC_SLUG_ALIASES entry.
 *
 * Usage:
 *   bun run scripts/statec/audit-slug-match.ts --source path/to/statec.csv
 *
 * Exit codes:
 *   0 — every STATEC commune matched a JSON slug
 *   1 — at least one STATEC commune is unmatched (manual alias needed)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { matchCommunes } from "./slug-match";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Args {
  source: string;
}

function parseArgs(argv: string[]): Args {
  const i = argv.indexOf("--source");
  if (i === -1 || !argv[i + 1]) {
    throw new Error(
      "Usage: bun run scripts/statec/audit-slug-match.ts --source <csv>",
    );
  }
  return { source: argv[i + 1] };
}

interface LocalityRow {
  kind: string;
  slug: string;
}

async function loadKnownCommuneSlugs(): Promise<Set<string>> {
  const file = path.resolve(__dirname, "..", "..", "data", "lu-localities.json");
  const raw = await fs.readFile(file, "utf-8");
  const parsed = JSON.parse(raw) as { localities: LocalityRow[] };
  return new Set(
    parsed.localities.filter((l) => l.kind === "commune").map((l) => l.slug),
  );
}

/**
 * Lenient CSV reader: tolerates comma or semicolon separators (STATEC has used
 * both historically) and looks for a column named "commune" or "municipality".
 * Tighten this once the actual STATEC export format is confirmed.
 */
async function readCommuneColumn(file: string): Promise<string[]> {
  const text = await fs.readFile(file, "utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].split(sep).map((c) => c.trim().toLowerCase());
  const idx = header.findIndex((c) => c === "commune" || c === "municipality");
  if (idx === -1) {
    throw new Error(
      `No "commune" column in ${file}. Headers: ${header.join(", ")}`,
    );
  }
  return lines
    .slice(1)
    .map((l) => l.split(sep)[idx]?.trim().replace(/^"|"$/g, "") ?? "")
    .filter(Boolean);
}

async function main() {
  const { source } = parseArgs(process.argv.slice(2));
  const [statecNames, knownSlugs] = await Promise.all([
    readCommuneColumn(source),
    loadKnownCommuneSlugs(),
  ]);

  console.log(`STATEC source : ${source} (${statecNames.length} names)`);
  console.log(`Local JSON    : ${knownSlugs.size} commune slugs\n`);

  const result = matchCommunes(statecNames, knownSlugs);

  const viaAlias = result.matched.filter((m) => m.via === "alias");
  console.log(`✓ Matched ${result.matched.length}  (${viaAlias.length} via manual alias)`);
  for (const m of viaAlias) {
    console.log(`    alias "${m.statecName}" → ${m.slug}`);
  }

  if (result.unmatched.length > 0) {
    console.log(
      `\n✗ Unmatched STATEC names (${result.unmatched.length}) — add to STATEC_SLUG_ALIASES in scripts/statec/slug-match.ts:`,
    );
    for (const n of result.unmatched) console.log(`    "${n}"`);
  }

  if (result.unseenSlugs.length > 0) {
    console.log(
      `\nℹ JSON commune slugs STATEC didn't ship (${result.unseenSlugs.length}) — informational, prices stay as-is:`,
    );
    for (const s of result.unseenSlugs) console.log(`    ${s}`);
  }

  if (result.unmatched.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
