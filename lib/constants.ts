import type { Language } from './types'

/** Ordered list of supported languages (used for tabs, badges, generation) */
export const LANGUAGES: Language[] = ['fr', 'en', 'de', 'lu'] as const

/** Human-readable labels for each language */
export const LANGUAGE_LABELS: Record<Language, string> = {
  de: 'Deutsch',
  fr: 'Français',
  en: 'English',
  lu: 'Lëtzebuergesch',
}

/** Supabase storage bucket for property photos */
export const PHOTO_BUCKET = 'property-photos'

/** Allowed MIME types for photo uploads */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

/** Sanitize a filename: strip path segments, replace unsafe chars, ensure extension */
export function sanitizeFilename(raw: string): string {
  // Strip any directory components (path traversal prevention)
  const basename = raw.split(/[/\\]/).pop() || 'upload'
  // Replace non-alphanumeric chars (except dot, hyphen, underscore) with underscores
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_')
  // Ensure it has an extension
  if (!/\.\w{2,5}$/.test(safe)) return `${safe}.jpg`
  return safe
}

/** Minimum photos required before generation */
export const MIN_PHOTOS = 5

/** Maximum file size per photo (10MB) */
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024

/** Maximum photos allowed per listing */
export const MAX_PHOTOS = 20

/** Maximum characters for regeneration comment */
export const MAX_COMMENT_LENGTH = 1000

/** Property types — single source of truth for the dropdown, schema, and AI derivation */
export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'villa', label: 'Villa' },
] as const

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number]['value']

/** Selectable features — single source of truth for the chips, schema, and AI derivation */
export const FEATURE_OPTIONS = [
  { id: 'balcony', label: 'Balcony' },
  { id: 'parking', label: 'Parking' },
  { id: 'garden', label: 'Garden' },
  { id: 'elevator', label: 'Elevator' },
  { id: 'storage', label: 'Storage/Cellar' },
  { id: 'pool', label: 'Pool' },
  { id: 'terrace', label: 'Terrace' },
  { id: 'furnished', label: 'Furnished' },
  { id: 'new-build', label: 'New Build' },
  { id: 'renovated', label: 'Renovated' },
  { id: 'city-view', label: 'City View' },
] as const

export type FeatureId = (typeof FEATURE_OPTIONS)[number]['id']

/** Localized label for the "Highlights" section */
export const HIGHLIGHTS_LABEL: Record<Language, string> = {
  de: "Highlights",
  fr: "Points forts",
  en: "Highlights",
  lu: "Highlights",
}

/** Localized "Description" section label */
export const DESCRIPTION_LABEL: Record<Language, string> = {
  de: "Beschreibung",
  fr: "Description",
  en: "Description",
  lu: "Beschreiwung",
}

/**
 * Localized labels for property details (price | sqm | bedrooms | bathrooms).
 * Returns short forms suitable for inline display (PDF details bar, copy formats).
 */
export const PROPERTY_DETAIL_LABELS: Record<Language, { bedroom: (n: number) => string; bathroom: (n: number) => string }> = {
  de: {
    bedroom: (n) => (n === 1 ? "Schlafzimmer" : "Schlafzimmer"),
    bathroom: (n) => (n === 1 ? "Badezimmer" : "Badezimmer"),
  },
  fr: {
    bedroom: (n) => (n === 1 ? "chambre" : "chambres"),
    bathroom: (n) => (n === 1 ? "salle de bain" : "salles de bain"),
  },
  en: {
    bedroom: (n) => (n === 1 ? "bedroom" : "bedrooms"),
    bathroom: (n) => (n === 1 ? "bathroom" : "bathrooms"),
  },
  lu: {
    bedroom: (n) => (n === 1 ? "Schlofzëmmer" : "Schlofzëmmeren"),
    bathroom: (n) => (n === 1 ? "Buedzëmmer" : "Buedzëmmeren"),
  },
}
