import type { Market, Neighborhood } from './types'
import { luxembourgMarket } from './lu'

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

export function getNeighborhoodBySlug(slug: string): Neighborhood | null {
  return getNeighborhoodIndex().get(slug) ?? null
}

export function estimatePrice(slug: string, sqm: number): number | null {
  const neighborhood = getNeighborhoodBySlug(slug)
  if (!neighborhood) return null
  return Math.round(neighborhood.pricePerSqm.median * sqm)
}

/**
 * Build the curated base hashtag set for a listing: market base + property-type +
 * neighborhood-derived. Returned normalized (always leading `#`, deduped).
 */
export function buildBaseHashtags(input: {
  language: 'de' | 'fr' | 'en'
  propertyType: string
  neighborhood: string
}): string[] {
  const market = getActiveMarket()
  const base = market.hashtags[input.language] ?? market.hashtags.en ?? []
  const propertyTypeSet = market.propertyTypeHashtags[input.propertyType]
  const byType = propertyTypeSet?.[input.language] ?? propertyTypeSet?.en ?? []

  const neighborhoodSlug = input.neighborhood?.trim()
  const neighborhood = neighborhoodSlug ? getNeighborhoodBySlug(neighborhoodSlug) : null
  const neighborhoodTag = neighborhood
    ? `#${neighborhood.name.replace(/[\s'-]/g, '')}`
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
