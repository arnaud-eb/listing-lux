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

export type { Market, Neighborhood } from './types'
