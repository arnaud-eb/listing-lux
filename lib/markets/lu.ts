import type { Market } from './types'

// Locality data lives in the Supabase `localities` table (seeded from
// data/lu-localities.json); consumers read it via lib/localities/repository.ts.
// This file owns only the static per-country metadata that doesn't fit DB rows
// well — hashtag seed sets, supported languages, the property-type vocabulary.
export const luxembourgMarket: Market = {
  id: 'lu',
  name: 'Luxembourg',
  countryCode: 'LU',
  supportedLanguages: ['de', 'fr', 'en'],
  propertyTypes: ['apartment', 'house', 'penthouse', 'studio', 'duplex', 'villa'],
  features: [
    'balcony',
    'parking',
    'garden',
    'elevator',
    'cellar',
    'basement',
    'attic',
    'pool',
    'terrace',
    'furnished',
    'new-build',
    'renovated',
    'city-view',
  ],
  // Curated base hashtags — high-volume and non-luxury. A hardcoded "luxury"
  // tag misfits entry-tier listings (a studio in Bonnevoie is not #LuxuryApartment).
  hashtags: {
    en: [
      '#RealEstate',
      '#LuxembourgRealEstate',
      '#HouseHunting',
      '#DreamHome',
      '#NewHome',
      '#HomeSweetHome',
      '#HomeForSale',
      '#PropertyForSale',
      '#Luxembourg',
    ],
    fr: [
      '#ImmobilierLuxembourg',
      '#BienImmobilier',
      '#Immobilier',
      '#Immo',
      '#AgentImmobilier',
      '#AgenceImmobiliere',
      '#InvestissementImmobilier',
      '#Luxembourg',
    ],
    de: [
      '#ImmobilienLuxemburg',
      '#Immobilien',
      '#Immobilienmakler',
      '#Traumhaus',
      '#Eigenheim',
      '#Immobilieninvestment',
      '#Makler',
      '#Luxemburg',
    ],
  },
  propertyTypeHashtags: {
    apartment: {
      en: ['#Apartment'],
      fr: ['#Appartement'],
      de: ['#Wohnung'],
    },
    house: {
      en: ['#House'],
      fr: ['#Maison'],
      de: ['#Haus'],
    },
    penthouse: {
      en: ['#Penthouse'],
      fr: ['#Penthouse'],
      de: ['#Penthouse'],
    },
    studio: {
      en: ['#Studio'],
      fr: ['#Studio'],
      de: ['#Studio'],
    },
    duplex: {
      en: ['#Duplex'],
      fr: ['#Duplex'],
      de: ['#Duplex'],
    },
    villa: {
      en: ['#Villa'],
      fr: ['#Villa'],
      de: ['#Villa'],
    },
  },
}
