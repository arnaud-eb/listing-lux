import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getActiveMarket, getNeighborhoodBySlug, estimatePrice } from './index'

describe('estimatePrice', () => {
  it('returns median × sqm for known neighborhood', () => {
    // kirchberg median is 11000, so 100sqm = 1,100,000
    expect(estimatePrice('kirchberg', 100)).toBe(1_100_000)
  })

  it('returns null for unknown neighborhood', () => {
    expect(estimatePrice('unknown-slug', 100)).toBeNull()
  })

  it('handles fractional sqm', () => {
    expect(estimatePrice('belair', 50)).toBe(50 * 10500)
  })

  it('returns 0 for 0 sqm', () => {
    expect(estimatePrice('kirchberg', 0)).toBe(0)
  })
})

describe('getNeighborhoodBySlug', () => {
  it('finds neighborhood by slug', () => {
    const n = getNeighborhoodBySlug('kirchberg')
    expect(n).not.toBeNull()
    expect(n?.name).toBe('Kirchberg')
    expect(n?.slug).toBe('kirchberg')
  })

  it('returns null for missing slug', () => {
    expect(getNeighborhoodBySlug('does-not-exist')).toBeNull()
  })

  it('finds all expected Luxembourg neighborhoods', () => {
    const slugs = ['kirchberg', 'belair', 'limpertsberg', 'merl', 'hollerich', 'bonnevoie', 'centre-ville']
    for (const slug of slugs) {
      expect(getNeighborhoodBySlug(slug), `should find ${slug}`).not.toBeNull()
    }
  })
})

describe('getActiveMarket', () => {
  const originalEnv = process.env.NEXT_PUBLIC_MARKET_ID

  afterEach(() => {
    process.env.NEXT_PUBLIC_MARKET_ID = originalEnv
    vi.resetModules()
  })

  it('returns luxembourg market by default', () => {
    const market = getActiveMarket()
    expect(market.id).toBe('lu')
    expect(market.countryCode).toBe('LU')
  })

  it('returns market with supported languages', () => {
    const market = getActiveMarket()
    expect(market.supportedLanguages).toContain('de')
    expect(market.supportedLanguages).toContain('fr')
    expect(market.supportedLanguages).toContain('en')
    expect(market.supportedLanguages).toContain('lu')
  })

  it('returns market with areas', () => {
    const market = getActiveMarket()
    expect(market.areas.length).toBeGreaterThan(0)
    expect(market.areas[0].neighborhoods.length).toBeGreaterThan(0)
  })
})
