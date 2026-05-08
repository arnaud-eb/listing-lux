-- Migration 011: Property fields surfaced by the LLM-output audit (April 2026)
--
-- Background: docs/audits/2026-04-llm-output-audit/README.md §5.P0.2 + appendix-d.
-- These fields are required for:
--   - listing_kind: drives sale-vs-rental copy register, CTAs, legal disclosures
--   - cpe_class / thermal_insulation_class: legally required on LU real-estate ads
--     since 1 July 2012 (Règlement grand-ducal modifié du 30 novembre 2007).
--   - year_built / charges_monthly / floors_total / floor_of_unit: parity with
--     athome.lu / immotop.lu listing form fields.
--
-- All fields are nullable except listing_kind, which defaults to 'sale' for
-- backward compatibility with rows created before this migration.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS listing_kind TEXT NOT NULL DEFAULT 'sale'
    CHECK (listing_kind IN ('sale', 'rent')),
  ADD COLUMN IF NOT EXISTS cpe_class TEXT
    CHECK (cpe_class IS NULL OR cpe_class IN ('A++','A+','A','B','C','D','E','F','G','H','I')),
  ADD COLUMN IF NOT EXISTS thermal_insulation_class TEXT
    CHECK (thermal_insulation_class IS NULL OR thermal_insulation_class IN ('A++','A+','A','B','C','D','E','F','G','H','I')),
  ADD COLUMN IF NOT EXISTS year_built INTEGER
    CHECK (year_built IS NULL OR (year_built BETWEEN 1800 AND 2100)),
  ADD COLUMN IF NOT EXISTS charges_monthly NUMERIC(10, 2)
    CHECK (charges_monthly IS NULL OR charges_monthly >= 0),
  ADD COLUMN IF NOT EXISTS floors_total INTEGER
    CHECK (floors_total IS NULL OR floors_total > 0),
  ADD COLUMN IF NOT EXISTS floor_of_unit INTEGER;

-- Index on listing_kind because the rental flow filters on it heavily and the
-- distribution is bimodal (sale vs rent), so a btree index actually helps.
CREATE INDEX IF NOT EXISTS properties_listing_kind_idx
  ON properties (listing_kind);
