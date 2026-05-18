import type { Market, Neighborhood } from './types'
import { luxembourgMarket } from './lu'
import { getBySlug as getLocalityBySlug } from '@/lib/localities/repository'
import type { Locality } from '@/lib/localities/types'

const REGISTRY: Record<string, Market> = {
  lu: luxembourgMarket,
  // Adding Belgium later = add be.ts + one line: be: belgiumMarket
}

const ACTIVE = process.env.NEXT_PUBLIC_MARKET_ID ?? 'lu'

// Pre-built index: slug → Neighborhood (avoids O(areas×neighborhoods) lookup)
let neighborhoodIndex: Map<string, Neighborhood> | null = null

function getNeighborhoodIndex(): Map<string, Neighborhood> {
  if (!neighborhoodIndex) {
    const market = getActiveMarket()
    neighborhoodIndex = new Map(
      market.areas.flatMap((a) => a.neighborhoods.map((n) => [n.slug, n]))
    )
  }
  return neighborhoodIndex
}

export function getActiveMarket(): Market {
  const market = REGISTRY[ACTIVE]
  if (!market) {
    throw new Error(`Unknown market: ${ACTIVE}. Available markets: ${Object.keys(REGISTRY).join(', ')}`)
  }
  return market
}

// Phase 2 bridge: getNeighborhoodBySlug queries DB-first via lib/localities,
// falls back to the legacy lu.ts areas[] map on miss or DB failure. Returns the
// existing Neighborhood shape so callers don't need to know which source served
// the row. Phase 4 will delete this wrapper and have consumers depend on
// lib/localities directly.
export async function getNeighborhoodBySlug(slug: string): Promise<Neighborhood | null> {
  try {
    const fromDb = await getLocalityBySlug(slug, getActiveMarket().countryCode)
    if (fromDb) return localityToNeighborhood(fromDb)
  } catch (err) {
    console.warn(`getNeighborhoodBySlug: DB lookup for "${slug}" failed, falling back to lu.ts (${(err as Error).message})`)
  }
  return getNeighborhoodIndex().get(slug) ?? null
}

// Sync price estimate against the legacy lu.ts areas[] map. Used only by
// NeighborhoodSelector (the create-page dropdown), which Phase 3 replaces with
// a DB-backed LocalitySelector that reads the median directly from the fetched
// LocalityOption. Deleted in Phase 4 alongside the rest of the facade.
export function estimatePrice(slug: string, sqm: number): number | null {
  const neighborhood = getNeighborhoodIndex().get(slug)
  if (!neighborhood) return null
  return Math.round(neighborhood.pricePerSqm.median * sqm)
}

function pickLanguageMap(value: Partial<Record<string, string>>): Partial<Record<'de' | 'fr' | 'en', string>> {
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

/**
 * Build the curated base hashtag set for a listing: market base + property-type +
 * neighborhood-derived. Returned normalized (always leading `#`, deduped).
 *
 * Caller passes the resolved neighborhood NAME (not the slug) — keeps this a
 * pure function. Phase 2 bridge: server-side callers resolve via
 * `await getNeighborhoodBySlug(slug)`; client-side callers receive the name as
 * a prop threaded from the parent server component.
 */
export function buildBaseHashtags(input: {
  language: 'de' | 'fr' | 'en'
  propertyType: string
  neighborhoodName: string | null
}): string[] {
  const market = getActiveMarket()
  const base = market.hashtags[input.language] ?? market.hashtags.en ?? []
  const propertyTypeSet = market.propertyTypeHashtags[input.propertyType]
  const byType = propertyTypeSet?.[input.language] ?? propertyTypeSet?.en ?? []

  const neighborhoodTag = input.neighborhoodName
    ? `#${input.neighborhoodName.replace(/[\s'-]/g, '')}`
    : null

  const all = [...base, ...byType, ...(neighborhoodTag ? [neighborhoodTag] : [])]
  return dedupeHashtags(all)
}

/** Normalize & dedupe hashtags: ensure leading #, trim, drop empties, case-insensitive unique. */
export function dedupeHashtags(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    const trimmed = raw?.trim()
    if (!trimmed) continue
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    const key = withHash.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(withHash)
  }
  return out
}

export type { Market, Neighborhood } from './types'
