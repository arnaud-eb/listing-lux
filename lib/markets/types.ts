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
}

export interface AreaData {
  id: string
  name: string
  neighborhoods: Neighborhood[]
  defaultCurrency: string
  locale: string
  areaUnit: 'sqm' | 'sqft'
}

export interface Market {
  id: string
  name: string
  countryCode: string
  areas: AreaData[]
  supportedLanguages: string[]
  propertyTypes: string[]
  features: string[]
}
