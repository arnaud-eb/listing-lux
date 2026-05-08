-- Migration 010: Country-wide locality model (Luxembourg + future BE)
--
-- Replaces the hardcoded 14-quartier list in lib/markets/lu.ts. Spec:
-- docs/audits/2026-04-llm-output-audit/appendix-e-neighborhood-design.md.
--
-- Hierarchy: country -> region/canton -> commune -> quartier -> sub_quartier
-- Self-referential via parent_id; flat-ish structure with `kind` enum so each
-- country picks the depth it needs. Pricing has two tracks: grouped tiers in
-- `price_tiers` for tiny communes, plus optional per-locality overrides for
-- hotspots (Kirchberg, Belair, etc.) where we have explicit data.
--
-- This migration provides the schema + the price tiers + top-level country/
-- canton/commune rows. The quartier seed (140+ rows with multilingual JSONB)
-- lives in scripts/seed-localities.ts to keep the migration reviewable.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
  CREATE TYPE locality_kind AS ENUM (
    'country', 'region', 'canton', 'commune', 'quartier', 'sub_quartier'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS price_tiers (
  id              TEXT PRIMARY KEY,
  country_code    CHAR(2) NOT NULL,
  name            TEXT NOT NULL,
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
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  name_localized        JSONB NOT NULL DEFAULT '{}'::jsonb,
  description_localized JSONB NOT NULL DEFAULT '{}'::jsonb,
  keywords_localized    JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags            TEXT[]  NOT NULL DEFAULT '{}',
  price_tier_id   TEXT REFERENCES price_tiers(id) ON DELETE SET NULL,
  price_per_sqm_min     NUMERIC(8,2),
  price_per_sqm_median  NUMERIC(8,2),
  price_per_sqm_max     NUMERIC(8,2),
  currency        CHAR(3),
  data_source     TEXT,
  data_as_of      DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (country_code, slug)
);

-- Indexes for autocomplete + ancestor walks
CREATE INDEX IF NOT EXISTS idx_localities_parent       ON localities(parent_id);
CREATE INDEX IF NOT EXISTS idx_localities_country_kind ON localities(country_code, kind);
CREATE INDEX IF NOT EXISTS idx_localities_name_trgm    ON localities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_localities_lower_name   ON localities (country_code, lower(name));

-- ────────────────────────────────────────────────────────────────────────────
-- Seed: price tiers (Luxembourg)
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO price_tiers (id, country_code, name, price_per_sqm_min, price_per_sqm_median, price_per_sqm_max, currency, data_source, data_as_of) VALUES
  ('lu_premium_urban', 'LU', 'Premium urban',  8000, 11000, 14000, 'EUR', 'STATEC',                '2026-01-01'),
  ('lu_urban',         'LU', 'Urban',          6000,  8500, 11000, 'EUR', 'STATEC',                '2026-01-01'),
  ('lu_suburban',      'LU', 'Suburban',       5500,  7500,  9500, 'EUR', 'STATEC',                '2026-01-01'),
  ('lu_secondary',     'LU', 'Secondary city', 4500,  6500,  8500, 'EUR', 'STATEC',                '2026-01-01'),
  ('lu_rural',         'LU', 'Rural',          4000,  5500,  7500, 'EUR', 'STATEC',                '2026-01-01')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- Seed: top-level Luxembourg geography
-- (country + 12 cantons + key communes; quartier-level seed comes from
--  scripts/seed-localities.ts to keep multilingual JSONB out of SQL)
-- ────────────────────────────────────────────────────────────────────────────

-- Country
INSERT INTO localities (country_code, parent_id, kind, name, slug, name_localized, tags)
VALUES ('LU', NULL, 'country', 'Luxembourg', 'lu',
  '{"de":"Luxemburg","fr":"Luxembourg","en":"Luxembourg","lu":"Lëtzebuerg"}'::jsonb,
  ARRAY[]::text[])
ON CONFLICT (country_code, slug) DO NOTHING;

-- Cantons (12 official cantons of Luxembourg)
WITH country AS (SELECT id FROM localities WHERE country_code = 'LU' AND slug = 'lu')
INSERT INTO localities (country_code, parent_id, kind, name, slug, name_localized, tags)
SELECT 'LU', country.id, 'canton', name, slug, name_localized, ARRAY[]::text[]
FROM country, (VALUES
  ('Canton of Capellen',         'canton-capellen',         '{"de":"Kanton Capellen","fr":"Canton de Capellen","en":"Canton of Capellen","lu":"Kanton Capellen"}'::jsonb),
  ('Canton of Clervaux',         'canton-clervaux',         '{"de":"Kanton Clerf","fr":"Canton de Clervaux","en":"Canton of Clervaux","lu":"Kanton Klierf"}'::jsonb),
  ('Canton of Diekirch',         'canton-diekirch',         '{"de":"Kanton Diekirch","fr":"Canton de Diekirch","en":"Canton of Diekirch","lu":"Kanton Dikrech"}'::jsonb),
  ('Canton of Echternach',       'canton-echternach',       '{"de":"Kanton Echternach","fr":"Canton d''Echternach","en":"Canton of Echternach","lu":"Kanton Iechternach"}'::jsonb),
  ('Canton of Esch-sur-Alzette', 'canton-esch-sur-alzette', '{"de":"Kanton Esch","fr":"Canton d''Esch-sur-Alzette","en":"Canton of Esch-sur-Alzette","lu":"Kanton Esch-Uelzecht"}'::jsonb),
  ('Canton of Grevenmacher',     'canton-grevenmacher',     '{"de":"Kanton Grevenmacher","fr":"Canton de Grevenmacher","en":"Canton of Grevenmacher","lu":"Kanton Gréiwemaacher"}'::jsonb),
  ('Canton of Luxembourg',       'canton-luxembourg',       '{"de":"Kanton Luxemburg","fr":"Canton de Luxembourg","en":"Canton of Luxembourg","lu":"Kanton Lëtzebuerg"}'::jsonb),
  ('Canton of Mersch',           'canton-mersch',           '{"de":"Kanton Mersch","fr":"Canton de Mersch","en":"Canton of Mersch","lu":"Kanton Miersch"}'::jsonb),
  ('Canton of Redange',          'canton-redange',          '{"de":"Kanton Redingen","fr":"Canton de Redange","en":"Canton of Redange","lu":"Kanton Réiden"}'::jsonb),
  ('Canton of Remich',           'canton-remich',           '{"de":"Kanton Remich","fr":"Canton de Remich","en":"Canton of Remich","lu":"Kanton Réimech"}'::jsonb),
  ('Canton of Vianden',          'canton-vianden',          '{"de":"Kanton Vianden","fr":"Canton de Vianden","en":"Canton of Vianden","lu":"Kanton Veianen"}'::jsonb),
  ('Canton of Wiltz',            'canton-wiltz',            '{"de":"Kanton Wiltz","fr":"Canton de Wiltz","en":"Canton of Wiltz","lu":"Kanton Wolz"}'::jsonb)
) AS v(name, slug, name_localized)
ON CONFLICT (country_code, slug) DO NOTHING;

-- Key communes (the rest come via scripts/seed-localities.ts)
-- Luxembourg City under canton-luxembourg
WITH parent AS (SELECT id FROM localities WHERE country_code = 'LU' AND slug = 'canton-luxembourg')
INSERT INTO localities (country_code, parent_id, kind, name, slug, name_localized, price_tier_id, tags)
SELECT 'LU', parent.id, 'commune', 'Luxembourg City', 'luxembourg-city',
  '{"de":"Luxemburg-Stadt","fr":"Ville de Luxembourg","en":"Luxembourg City","lu":"Stad Lëtzebuerg"}'::jsonb,
  'lu_premium_urban', ARRAY['capital','historic','UNESCO','urban']
FROM parent
ON CONFLICT (country_code, slug) DO NOTHING;

-- Strassen, Bertrange, Mamer (key surrounding communes audited as missing/parented incorrectly)
WITH parent AS (SELECT id FROM localities WHERE country_code = 'LU' AND slug = 'canton-luxembourg')
INSERT INTO localities (country_code, parent_id, kind, name, slug, name_localized, price_tier_id, tags)
SELECT 'LU', parent.id, 'commune', name, slug, name_localized, price_tier_id, ARRAY[]::text[]
FROM parent, (VALUES
  ('Strassen',  'strassen',  '{"de":"Strassen","fr":"Strassen","en":"Strassen","lu":"Stroossen"}'::jsonb,    'lu_premium_urban'),
  ('Bertrange', 'bertrange', '{"de":"Bartringen","fr":"Bertrange","en":"Bertrange","lu":"Bartreng"}'::jsonb, 'lu_premium_urban'),
  ('Mamer',     'mamer',     '{"de":"Mamer","fr":"Mamer","en":"Mamer","lu":"Mamer"}'::jsonb,                'lu_urban'),
  ('Hesperange','hesperange','{"de":"Hesperingen","fr":"Hesperange","en":"Hesperange","lu":"Hesper"}'::jsonb,'lu_urban'),
  ('Walferdange','walferdange','{"de":"Walferdingen","fr":"Walferdange","en":"Walferdange","lu":"Walfer"}'::jsonb,'lu_urban')
) AS v(name, slug, name_localized, price_tier_id)
ON CONFLICT (country_code, slug) DO NOTHING;

-- Esch-sur-Alzette under its own canton (FIX the structural bug from lib/markets/lu.ts
-- where it was wrongly nested under luxembourg-city)
WITH parent AS (SELECT id FROM localities WHERE country_code = 'LU' AND slug = 'canton-esch-sur-alzette')
INSERT INTO localities (country_code, parent_id, kind, name, slug, name_localized, price_tier_id, tags)
SELECT 'LU', parent.id, 'commune', 'Esch-sur-Alzette', 'esch-sur-alzette',
  '{"de":"Esch an der Alzette","fr":"Esch-sur-Alzette","en":"Esch-sur-Alzette","lu":"Esch-Uelzecht"}'::jsonb,
  'lu_secondary', ARRAY['second city','multicultural','university','Belval']
FROM parent
ON CONFLICT (country_code, slug) DO NOTHING;

-- Differdange (also missing from current registry)
WITH parent AS (SELECT id FROM localities WHERE country_code = 'LU' AND slug = 'canton-esch-sur-alzette')
INSERT INTO localities (country_code, parent_id, kind, name, slug, name_localized, price_tier_id, tags)
SELECT 'LU', parent.id, 'commune', 'Differdange', 'differdange',
  '{"de":"Differdingen","fr":"Differdange","en":"Differdange","lu":"Déifferdeng"}'::jsonb,
  'lu_secondary', ARRAY[]::text[]
FROM parent
ON CONFLICT (country_code, slug) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- search_localities RPC: indexed prefix lookup for the autocomplete UI
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_localities(
  p_country CHAR(2),
  p_query TEXT,
  p_limit INT DEFAULT 10
) RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  kind locality_kind,
  parent_name TEXT
) LANGUAGE sql STABLE AS $$
  SELECT l.id, l.slug, l.name, l.kind, p.name AS parent_name
  FROM localities l
  LEFT JOIN localities p ON p.id = l.parent_id
  WHERE l.country_code = p_country
    AND l.kind IN ('commune', 'quartier', 'sub_quartier')
    AND lower(l.name) LIKE lower(p_query) || '%'
  ORDER BY
    CASE l.kind
      WHEN 'commune' THEN 1
      WHEN 'quartier' THEN 2
      WHEN 'sub_quartier' THEN 3
      ELSE 4
    END,
    l.name
  LIMIT LEAST(GREATEST(p_limit, 1), 25);
$$;
