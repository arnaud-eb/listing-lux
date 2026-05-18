import type { Market } from './types'
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

/**
 * Build the curated base hashtag set for a listing: market base + property-type +
 * neighborhood-derived. Returned normalized (always leading `#`, deduped).
 *
 * Caller passes the resolved neighborhood NAME (not the slug) — keeps this a
 * pure function callable from both client and server. Server-side callers
 * resolve via `await getNeighborhoodBySlug(slug)` from `@/lib/markets/server`;
 * client-side callers receive the name as a prop threaded from the parent
 * server component.
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

export type { Market } from './types'
