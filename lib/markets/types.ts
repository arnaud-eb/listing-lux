export interface PriceRange {
  min: number
  max: number
  median: number
  currency: string
}

export interface Neighborhood {
  id: string
  name: string
  slug: string
  pricePerSqm: PriceRange
  tags: string[]
  descriptions?: Partial<Record<'de' | 'fr' | 'en' | 'lu', string>>
  keywords?: Partial<Record<'de' | 'fr' | 'en' | 'lu', string[]>>
}

export interface AreaData {
  id: string
  name: string
  neighborhoods: Neighborhood[]
  defaultCurrency: string
  locale: string
  areaUnit: 'sqm' | 'sqft'
}

export type HashtagsByLanguage = Partial<Record<'de' | 'fr' | 'en' | 'lu', string[]>>

export interface Market {
  id: string
  name: string
  countryCode: string
  areas: AreaData[]
  supportedLanguages: string[]
  propertyTypes: string[]
  features: string[]
  /** Curated base hashtags, per language, to seed every listing's social-media output. */
  hashtags: HashtagsByLanguage
  /** Per-property-type hashtag additions, per language. Key is property_type (e.g. 'apartment', 'house'). */
  propertyTypeHashtags: Record<string, HashtagsByLanguage>
}
