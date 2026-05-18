import type { Language } from '@/lib/types'

export type LocalityKind =
  | 'country'
  | 'region'
  | 'canton'
  | 'commune'
  | 'quartier'
  | 'sub_quartier'

export type LocalizedString = Partial<Record<Language | 'lu', string>>
export type LocalizedKeywords = Partial<Record<Language | 'lu', string[]>>

export interface PriceBand {
  medianPerSqm: number
  minPerSqm: number
  maxPerSqm: number
  source: 'override' | 'tier'
}

export interface LocalityParent {
  id: string
  slug: string
  name: string
  nameLocalized: LocalizedString
}

export interface Locality {
  id: string
  slug: string
  countryCode: string
  kind: LocalityKind
  name: string
  nameLocalized: LocalizedString
  descriptionLocalized: LocalizedString
  keywordsLocalized: LocalizedKeywords
  tags: string[]
  parent: LocalityParent | null
  price: PriceBand | null
}

export type LocalityOption =
  | {
      kind: 'commune'
      slug: string
      nameLocalized: LocalizedString
      parent: { slug: string; nameLocalized: LocalizedString } | null
      price: PriceBand | null
    }
  | {
      kind: 'quartier' | 'sub_quartier'
      slug: string
      nameLocalized: LocalizedString
      parent: { slug: string; nameLocalized: LocalizedString }
      price: PriceBand | null
    }
