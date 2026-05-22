-- 017: per-commune asking-price columns, refreshed quarterly from STATEC /
-- Observatoire de l'Habitat ("Prix annoncés des logements - Par commune",
-- data.public.lu, CC0). STATEC publishes a single mean asking €/m² per commune
-- per property type — not a min/median/max band — so these are scalar columns,
-- distinct from the hand-set band on price_tiers and the optional hand-curated
-- price_per_sqm_{min,median,max} override on localities.
--
-- These are ASKING prices (listing prices before negotiation), not recorded
-- sale prices. Used only for the prompt's order-of-magnitude tier calibration.

ALTER TABLE localities
  ADD COLUMN IF NOT EXISTS asking_price_per_sqm_apt   NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS asking_price_per_sqm_house NUMERIC(8,2);

ALTER TABLE localities
  DROP CONSTRAINT IF EXISTS localities_asking_apt_check;
ALTER TABLE localities
  ADD CONSTRAINT localities_asking_apt_check
  CHECK (asking_price_per_sqm_apt IS NULL OR asking_price_per_sqm_apt > 0);

ALTER TABLE localities
  DROP CONSTRAINT IF EXISTS localities_asking_house_check;
ALTER TABLE localities
  ADD CONSTRAINT localities_asking_house_check
  CHECK (asking_price_per_sqm_house IS NULL OR asking_price_per_sqm_house > 0);
