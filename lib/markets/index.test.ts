import { describe, it, expect, afterEach, vi } from 'vitest'
import { getActiveMarket } from './index'

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
    expect(market.supportedLanguages).not.toContain('lu')
  })

  it('returns market with features and property types', () => {
    const market = getActiveMarket()
    expect(market.features.length).toBeGreaterThan(0)
    expect(market.propertyTypes.length).toBeGreaterThan(0)
  })
})

// getNeighborhoodBySlug + the legacy estimatePrice live in lib/markets/server.ts
// (server-only). Their behavior is covered by lib/localities/repository
// (the DB-backed source) and lib/localities/locale tests; the thin Locality →
// Neighborhood shape converter in server.ts is exercised by route + audit
// integration paths and will be deleted in Phase 4 with the rest of the facade.
