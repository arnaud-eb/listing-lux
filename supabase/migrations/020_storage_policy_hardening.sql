-- 020: remove the over-permissive property-photos write policies.
--
-- Migration 001 created three storage.objects policies for the property-photos
-- bucket. Their names imply scoping the SQL does not enforce:
--
--   "Authenticated users can upload"               INSERT  WITH CHECK (bucket_id = 'property-photos')
--   "Authenticated users can delete their uploads" DELETE  USING      (bucket_id = 'property-photos')
--
-- Neither has a TO clause, so both apply to the `public` role (anon included),
-- and neither checks ownership — "their uploads" scopes nothing. With the anon
-- key, anyone could upload arbitrary objects anywhere in the bucket, or delete
-- any photo in it.
--
-- The app never relies on these. Photo uploads use a service-role-minted
-- signed upload URL (getSignedUploadUrl in create/actions.ts); the signed
-- token is its own authorization and does not consult an RLS INSERT policy.
-- The app never deletes property-photos objects at all (only agent-logos has a
-- .remove() path). This brings property-photos in line with the agent-logos
-- bucket (007), which ships with no write policies and is written solely by
-- the service role.
--
-- Public read is kept — the bucket is public by design; listing photos render
-- via public URL.
--
-- VERIFY before promoting to production: after applying in staging, confirm
-- the wizard photo upload still succeeds end to end. If a signed-URL upload
-- unexpectedly requires an INSERT policy on this Supabase version, re-add one
-- scoped narrowly (e.g. TO service_role) rather than restoring the public one.

DROP POLICY IF EXISTS "Authenticated users can upload"               ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their uploads" ON storage.objects;

-- "Public read access" (SELECT on property-photos) is intentionally left in
-- place — public read is the bucket's designed behaviour.
