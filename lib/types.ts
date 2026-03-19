import type { PhotoAnalysis } from '@/lib/schemas/photo-analysis'

export type Language = 'de' | 'fr' | 'en' | 'lu'

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
  sqm: number
  price: number
  neighborhood: string
  property_type: string
  features: Record<string, boolean>
  photo_urls: string[]
  created_at: string
}

export interface Listing {
  id: string
  property_id: string
  language: Language
  title: string
  description: string
  highlights: string[]
  seo_keywords: string[]
  prompt_version?: string
  model?: string
}

export interface PropertyFormData {
  bedrooms: number
  bathrooms: number
  sqm: number
  price: number
  neighborhood: string
  property_type: string
  features: Record<string, boolean>
  photo_urls: string[]
  photo_analyses?: PhotoAnalysis[]
}
