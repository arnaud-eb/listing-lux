-- 021: drop the property-photos "Public read access" SELECT policy.
--
-- property-photos is a public bucket (storage.buckets.public = true), so
-- individual objects are served by the /object/public/ endpoint with no auth
-- and no RLS — which is all the app needs (getPublicUrl just builds that URL;
-- the app never calls storage.list()). The leftover SELECT policy on
-- storage.objects adds one capability on top: it lets any anon-key caller
-- enumerate the whole bucket via storage.list(), exposing every object path
-- (each path embeds a property UUID). Verified live during the RLS audit:
-- an anon-key list() returned bucket contents.
--
-- Dropping it leaves property-photos with zero storage.objects policies,
-- matching the agent-logos bucket (007) — also public, also policy-free, and
-- serving objects fine. Public URL reads are unaffected; only API enumeration
-- is removed. Closes advisor lint 0025 (public_bucket_allows_listing).

DROP POLICY IF EXISTS "Public read access" ON storage.objects;
