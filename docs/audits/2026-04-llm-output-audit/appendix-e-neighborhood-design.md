# Appendix E — Country-Wide Neighborhood / Locality Design

This appendix is the spec for `supabase/migrations/010_localities.sql`. The current `lib/markets/lu.ts` hardcodes 14 quartiers and contains a structural bug: `esch-sur-alzette`, `cloche-dor`, and `strassen` are nested under the `luxembourg-city` area. Esch is a separate commune (~17 km south), Cloche d'Or is a sub-zone of Gasperich quartier, and Strassen is its own commune. We need a model that scales to all 100 communes plus the 24 LU City quartiers and 16 Esch quartiers, and that extends to Belgium without code changes.

Sources:
- [Communes of Luxembourg (Wikipedia, derived from STATEC)](https://en.wikipedia.org/wiki/List_of_communes_of_Luxembourg) — 100 communes across 12 cantons (the "102" figure pre-dates the 2018/2023 mergers).
- [Quarters of Luxembourg City (Wikipedia)](https://en.wikipedia.org/wiki/Quarters_of_Luxembourg_City) and [Ville de Luxembourg — 24 districts](https://www.vdl.lu/en/city/a-glance/luxembourg-citys-24-districts).
- [Quarters of Esch-sur-Alzette (Wikipedia)](https://en.wikipedia.org/wiki/Quarters_of_Esch-sur-Alzette) — 16 quartiers.

## 1. Hierarchy — recommendation: flat-ish with `kind` enum

Recommended model: `country -> locality (kind: country | canton | commune | quartier | district)` stored in a single self-referential `localities` table with `parent_id`.

Justification: the strict 4-level shape (`country -> canton -> commune -> quartier`) breaks for Belgium (regions + provinces + arrondissements + communes + sections — 5 levels, plus Brussels has its own scheme) and for the existing LU bug (Cloche d'Or is a sub-zone of Gasperich quartier — a 5th level we'd otherwise have to model awkwardly). A flat table with `kind` lets each country pick the depth it needs, lets us add `kind = 'sub_quartier'` later for Cloche d'Or without a schema migration, and matches how OpenStreetMap and STATEC actually structure the data. Lookups stay fast: `getLocalityBySlug(slug, country)` is one indexed read, and ancestor walks are bounded (max 4-5 hops).

## 2. Pricing strategy — grouped tiers + per-locality override

**Two-track:** (a) a `price_tiers` table with 4-5 named tiers per country, (b) a nullable `price_tier_id` on each locality, and (c) optional per-locality `price_per_sqm_min/median/max` columns that override the tier when set. Hotspots like Kirchberg, Belair, Cloche d'Or get explicit numbers (we have data and they move the prompt's tone meaningfully). Tiny rural communes (Useldange, Saeul, etc.) just point at `price_tier_rural`. This avoids stuffing 100 hand-curated price ranges into the seed and keeps small-commune data realistic without pretending we have neighborhood-grade signal for villages of 800 people.

**Source of truth:** STATEC publishes quarterly average sale prices per commune ([Logement — prix de vente](https://statistiques.public.lu/en/themes/conditions-sociales/logement/prix-vente.html)) and Observatoire de l'Habitat publishes per-quartier data for LU City. The seed pulls from these on creation; we add a `data_source` and `data_as_of` column on each locality so staleness is visible. Refresh is a yearly chore, not quarterly — the prompt only needs an order-of-magnitude price signal, not a Zillow-grade estimate. atHome.lu has finer-grained listing-level data but it's not licensed for redistribution, so we don't pull from it.

## 3. Schema (drop into `010_localities.sql`)

```sql
-- 010_localities.sql — country-wide locality model

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE locality_kind AS ENUM (
  'country', 'region', 'canton', 'commune', 'quartier', 'sub_quartier'
);

CREATE TABLE IF NOT EXISTS price_tiers (
  id              TEXT PRIMARY KEY,            -- e.g. 'lu_premium', 'lu_rural'
  country_code    CHAR(2) NOT NULL,
  name            TEXT NOT NULL,                -- 'Premium urban', 'Rural'
  price_per_sqm_min     NUMERIC(8,2) NOT NULL,
  price_per_sqm_median  NUMERIC(8,2) NOT NULL,
  price_per_sqm_max     NUMERIC(8,2) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'EUR',
  data_source     TEXT,
  data_as_of      DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS localities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    CHAR(2) NOT NULL,
  parent_id       UUID REFERENCES localities(id) ON DELETE RESTRICT,
  kind            locality_kind NOT NULL,
  name            TEXT NOT NULL,                          -- canonical display
  slug            TEXT NOT NULL,                          -- url/api-safe
  name_localized        JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {de,fr,en,lu}
  description_localized JSONB NOT NULL DEFAULT '{}'::jsonb,
  keywords_localized    JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags            TEXT[]  NOT NULL DEFAULT '{}',
  price_tier_id   TEXT REFERENCES price_tiers(id) ON DELETE SET NULL,
  price_per_sqm_min     NUMERIC(8,2),  -- null => fall back to tier
  price_per_sqm_median  NUMERIC(8,2),
  price_per_sqm_max     NUMERIC(8,2),
  currency        CHAR(3),                                -- null => inherit from tier
  data_source     TEXT,
  data_as_of      DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (country_code, slug)
);

-- Indexes
CREATE INDEX idx_localities_parent       ON localities(parent_id);
CREATE INDEX idx_localities_country_kind ON localities(country_code, kind);
CREATE INDEX idx_localities_name_trgm    ON localities USING gin (name gin_trgm_ops);
CREATE INDEX idx_localities_lower_name   ON localities (country_code, lower(name));
```

**Index reasoning:** the autocomplete query is `WHERE country_code = $1 AND lower(name) LIKE lower($2 || '%')`. The `(country_code, lower(name))` btree handles strict prefix matches (the common case — typing "kirch" finds Kirchberg) at btree speed. The `gin_trgm_ops` index handles the rarer infix/typo case (`%irchb%`, "kirshberg") and is cheap on Supabase since `pg_trgm` is bundled. With ~100 LU rows + ~40 LU City/Esch quartiers, even a sequential scan would be sub-millisecond, but the index keeps it that way as we add Belgium (~600 communes) and France (~35,000 communes if we ever go there).

## 4. Price tiers (~5 tiers covers 100 LU communes)

```sql
INSERT INTO price_tiers (id, country_code, name, price_per_sqm_min, price_per_sqm_median, price_per_sqm_max, data_source, data_as_of) VALUES
  ('lu_premium_urban', 'LU', 'Premium urban',  8000, 11000, 14000, 'STATEC',                '2026-01-01'),
  ('lu_urban',         'LU', 'Urban',          6000,  8500, 11000, 'STATEC',                '2026-01-01'),
  ('lu_suburban',      'LU', 'Suburban',       5500,  7500,  9500, 'STATEC',                '2026-01-01'),
  ('lu_secondary',     'LU', 'Secondary city', 4500,  6500,  8500, 'STATEC',                '2026-01-01'),
  ('lu_rural',         'LU', 'Rural',          4000,  5500,  7500, 'STATEC',                '2026-01-01');
```

Mapping examples: LU City quartiers + Strassen/Bertrange = `lu_premium_urban`; Hesperange/Walferdange/Mamer = `lu_urban`; Differdange/Dudelange/Pétange = `lu_secondary`; Esch-sur-Alzette + Belval = `lu_secondary` (with explicit override since it's the second city); rural cantons (Clervaux, Wiltz, Redange, Vianden) = `lu_rural`.

## 5. Migration mapping — 14 existing quartiers, structural bug fixed

The first column is the slug currently in `lib/markets/lu.ts`. Because `properties.neighborhood` stores text (the slug), we keep slugs stable across the migration — no data backfill on `properties` is needed. The new `localities.id` is a UUID, but lookups are by `(country_code, slug)`.

| Existing slug      | New `kind`    | New parent (slug)              | Bug fix                                         |
|--------------------|---------------|--------------------------------|-------------------------------------------------|
| `kirchberg`        | quartier      | `luxembourg-city`              | —                                               |
| `belair`           | quartier      | `luxembourg-city`              | —                                               |
| `limpertsberg`     | quartier      | `luxembourg-city`              | —                                               |
| `merl`             | quartier      | `luxembourg-city`              | —                                               |
| `hollerich`        | quartier      | `luxembourg-city`              | —                                               |
| `bonnevoie`        | quartier      | `luxembourg-city`              | merge of "Bonnevoie-Nord/Sud" — keep one slug   |
| `centre-ville`     | quartier      | `luxembourg-city`              | display name aligns to "Ville Haute"            |
| `gare`             | quartier      | `luxembourg-city`              | —                                               |
| `grund`            | quartier      | `luxembourg-city`              | —                                               |
| `cents`            | quartier      | `luxembourg-city`              | —                                               |
| `gasperich`        | quartier      | `luxembourg-city`              | —                                               |
| `strassen`         | **commune**   | `canton-luxembourg`            | **was** wrongly under `luxembourg-city`         |
| `esch-sur-alzette` | **commune**   | `canton-esch-sur-alzette`      | **was** wrongly under `luxembourg-city`         |
| `cloche-dor`       | sub_quartier  | `gasperich`                    | **was** wrongly under `luxembourg-city`; it's a sub-zone of Gasperich |

`luxembourg-city` itself becomes a `commune` with parent `canton-luxembourg`. Cantons become `kind = 'canton'` rows with parent `lu` (the country).

## 6. Seed strategy — recommendation: hybrid (TS script with checked-in JSON snapshot)

Recommended: a TypeScript seed script `scripts/seed-localities.ts` that reads from a checked-in `data/lu-localities.json` snapshot and upserts via the Supabase service client. Rationale: (a) pure SQL files make 130+ rows of multilingual JSONB unreadable in PRs; (b) fetching live from STATEC at migration time is fragile (network, schema drift); (c) checking in the JSON snapshot makes diffs reviewable and migrations reproducible. The script is idempotent (`ON CONFLICT (country_code, slug) DO UPDATE`), runs on `bun run seed:localities`, and is the only writer for `localities`. Re-running it after `data/lu-localities.json` is updated propagates changes — no separate migration needed for content updates, only for schema changes.

3-row sample:

```json
[
  {
    "country_code": "LU", "kind": "country", "slug": "lu", "name": "Luxembourg",
    "parent_slug": null, "tags": [], "price_tier_id": null
  },
  {
    "country_code": "LU", "kind": "canton", "slug": "canton-luxembourg",
    "name": "Canton of Luxembourg", "parent_slug": "lu", "tags": []
  },
  {
    "country_code": "LU", "kind": "quartier", "slug": "kirchberg",
    "name": "Kirchberg", "parent_slug": "luxembourg-city",
    "tags": ["EU quarter", "modern", "expat-friendly", "business district"],
    "price_per_sqm_min": 8500, "price_per_sqm_median": 11000, "price_per_sqm_max": 14000,
    "currency": "EUR", "price_tier_id": "lu_premium_urban",
    "name_localized": { "de": "Kirchberg", "fr": "Kirchberg", "en": "Kirchberg", "lu": "Kierchbierg" },
    "description_localized": { "en": "Kirchberg is Luxembourg's modern business district..." },
    "keywords_localized": { "en": ["EU quarter", "Philharmonie", "MUDAM"] }
  }
]
```

## 7. `lib/markets/lu.ts` refactor

**Stays in the file (market-level, rarely changes):** `id`, `name`, `countryCode`, `supportedLanguages`, `propertyTypes`, `features`, `hashtags`, `propertyTypeHashtags`, default `currency`, `locale`, `areaUnit`. These are config, not data.

**Leaves the file (locality data → DB):** the entire `areas` array, all `Neighborhood` objects, all per-quartier descriptions/keywords/prices. Drop `AreaData` and the `areas` field from `Market` in `types.ts`. Drop the in-memory `getNeighborhoodIndex()` map in `lib/markets/index.ts` — replaced by the DB lookup. `estimatePrice` becomes `async` and reads from the DB (with a small in-process LRU since the same slug is hit many times during a single generation).

## 8. API contract — `searchLocalities` server action

```ts
// app/(wizard)/create/actions.ts
'use server'
import { createClient } from '@/lib/supabase.server'

export type LocalitySearchResult = {
  id: string; slug: string; name: string;
  kind: 'commune' | 'quartier' | 'sub_quartier' | 'canton';
  parent_name: string | null;     // for disambiguation in UI: "Belair, Luxembourg City"
}

export async function searchLocalities(input: {
  query: string; country?: string; limit?: number
}): Promise<LocalitySearchResult[]> {
  const country = input.country ?? 'LU'
  const limit = Math.min(input.limit ?? 10, 25)
  const q = input.query.trim().toLowerCase()
  if (q.length < 2) return []
  const supabase = createClient()
  const { data, error } = await supabase.rpc('search_localities', {
    p_country: country, p_query: q, p_limit: limit,
  })
  if (error) throw error
  return data ?? []
}
```

The `search_localities` SQL function does `WHERE country_code = p_country AND lower(name) LIKE p_query || '%' ORDER BY kind_priority, name LIMIT p_limit`, joining once to `parent` for the display label. Single indexed btree lookup, ~1ms on Supabase even at 35k rows. Excludes `country` and `region` rows from results — agents pick communes/quartiers, not countries.

## 9. `buildNeighborhoodContext` adaptation

Rename to `buildLocalityContext(locality: Locality | null, language)`. The `Locality` shape exposed to the prompt builder is intentionally near-identical to the old `Neighborhood`:

```ts
export interface Locality {
  slug: string
  name: string
  kind: 'commune' | 'quartier' | 'sub_quartier' | string
  parentName: string | null      // e.g. 'Luxembourg City' for kirchberg
  tags: string[]
  pricePerSqm: { min: number; median: number; max: number; currency: string } | null
  descriptions: Partial<Record<Language, string>>
  keywords:     Partial<Record<Language, string[]>>
}
```

Differences from `Neighborhood`: (a) `pricePerSqm` is nullable (rural commune may have only a tier — the loader fills it from `price_tiers`); (b) `parentName` is added so the prompt can disambiguate "Centre-Ville" vs "Centre" (a quartier of Differdange). The prompt template change is one line: prepend `${locality.parentName ? `${locality.parentName} — ` : ''}` to the "Neighborhood:" header. Existing `descriptions`/`keywords`/`tags` shape is preserved, so no SYSTEM_PROMPT edits are required by this refactor alone.

## Out of scope / unresolved

- **Price freshness UI:** do we surface `data_as_of` to the agent? Recommend yes ("price band based on STATEC Q1 2026") in a tooltip, but that's a UX call.
- **Belgium model:** we've designed for it (the `kind` enum already includes `region`), but Brussels-Capital's 19 communes + Flemish/Walloon/German-speaking regions need the actual seed before we know if `region` is enough or we need `community`.
- **Cloche d'Or in production:** today it has its own price band that's higher than Gasperich's. After migration it's a `sub_quartier` of `gasperich`. The price override on the Cloche d'Or row preserves current behavior; if we drop the override, agents lose the premium signal. Recommendation: keep the override, but flag this as a content decision (not a schema decision) for review.
