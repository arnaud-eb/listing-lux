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
  /** Representative €/m²: a STATEC mean for source 'statec', the band centre otherwise. */
  medianPerSqm: number
  /** Null for a 'statec' point value — STATEC publishes a single mean, no spread. */
  minPerSqm: number | null
  maxPerSqm: number | null
  source: 'statec' | 'override' | 'tier'
  /** ISO date the underlying data is as of (the locality row's, or the tier's). */
  dataAsOf: string | null
}

export interface LocalityPrice {
  apartment: PriceBand | null
  house: PriceBand | null
}

/** Which LocalityPrice band a property type draws from. STATEC splits asking
 *  prices into apartments vs houses; everything flat-shaped (studio, duplex,
 *  penthouse) calibrates against the apartment band. */
export function isHouseType(propertyType: string): boolean {
  const t = propertyType.toLowerCase()
  return t === 'house' || t === 'villa'
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
  price: LocalityPrice | null
}

export type LocalityOption =
  | {
      kind: 'commune'
      slug: string
      nameLocalized: LocalizedString
      parent: { slug: string; nameLocalized: LocalizedString } | null
      price: LocalityPrice | null
    }
  | {
      kind: 'quartier' | 'sub_quartier'
      slug: string
      nameLocalized: LocalizedString
      parent: { slug: string; nameLocalized: LocalizedString }
      price: LocalityPrice | null
    }
