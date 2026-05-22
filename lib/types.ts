import type { PhotoAnalysis } from '@/lib/schemas/photo-analysis'
import type { CpeClass, ListingKind } from '@/lib/constants'

export type Language = 'de' | 'fr' | 'en'

export type PhotoStatus = 'uploading' | 'processing' | 'ready' | 'error'

export type { PhotoAnalysis }

export interface ListingPhoto {
  id: string
  localPreviewUrl: string    // blob: URL for instant display
  supabasePath: string | null
  publicUrl: string | null
  status: PhotoStatus
  uploadProgress: number
  aiAnalysis: PhotoAnalysis | null
}

export interface Property {
  id: string
  bedrooms: number
  bathrooms: number
  sqm: number | null
  price: number | null
  neighborhood: string
  property_type: string
  features: Record<string, boolean>
  photo_urls: string[]
  address?: string | null
  created_at: string
  /** Sale or rental. DB column is NOT NULL DEFAULT 'sale'; optional here only
   *  for tolerance of old in-memory mocks. */
  listing_kind?: ListingKind
  cpe_class?: CpeClass | null
  thermal_insulation_class?: CpeClass | null
  year_built?: number | null
  charges_monthly?: number | null
  floors_total?: number | null
  floor_of_unit?: number | null
  /** ISO YYYY-MM-DD; rentals only. */
  availability_date?: string | null
}

export interface Highlight {
  text: string
  icon: string   // Lucide icon name (e.g. "sofa", "trees", "car")
}

export interface Listing {
  id: string
  property_id: string
  language: Language
  title: string
  description: string
  highlights: Highlight[]
  hashtags: string[]
  prompt_version?: string
  model?: string
}

export interface ListingUpdates {
  title?: string;
  description?: string;
  highlights?: Highlight[];
  hashtags?: string[];
}

export interface AgentProfile {
  id: string
  full_name: string
  agency_name?: string | null
  phone?: string | null
  email: string
  logo_url?: string | null
  agency_address?: string | null
  agency_website?: string | null
}

export interface PropertyFormData {
  bedrooms: number
  bathrooms: number
  sqm?: number | null
  price?: number | null
  neighborhood: string
  property_type: string
  features: Record<string, boolean>
  photo_urls: string[]
  photo_analyses?: PhotoAnalysis[]
  address?: string | null
  listing_kind?: ListingKind
  cpe_class?: CpeClass | null
  thermal_insulation_class?: CpeClass | null
  year_built?: number | null
  charges_monthly?: number | null
  floors_total?: number | null
  floor_of_unit?: number | null
  /** ISO YYYY-MM-DD; rentals only. */
  availability_date?: string | null
}
