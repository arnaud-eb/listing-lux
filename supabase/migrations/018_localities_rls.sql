-- 018: lock the reference tables to read-only for client keys.
--
-- localities + price_tiers are reference data — owned by data/lu-localities.json
-- (+ migration 010 for schema) and written ONLY by scripts/seed-localities.ts
-- via the service role. Enabling RLS with a SELECT-only policy lets the anon /
-- authenticated keys read but never write, so a future client-side feature
-- cannot silently clobber rows the next seed run would overwrite. The service
-- role bypasses RLS, so the seed script and lib/localities/repository.ts (both
-- service-role) are unaffected.
--
-- Note: the project's runtime tables (properties, listings, agent_profiles) run
-- without RLS by design — all access is server-side via the service role. RLS
-- here is deliberate and specific to the reference tables, which must never be
-- writable at runtime.

ALTER TABLE localities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS localities_public_read ON localities;
CREATE POLICY localities_public_read ON localities
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS price_tiers_public_read ON price_tiers;
CREATE POLICY price_tiers_public_read ON price_tiers
  FOR SELECT TO anon, authenticated USING (true);
