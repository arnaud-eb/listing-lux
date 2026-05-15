-- 015: reject rentals with availability_date in the past at the DB layer.
-- Fires only at INSERT/UPDATE (CURRENT_DATE is STABLE, not IMMUTABLE), which
-- matches the app-level guard in saveProperty(). Existing rows whose date has
-- naturally slipped into the past are nulled out first — equivalent to
-- "available immediately" in app semantics — so the constraint can attach.

UPDATE properties
  SET availability_date = NULL
  WHERE availability_date IS NOT NULL AND availability_date < CURRENT_DATE;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_availability_date_future;
ALTER TABLE properties
  ADD CONSTRAINT properties_availability_date_future
  CHECK (availability_date IS NULL OR availability_date >= CURRENT_DATE);
