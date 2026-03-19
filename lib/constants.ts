import type { Language } from './types'

/** Ordered list of supported languages (used for tabs, badges, generation) */
export const LANGUAGES: Language[] = ['de', 'fr', 'en', 'lu'] as const

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
