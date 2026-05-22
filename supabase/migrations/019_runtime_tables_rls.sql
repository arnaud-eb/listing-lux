-- 019: enable RLS on the runtime user-data tables (deny-all for client keys).
--
-- properties, listings and agent_profiles hold runtime, session-scoped,
-- user-generated data (agent_profiles also holds PII — full_name, email,
-- phone, agency details). They were created by raw CREATE TABLE in earlier
-- migrations (001, 007), so RLS has been OFF since day one. Supabase grants
-- anon / authenticated full DML on the public schema by default, so with RLS
-- off the public anon key can currently read and write EVERY row, unfiltered.
--
-- Nothing in the app relies on that. Every runtime DB call goes through the
-- service-role client (lib/supabase.server.ts → createServiceClient), which
-- has BYPASSRLS. Enabling RLS with NO policy is a deny-all for anon /
-- authenticated while leaving the service role untouched: the app is
-- unaffected, the public key can no longer reach user data.
--
-- PREREQUISITE — apply only after the code fix:
--   app/[locale]/(wizard)/listing/[listingId]/page.tsx reads properties and
--   listings via createClient() (the anon-key SSR client), not
--   createServiceClient(). It is the ONLY DB read path not already on the
--   service role. Under deny-all RLS the anon client returns zero rows, so
--   that page would 404 for every visitor. Switch it to createServiceClient()
--   before applying this migration. (Ownership is already enforced separately
--   by verifyPropertyOwnership in that file — the anon client provides no
--   security benefit today.)
--
-- Mirrors 018 (localities / price_tiers): same ENABLE-without-broad-write
-- pattern, here with no policy at all since these tables must not be reachable
-- by client keys in any way.

ALTER TABLE properties     ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

-- No policies are created on purpose. RLS enabled + zero policies = every
-- SELECT/INSERT/UPDATE/DELETE from anon / authenticated is denied; the
-- service role bypasses RLS and is unaffected.
