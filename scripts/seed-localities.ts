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
 * Env optional (cache revalidation — see lib/localities/repository.ts):
 *   LOCALITIES_REVALIDATE_URL     — base URL of the running Next.js app
 *   LOCALITIES_REVALIDATE_SECRET  — shared secret matching the route handler
 *   If either is missing, the cache-revalidate POST is skipped silently — useful
 *   for offline seeding into a fresh DB before the app is up.
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
  asking_price_per_sqm_apt?: number | null;
  asking_price_per_sqm_house?: number | null;
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
  /** All locality slugs currently in the DB. null for dry-run (no DB). */
  listExistingSlugs: (countryCode: string) => Promise<string[] | null>;
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
    async listExistingSlugs(countryCode) {
      const { data, error } = await sb
        .from("localities")
        .select("slug")
        .eq("country_code", countryCode);
      if (error) throw new Error(`listExistingSlugs failed: ${error.message}`);
      return (data ?? []).map((r) => r.slug as string);
    },
  };
}

function makeDryRunClient(): DbClient {
  // The JSON is the complete source of truth (country → cantons → communes →
  // quartiers). topoSortByKind guarantees a parent is "upserted" before any
  // child, so resolving parents from slugs seen earlier in this run is a real
  // FK-consistency check — an unresolved parent_slug means the JSON is broken.
  const known = new Set<string>();
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
    async listExistingSlugs() {
      return null;
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

  const db = args.dryRun ? makeDryRunClient() : makeSupabaseClient();

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
        asking_price_per_sqm_apt: loc.asking_price_per_sqm_apt ?? null,
        asking_price_per_sqm_house: loc.asking_price_per_sqm_house ?? null,
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

  // upsert never deletes — flag DB rows the JSON no longer defines (e.g. communes
  // merged away). Removal stays manual: a stale row is safer than a surprise delete.
  const existingSlugs = await db.listExistingSlugs(countryCode);
  if (existingSlugs) {
    const jsonSlugs = new Set(seed.localities.map((l) => l.slug));
    const orphans = existingSlugs.filter((s) => !jsonSlugs.has(s)).sort();
    if (orphans.length > 0) {
      console.warn(
        `\n⚠ ${orphans.length} DB row(s) absent from the JSON — orphaned, not deleted:`,
      );
      for (const s of orphans) console.warn(`    ${s}`);
      console.warn(`  Remove them manually if the omission is intentional.`);
    }
  }

  if (!args.dryRun && failed === 0) {
    await pingRevalidate();
  }

  if (failed > 0) process.exit(1);
}

async function pingRevalidate(): Promise<void> {
  const url = process.env.LOCALITIES_REVALIDATE_URL;
  const secret = process.env.LOCALITIES_REVALIDATE_SECRET;
  if (!url || !secret) {
    console.log("  (revalidate skipped — LOCALITIES_REVALIDATE_URL or _SECRET not set)");
    return;
  }
  const endpoint = `${url.replace(/\/$/, "")}/api/admin/revalidate-localities`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) {
      console.warn(`  (revalidate failed: HTTP ${res.status} at ${endpoint})`);
      return;
    }
    console.log("  → localities cache revalidated");
  } catch (err) {
    console.warn(`  (revalidate failed: ${(err as Error).message})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
