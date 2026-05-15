#!/usr/bin/env bun
/**
 * seed:localities — upsert the locality snapshot in `data/lu-localities.json`
 * into the Supabase `localities` table created by migration 010.
 *
 * Audit P0.5 / P1.1a (docs/audits/2026-04-llm-output-audit/README.md). Migration
 * 010 ships price tiers + the country + 12 cantons + 8 key communes. This script
 * fills in the quartier layer + multilingual data + per-locality price overrides
 * for the hotspots we have explicit pricing on.
 *
 * Idempotent: uses `ON CONFLICT (country_code, slug) DO UPDATE` via Supabase's
 * `upsert` with `onConflict: "country_code,slug"`. Safe to re-run on every cron
 * tick; only changed rows produce diffs.
 *
 * Usage:
 *   bun run seed:localities                  # run against env-configured project
 *   bun run seed:localities --dry-run        # parse the JSON, validate FK refs,
 *                                              print the planned writes, don't hit
 *                                              the DB. Useful for PRs.
 *
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL    — public Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY   — server-side service role (NEVER expose client-side)
 *
 * In production this script runs from the GitHub Actions cron defined in
 * .github/workflows/seed-localities.yml.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, "..", "data", "lu-localities.json");

type LocalityKind = "country" | "region" | "canton" | "commune" | "quartier" | "sub_quartier";

interface LocalityRecord {
  kind: LocalityKind;
  slug: string;
  name: string;
  /** Slug of the parent locality. Must exist by the time this row is upserted. */
  parent_slug: string | null;
  name_localized: Record<string, string>;
  description_localized?: Record<string, string>;
  keywords_localized?: Record<string, string[]>;
  tags?: string[];
  price_tier_id?: string | null;
  price_per_sqm_min?: number | null;
  price_per_sqm_median?: number | null;
  price_per_sqm_max?: number | null;
  currency?: string | null;
}

interface SeedFile {
  _meta: {
    country_code: string;
    source: string;
    data_as_of: string;
    notes?: string;
  };
  localities: LocalityRecord[];
}

interface Args {
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  return { dryRun: argv.includes("--dry-run") };
}

async function loadSeed(): Promise<SeedFile> {
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw) as SeedFile;
  if (!parsed._meta?.country_code || !Array.isArray(parsed.localities)) {
    throw new Error(`Malformed seed file at ${DATA_FILE}`);
  }
  return parsed;
}

function buildKindOrder(): LocalityKind[] {
  // Insert parents before children: country → region → canton → commune → quartier → sub_quartier.
  // Localities at each level may reference parents from prior levels; this ordering
  // guarantees the parent_slug lookup succeeds for every row we insert.
  return ["country", "region", "canton", "commune", "quartier", "sub_quartier"];
}

function topoSortByKind(localities: LocalityRecord[]): LocalityRecord[] {
  const order = buildKindOrder();
  return [...localities].sort(
    (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind),
  );
}

interface DbClient {
  upsertLocality: (row: Record<string, unknown>) => Promise<void>;
  lookupParentId: (slug: string, countryCode: string) => Promise<string | null>;
}

function makeSupabaseClient(): DbClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
    );
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  return {
    async upsertLocality(row) {
      const { error } = await sb
        .from("localities")
        .upsert(row, { onConflict: "country_code,slug" });
      if (error) throw new Error(`Upsert failed for slug=${row.slug}: ${error.message}`);
    },
    async lookupParentId(slug, countryCode) {
      const { data, error } = await sb
        .from("localities")
        .select("id")
        .eq("country_code", countryCode)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error(`Parent lookup failed for ${slug}: ${error.message}`);
      return data?.id ?? null;
    },
  };
}

function makeDryRunClient(known: Set<string>): DbClient {
  // For dry-run we resolve parents from the in-memory set of slugs the JSON ships,
  // plus any slug we successfully "upserted" earlier in this run. That way we can
  // validate the JSON's internal FK consistency without touching the DB.
  return {
    async upsertLocality(row) {
      console.log(
        `  [dry-run] upsert ${row.kind}/${row.slug} (parent_id=${row.parent_id ?? "null"})`,
      );
      known.add(row.slug as string);
    },
    async lookupParentId(slug) {
      return known.has(slug) ? `dry-run-${slug}` : null;
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seed = await loadSeed();
  const countryCode = seed._meta.country_code;

  console.log(
    `seed:localities — ${seed.localities.length} rows, country=${countryCode}, snapshot=${seed._meta.data_as_of}${args.dryRun ? " (DRY RUN)" : ""}`,
  );

  // For dry-run, prime the known-slugs set with what migration 010 already inserted
  // so the validator doesn't false-alarm on parents it cannot see. Real run looks
  // them up in the DB.
  const seededByMigration010 = new Set([
    "lu",
    "canton-capellen",
    "canton-clervaux",
    "canton-diekirch",
    "canton-echternach",
    "canton-esch-sur-alzette",
    "canton-grevenmacher",
    "canton-luxembourg",
    "canton-mersch",
    "canton-redange",
    "canton-remich",
    "canton-vianden",
    "canton-wiltz",
    "luxembourg-city",
    "strassen",
    "bertrange",
    "mamer",
    "hesperange",
    "walferdange",
    "esch-sur-alzette",
    "differdange",
  ]);

  const db = args.dryRun ? makeDryRunClient(seededByMigration010) : makeSupabaseClient();

  const ordered = topoSortByKind(seed.localities);
  let inserted = 0;
  let failed = 0;
  const parentCache = new Map<string, string | null>();

  for (const loc of ordered) {
    try {
      let parentId: string | null = null;
      if (loc.parent_slug) {
        if (parentCache.has(loc.parent_slug)) {
          parentId = parentCache.get(loc.parent_slug)!;
        } else {
          parentId = await db.lookupParentId(loc.parent_slug, countryCode);
          parentCache.set(loc.parent_slug, parentId);
        }
        if (!parentId) {
          throw new Error(
            `parent_slug "${loc.parent_slug}" not found (kind=${loc.kind}, slug=${loc.slug})`,
          );
        }
      }

      const row: Record<string, unknown> = {
        country_code: countryCode,
        parent_id: parentId,
        kind: loc.kind,
        name: loc.name,
        slug: loc.slug,
        name_localized: loc.name_localized,
        description_localized: loc.description_localized ?? {},
        keywords_localized: loc.keywords_localized ?? {},
        tags: loc.tags ?? [],
        price_tier_id: loc.price_tier_id ?? null,
        price_per_sqm_min: loc.price_per_sqm_min ?? null,
        price_per_sqm_median: loc.price_per_sqm_median ?? null,
        price_per_sqm_max: loc.price_per_sqm_max ?? null,
        currency: loc.currency ?? null,
        data_source: seed._meta.source,
        data_as_of: seed._meta.data_as_of,
      };

      await db.upsertLocality(row);
      inserted++;
    } catch (err) {
      failed++;
      console.error(
        `  ✗ ${loc.kind}/${loc.slug}: ${(err as Error).message}`,
      );
    }
  }

  console.log(
    `\n${args.dryRun ? "Validated" : "Upserted"} ${inserted} rows${failed > 0 ? `, ${failed} failed` : ""}.`,
  );

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
