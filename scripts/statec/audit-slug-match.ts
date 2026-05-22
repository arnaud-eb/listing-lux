#!/usr/bin/env bun
/**
 * statec:audit — sanity check that STATEC's commune + Luxembourg-Ville quartier
 * names align with the slugs in data/lu-localities.json before fetch-prices.ts
 * runs for real. Every unmatched name is a candidate alias-map entry.
 *
 * Usage:
 *   bun run statec:audit                    # resolve + download from data.public.lu
 *   bun run statec:audit --fixtures <dir>   # use local files (see fetch-prices.ts)
 *
 * Exit 0 — every STATEC name matched a slug; exit 1 — at least one unmatched.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  matchLocalities,
  STATEC_COMMUNE_ALIASES,
  STATEC_QUARTIER_ALIASES,
  type MatchResult,
} from "./slug-match";
import { parseStatecXls, type StatecPriceRow } from "./parse-xls";
import { resolveStatec, downloadStatec, type StatecSources } from "./source";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LU_VILLE = "luxembourg-city";

function flag(argv: string[], name: string): string | null {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
}

interface LocalityRow {
  kind: string;
  slug: string;
  parent_slug: string | null;
}

async function loadSlugs(): Promise<{ communes: Set<string>; quartiers: Set<string> }> {
  const file = path.resolve(__dirname, "..", "..", "data", "lu-localities.json");
  const { localities } = JSON.parse(await fs.readFile(file, "utf-8")) as {
    localities: LocalityRow[];
  };
  return {
    communes: new Set(
      localities.filter((l) => l.kind === "commune").map((l) => l.slug),
    ),
    quartiers: new Set(
      localities
        .filter((l) => l.kind === "quartier" && l.parent_slug === LU_VILLE)
        .map((l) => l.slug),
    ),
  };
}

function report(label: string, rows: StatecPriceRow[], result: MatchResult): void {
  const viaAlias = result.matched.filter((m) => m.via === "alias");
  console.log(
    `\n${label}: ${rows.length} STATEC rows → ✓ ${result.matched.length} matched (${viaAlias.length} via alias)`,
  );
  for (const m of viaAlias) console.log(`    alias "${m.statecName}" → ${m.slug}`);
  if (result.unmatched.length > 0) {
    console.log(`  ✗ unmatched (${result.unmatched.length}) — add to the alias map:`);
    for (const n of result.unmatched) console.log(`      "${n}"`);
  }
  if (result.unseenSlugs.length > 0) {
    console.log(`  ℹ JSON slugs STATEC didn't ship (${result.unseenSlugs.length}):`);
    for (const s of result.unseenSlugs) console.log(`      ${s}`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const fixturesDir = flag(argv, "--fixtures");

  let sources: StatecSources;
  if (fixturesDir) {
    sources = {
      communeApartmentXls: path.join(fixturesDir, "commune-apartment.xls"),
      communeHouseXls: path.join(fixturesDir, "commune-house.xls"),
      quartierApartmentXls: path.join(fixturesDir, "quartier-apartment.xlsx"),
      quartierHouseXls: path.join(fixturesDir, "quartier-house.xlsx"),
    };
  } else {
    console.log("Resolving + downloading STATEC files from data.public.lu …");
    sources = await downloadStatec(await resolveStatec());
  }

  const communeRows = [
    ...parseStatecXls(sources.communeApartmentXls),
    ...parseStatecXls(sources.communeHouseXls),
  ];
  const quartierRows = [
    ...parseStatecXls(sources.quartierApartmentXls),
    ...parseStatecXls(sources.quartierHouseXls),
  ];
  const slugs = await loadSlugs();

  const communeResult = matchLocalities(
    [...new Set(communeRows.map((r) => r.name))],
    slugs.communes,
    STATEC_COMMUNE_ALIASES,
  );
  const quartierResult = matchLocalities(
    [...new Set(quartierRows.map((r) => r.name))],
    slugs.quartiers,
    STATEC_QUARTIER_ALIASES,
  );

  report("Communes", communeRows, communeResult);
  report("Luxembourg-Ville quartiers", quartierRows, quartierResult);

  if (communeResult.unmatched.length > 0 || quartierResult.unmatched.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
