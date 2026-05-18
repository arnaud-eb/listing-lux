import 'server-only'

import { getActiveMarket } from './index'
import type { Market, Neighborhood } from './types'
import { luxembourgMarket } from './lu'
import { getBySlug as getLocalityBySlug } from '@/lib/localities/repository'
import type { Locality, LocalizedString } from '@/lib/localities/types'

// Lazy fallback index — same data structure as the legacy lu.ts areas[] map,
// rebuilt here so this server module doesn't share mutable state with the
// client-safe lib/markets/index.ts. Phase 4 will delete the fallback entirely.
let fallbackIndex: Map<string, Neighborhood> | null = null
function getFallbackIndex(market: Market): Map<string, Neighborhood> {
  if (!fallbackIndex) {
    fallbackIndex = new Map(
      market.areas.flatMap((a) => a.neighborhoods.map((n) => [n.slug, n])),
    )
  }
  return fallbackIndex
}

// Phase 2 bridge: getNeighborhoodBySlug queries the DB-backed lib/localities
// first, falls back to the legacy luxembourgMarket areas[] map on miss or DB
// failure. Returns the existing Neighborhood shape so prompt/audit callers
// stay drop-in. Phase 4 will delete this and have those callers depend on
// lib/localities directly.
export async function getNeighborhoodBySlug(slug: string): Promise<Neighborhood | null> {
  try {
    const fromDb = await getLocalityBySlug(slug, getActiveMarket().countryCode)
    if (fromDb) return localityToNeighborhood(fromDb)
  } catch (err) {
    console.warn(`getNeighborhoodBySlug: DB lookup for "${slug}" failed, falling back to lu.ts (${(err as Error).message})`)
  }
  return getFallbackIndex(luxembourgMarket).get(slug) ?? null
}

function pickLanguageMap(value: LocalizedString): Partial<Record<'de' | 'fr' | 'en', string>> {
  const out: Partial<Record<'de' | 'fr' | 'en', string>> = {}
  if (value.de) out.de = value.de
  if (value.fr) out.fr = value.fr
  if (value.en) out.en = value.en
  return out
}

function pickLanguageKeywords(value: Partial<Record<string, string[]>>): Partial<Record<'de' | 'fr' | 'en', string[]>> {
  const out: Partial<Record<'de' | 'fr' | 'en', string[]>> = {}
  if (value.de) out.de = value.de
  if (value.fr) out.fr = value.fr
  if (value.en) out.en = value.en
  return out
}

function localityToNeighborhood(locality: Locality): Neighborhood {
  const price = locality.price
  return {
    id: locality.slug,
    name: locality.name,
    slug: locality.slug,
    pricePerSqm: price
      ? {
          min: price.minPerSqm,
          max: price.maxPerSqm,
          median: price.medianPerSqm,
          currency: 'EUR',
        }
      : { min: 0, max: 0, median: 0, currency: 'EUR' },
    tags: locality.tags,
    descriptions: pickLanguageMap(locality.descriptionLocalized),
    keywords: pickLanguageKeywords(locality.keywordsLocalized),
  }
}
