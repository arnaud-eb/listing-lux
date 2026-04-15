-- Phase 5: Soft delete for properties
-- Preserves data for future features (e.g., price estimation tool)
-- while hiding deleted listings from the user. Hard delete comes via
-- a separate GDPR deletion flow later.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Partial index for efficient "not deleted" queries
CREATE INDEX IF NOT EXISTS idx_properties_not_deleted
  ON properties (session_id)
  WHERE deleted_at IS NULL;
