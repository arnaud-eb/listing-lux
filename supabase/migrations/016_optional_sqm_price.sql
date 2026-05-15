-- 016: sqm and price become optional. Agents can publish a draft listing without
-- a measured surface or a finalized asking/rent figure; the AI prompts, listing
-- page, PDF, and copy formats gracefully omit the missing field. Positive-value
-- CHECKs are preserved for non-null values.

ALTER TABLE properties
  ALTER COLUMN sqm DROP NOT NULL,
  ALTER COLUMN price DROP NOT NULL;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_sqm_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_sqm_check
  CHECK (sqm IS NULL OR sqm > 0);

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_price_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_price_check
  CHECK (price IS NULL OR price > 0);
