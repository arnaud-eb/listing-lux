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
  hashtags: {
    en: [
      '#LuxuryRealEstate',
      '#LuxembourgRealEstate',
      '#RealEstate',
      '#DreamHome',
      '#LuxuryHomes',
      '#LuxuryLiving',
      '#HomeForSale',
      '#PropertyForSale',
      '#Luxembourg',
    ],
    fr: [
      '#ImmobilierLuxembourg',
      '#ImmobilierDeLuxe',
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
      '#Luxusimmobilien',
      '#Eigenheim',
      '#Immobilieninvestment',
      '#Makler',
      '#Luxemburg',
    ],
  },
  propertyTypeHashtags: {
    apartment: {
      en: ['#LuxuryApartment'],
      fr: ['#AppartementDeLuxe', '#Appartement'],
      de: ['#Luxuswohnung', '#Wohnung'],
    },
    house: {
      en: ['#LuxuryHouse'],
      fr: ['#MaisonDeLuxe', '#Maison'],
      de: ['#Luxushaus', '#Haus'],
    },
    penthouse: {
      en: ['#Penthouse', '#LuxuryPenthouse'],
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
      en: ['#LuxuryVilla', '#Villa'],
      fr: ['#Villa'],
      de: ['#Villa'],
    },
  },
}
