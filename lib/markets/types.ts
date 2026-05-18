export type HashtagsByLanguage = Partial<Record<'de' | 'fr' | 'en', string[]>>

export interface Market {
  id: string
  name: string
  countryCode: string
  supportedLanguages: string[]
  propertyTypes: string[]
  features: string[]
  /** Curated base hashtags, per language, to seed every listing's social-media output. */
  hashtags: HashtagsByLanguage
  /** Per-property-type hashtag additions, per language. Key is property_type (e.g. 'apartment', 'house'). */
  propertyTypeHashtags: Record<string, HashtagsByLanguage>
}
