-- Migration 012: Split the ambiguous `storage` feature into `cellar` / `basement` / `attic`.
--
-- Background: docs/audits/2026-04-llm-output-audit/README.md §5.P0.9 + §3.5.
--
-- The pre-1.5 `features.storage` boolean was treated by the LLM as license to expand
-- into in-unit signals it never asserts ("ample storage space", "Rangements optimisés",
-- "integrated wardrobes"). The audit's IRR pass surfaced this on 5 of 6 sample outputs.
--
-- The boolean is split into three narrower flags with clearer LU/EU vocabulary:
--   - `cellar`   → separate storage room in the building basement (FR `cave`, DE `Keller`).
--                  The LU-canonical case for apartments. Default backfill target.
--   - `basement` → full sub-grade floor (houses with finished or usable basement).
--   - `attic`    → storage or unfinished attic — distinct from the `attic` PROPERTY_TYPES
--                  entry which describes the whole unit.
--
-- Backfill assumption: existing `features.storage = true` rows almost certainly meant a
-- cellar (the LU-canonical case for apartments), not a full basement or attic. Agents can
-- edit a row through the wizard if the assumption was wrong. Rows with `features.storage = false`
-- get the default of "key absent → false" for all three new keys (no explicit write needed).
--
-- This is a JSONB shape change; CHECK constraints on `properties.features` keys do not
-- exist in this schema (the `features` column is a free-form JSONB), so no DDL is needed
-- beyond the data migration.

UPDATE properties
SET features =
      (features - 'storage')                        -- drop the old key
      || jsonb_build_object('cellar', true)         -- add cellar = true
WHERE features ? 'storage'
  AND COALESCE((features ->> 'storage')::boolean, false) = true;

-- For rows that had `storage = false` explicitly, just drop the key. Absent key == false
-- on read in lib/constants.ts FEATURE_OPTIONS consumers.
UPDATE properties
SET features = features - 'storage'
WHERE features ? 'storage'
  AND COALESCE((features ->> 'storage')::boolean, false) = false;
