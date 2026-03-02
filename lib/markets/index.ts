import type { Market, Neighborhood } from './types'
import { luxembourgMarket } from './lu'

const REGISTRY: Record<string, Market> = {
  lu: luxembourgMarket,
  // Adding Belgium later = add be.ts + one line: be: belgiumMarket
}

const ACTIVE = process.env.NEXT_PUBLIC_MARKET_ID ?? 'lu'

export function getActiveMarket(): Market {
  const market = REGISTRY[ACTIVE]
  if (!market) {
    throw new Error(`Unknown market: ${ACTIVE}. Available markets: ${Object.keys(REGISTRY).join(', ')}`)
  }
  return market
}

export function getNeighborhoodBySlug(slug: string): Neighborhood | null {
  const market = getActiveMarket()
  for (const area of market.areas) {
    const found = area.neighborhoods.find((n) => n.slug === slug)
    if (found) return found
  }
  return null
}

export function estimatePrice(slug: string, sqm: number): number | null {
  const neighborhood = getNeighborhoodBySlug(slug)
  if (!neighborhood) return null
  return Math.round(neighborhood.pricePerSqm.median * sqm)
}

export type { Market, Neighborhood } from './types'
