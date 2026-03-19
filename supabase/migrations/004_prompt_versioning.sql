-- Track which prompt version and model generated each listing
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS prompt_version TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT;
