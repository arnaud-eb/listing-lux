-- Migration 013: Drop Lëtzebuergesch from supported listing languages.
--
-- Background: docs/audits/2026-04-llm-output-audit/README.md §5.P0.6.
--
-- The 2026-04 audit's per-language differential (§2.2) showed gpt-4.1-mini's LU output
-- sat at native_quality 2.25 vs EN 4.18 and market_fit 2.50 vs FR 4.18 — a model-level
-- ceiling, not a prompt issue. Three of four languages now match audited LU speakers'
-- standards; LU is below ship-quality. Re-introduce post-MVP only with a different
-- model for the LU branch (Portuguese is the recommended next addition; ~16% of LU
-- residents).
--
-- Existing LU rows: hard delete, per user decision (pre-MVP, no real production data
-- yet; soft-delete column doesn't exist on `listings` and adding one for a single
-- one-off cleanup would be over-engineering).

-- 1. Hard delete LU rows.
DELETE FROM listings WHERE language = 'lu';

-- 2. Replace the CHECK constraint with the narrower set.
--    The constraint was created without an explicit name in 001_initial.sql, so we
--    drop by the auto-generated name pattern. If the name differs in your DB, run
--    `\d listings` against your live database to find the actual constraint name.
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_language_check;
ALTER TABLE listings
  ADD CONSTRAINT listings_language_check
  CHECK (language IN ('de', 'fr', 'en'));
