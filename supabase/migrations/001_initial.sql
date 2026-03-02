-- ListingLux AI — Initial Database Schema

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  bathrooms NUMERIC(3,1) NOT NULL CHECK (bathrooms >= 0),
  sqm NUMERIC(8,2) NOT NULL CHECK (sqm > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price > 0),
  neighborhood TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'apartment',
  features JSONB NOT NULL DEFAULT '{}',
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listings table (generated AI content per language)
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('de', 'fr', 'en', 'lu')),
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  highlights TEXT[] NOT NULL DEFAULT '{}',
  seo_keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, language)
);

-- Performance index for language tab queries
CREATE INDEX IF NOT EXISTS idx_listings_property_language
  ON listings(property_id, language);

-- Storage bucket for property photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: public read
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

-- Storage policy: authenticated write
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-photos');

-- Storage policy: authenticated delete
CREATE POLICY "Authenticated users can delete their uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-photos');
