import type { Language } from './types'

/**
 * Ordered list of supported AI-generation languages (used for tabs, badges, generation).
 *
 * Lëtzebuergesch was dropped after the 2026-04 audit (§5.P0.6): gpt-4.1-mini's LU output
 * scored native_quality 2.25 vs EN 4.18 and market_fit 2.50 vs FR 4.18 — a model-level
 * ceiling, not a prompt issue. Re-introduce post-MVP only with a different model for the
 * LU branch (Portuguese is the recommended next addition; ~16% of LU residents).
 */
export const LANGUAGES: Language[] = ['fr', 'en', 'de'] as const

/** Human-readable labels for each language */
export const LANGUAGE_LABELS: Record<Language, string> = {
  de: 'Deutsch',
  fr: 'Français',
  en: 'English',
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

/** Maximum photos allowed per listing. Generous on purpose — the photos are
 *  AI-analysis input for the listing copy, not a public gallery. Keep the
 *  `photoAnalysis` rate-limit window (lib/rate-limit.ts) above this. */
export const MAX_PHOTOS = 50

/** Maximum characters for regeneration comment */
export const MAX_COMMENT_LENGTH = 1000

/** Property types — single source of truth for the dropdown, schema, and AI derivation */
export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'loft', label: 'Loft' },
  { value: 'attic', label: 'Attic apartment' },
  { value: 'villa', label: 'Villa' },
] as const

/** Luxembourg energy passport (CPE) classes — the scale runs A+ (best) to I
 *  (worst). Per RGD 30 Nov 2007 (Guichet.lu). There is no 'A++'. */
export const CPE_CLASSES = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const
export type CpeClass = (typeof CPE_CLASSES)[number]

/** Listing transaction type. Drives copy register, CTA vocabulary, and legal disclosures. */
export const LISTING_KINDS = ['sale', 'rent'] as const
export type ListingKind = (typeof LISTING_KINDS)[number]

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number]['value']

/**
 * Localized labels for property types (display name on the listing page, PDF
 * metadata, etc.). Keyed by listing language; falls back to the capitalized id
 * if a type isn't covered in a given language.
 */
export const PROPERTY_TYPE_LABELS: Record<Language, Record<PropertyTypeValue, string>> = {
  de: {
    apartment: 'Wohnung',
    house: 'Haus',
    penthouse: 'Penthouse',
    studio: 'Studio',
    duplex: 'Maisonette',
    triplex: 'Triplex',
    loft: 'Loft',
    attic: 'Dachgeschosswohnung',
    villa: 'Villa',
  },
  fr: {
    apartment: 'Appartement',
    house: 'Maison',
    penthouse: 'Penthouse',
    studio: 'Studio',
    duplex: 'Duplex',
    triplex: 'Triplex',
    loft: 'Loft',
    attic: 'Logement sous combles',
    villa: 'Villa',
  },
  en: {
    apartment: 'Apartment',
    house: 'House',
    penthouse: 'Penthouse',
    studio: 'Studio',
    duplex: 'Duplex',
    triplex: 'Triplex',
    loft: 'Loft',
    attic: 'Attic apartment',
    villa: 'Villa',
  },
}

/**
 * French preposition exceptions for the "{type} {prep} {locality}" headline.
 * Default is "à". Localities whose French name carries an implicit article
 * (le Centre-Ville → au) need an override here.
 */
const FR_LOCALITY_PREPOSITION: Record<string, string> = {
  'centre-ville': 'au',
}

export function frPrepositionFor(slug: string): string {
  return FR_LOCALITY_PREPOSITION[slug] ?? 'à'
}

/** Localized display label for a property type, with a capitalize fallback for
 *  any value not covered in PROPERTY_TYPE_LABELS (defence against drift). */
export function propertyTypeLabel(type: string, language: Language): string {
  const labels = PROPERTY_TYPE_LABELS[language] as Record<string, string>
  return labels[type] ?? type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Selectable features — single source of truth for the chips, schema, and AI derivation.
 *
 * Storage split (audit P0.9, 2026-04): the ambiguous `storage` boolean was replaced with three
 * narrower flags so the model can't expand it into in-unit signals it never asserts ("ample storage",
 * "integrated wardrobes"):
 *   - `cellar`  → small storage room (FR `cave`, DE `Keller`); the LU-canonical case for apartments
 *   - `basement` → full sub-grade floor (houses with finished or usable basement, beyond a `cave`)
 *   - `attic`   → storage or unfinished attic (distinct from the `attic` PROPERTY_TYPES entry which
 *                 describes the whole unit, not a feature)
 *
 * Migration `012_split_storage_feature.sql` backfills `features.storage = true` → `features.cellar = true`.
 */
export const FEATURE_OPTIONS = [
  { id: 'balcony', label: 'Balcony' },
  { id: 'parking', label: 'Parking (open or shared spot)' },
  { id: 'garage', label: 'Garage (enclosed private parking)' },
  { id: 'garden', label: 'Garden' },
  { id: 'elevator', label: 'Elevator' },
  { id: 'cellar', label: 'Cellar (private storage room in the building)' },
  { id: 'basement', label: 'Basement (full sub-grade floor)' },
  { id: 'attic', label: 'Attic' },
  { id: 'pool', label: 'Pool' },
  { id: 'terrace', label: 'Terrace' },
  { id: 'furnished', label: 'Furnished' },
  { id: 'new-build', label: 'New Build' },
  { id: 'renovated', label: 'Renovated' },
  { id: 'city-view', label: 'City View' },
] as const

export type FeatureId = (typeof FEATURE_OPTIONS)[number]['id']

/**
 * Canonical photo-subject types. The AI vision step emits one of these ids
 * (photoAnalysisSchema.room_type); the create-page thumbnail translates the id
 * for display and the form syncs feature chips off it. Keeping the value a
 * stable id — never free text — is what lets feature-sync and the translated
 * label work regardless of the UI language.
 */
export const ROOM_TYPES = [
  'kitchen',
  'living-room',
  'dining-room',
  'bedroom',
  'bathroom',
  'hallway',
  'office',
  'balcony',
  'terrace',
  'garden',
  'pool',
  'garage',
  'parking',
  'cellar',
  'basement',
  'attic',
  'facade',
  'exterior',
  'floor-plan',
  'other',
] as const

export type RoomType = (typeof ROOM_TYPES)[number]

const ROOM_TYPE_SET = new Set<string>(ROOM_TYPES)

/** Coerce a possibly-legacy free-text room type to a canonical id. */
export function normalizeRoomType(raw: string | null | undefined): RoomType {
  if (!raw) return 'other'
  const slug = raw.trim().toLowerCase().replace(/[\s/]+/g, '-')
  return ROOM_TYPE_SET.has(slug) ? (slug as RoomType) : 'other'
}

/** Localized label for the "Highlights" section */
export const HIGHLIGHTS_LABEL: Record<Language, string> = {
  de: "Highlights",
  fr: "Points forts",
  en: "Highlights",
}

/** Localized "Description" section label */
export const DESCRIPTION_LABEL: Record<Language, string> = {
  de: "Beschreibung",
  fr: "Description",
  en: "Description",
}

/**
 * Localized labels for the building-details block (listing page card + PDF).
 * Keyed by listing language like the other label records, so the PDF — which
 * renders one page per language — can label each page in its own language.
 */
export const BUILDING_DETAIL_LABELS: Record<
  Language,
  {
    sectionTitle: string
    yearBuilt: string
    floorsTotal: string
    floorOfUnit: string
    groundFloor: string
    energyClass: string
    thermalClass: string
    monthlyCharges: string
    availableFrom: string
    forSale: string
    forRent: string
  }
> = {
  de: {
    sectionTitle: "Objektdetails",
    yearBuilt: "Baujahr",
    floorsTotal: "Etagen im Gebäude",
    floorOfUnit: "Etage",
    groundFloor: "Erdgeschoss",
    energyClass: "Energieklasse",
    thermalClass: "Wärmedämmklasse",
    monthlyCharges: "Nebenkosten / Monat",
    availableFrom: "Verfügbar ab",
    forSale: "Zu verkaufen",
    forRent: "Zu vermieten",
  },
  fr: {
    sectionTitle: "Détails du bien",
    yearBuilt: "Année de construction",
    floorsTotal: "Étages dans l'immeuble",
    floorOfUnit: "Étage",
    groundFloor: "Rez-de-chaussée",
    energyClass: "Classe énergétique",
    thermalClass: "Classe d'isolation thermique",
    monthlyCharges: "Charges / mois",
    availableFrom: "Disponible à partir du",
    forSale: "À vendre",
    forRent: "À louer",
  },
  en: {
    sectionTitle: "Building details",
    yearBuilt: "Year built",
    floorsTotal: "Floors in building",
    floorOfUnit: "Floor",
    groundFloor: "Ground floor",
    energyClass: "Energy class",
    thermalClass: "Thermal insulation class",
    monthlyCharges: "Monthly charges",
    availableFrom: "Available from",
    forSale: "For sale",
    forRent: "For rent",
  },
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
}
