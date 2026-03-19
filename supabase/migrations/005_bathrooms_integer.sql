-- Bathrooms should always be a whole number
ALTER TABLE properties
  ALTER COLUMN bathrooms TYPE INTEGER USING bathrooms::INTEGER;
