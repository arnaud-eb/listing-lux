-- 014: availability_date for rental listings (audit P1.3).
-- Pairs with listing_kind='rent' (migration 011). Nullable: rent listings may
-- be "immediately available" with the value left blank.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS availability_date DATE;
