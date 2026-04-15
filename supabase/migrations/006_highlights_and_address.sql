-- Phase 5: Highlight icons (JSONB) + property address

-- 1. Add optional address to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Convert highlights from TEXT[] to JSONB with icon metadata
-- Must drop old default first (text[] default can't auto-cast to jsonb)
ALTER TABLE listings ALTER COLUMN highlights DROP DEFAULT;

-- Step 2a: Convert TEXT[] to JSONB (produces ["string1", "string2"])
ALTER TABLE listings
  ALTER COLUMN highlights SET DATA TYPE JSONB
  USING COALESCE(to_jsonb(highlights), '[]'::jsonb);

-- Step 2b: Transform each string element into {text, icon} object
UPDATE listings
SET highlights = (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('text', elem::text, 'icon', 'sparkles')),
    '[]'::jsonb
  )
  FROM jsonb_array_elements_text(highlights) AS elem
)
WHERE jsonb_typeof(highlights) = 'array' AND jsonb_array_length(highlights) > 0;

-- Set new JSONB default
ALTER TABLE listings ALTER COLUMN highlights SET DEFAULT '[]'::jsonb;
