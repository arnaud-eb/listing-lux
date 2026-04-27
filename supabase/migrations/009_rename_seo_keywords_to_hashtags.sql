-- Rename listings.seo_keywords → listings.hashtags
-- SEO keywords are no longer used for search indexing (listings aren't public indexable pages);
-- the field now stores hashtags for social media copy.

ALTER TABLE listings RENAME COLUMN seo_keywords TO hashtags;
