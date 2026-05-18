import { describe, it, expect } from 'vitest'
import { luxembourgMarket } from './lu'

describe('luxembourgMarket data integrity', () => {
  it('has correct market id and country code', () => {
    expect(luxembourgMarket.id).toBe('lu')
    expect(luxembourgMarket.countryCode).toBe('LU')
  })

  it('has 3 supported languages (LU dropped post-audit)', () => {
    expect(luxembourgMarket.supportedLanguages).toEqual(
      expect.arrayContaining(['de', 'fr', 'en'])
    )
    expect(luxembourgMarket.supportedLanguages).not.toContain('lu')
    expect(luxembourgMarket.supportedLanguages.length).toBe(3)
  })

  it('property types are defined', () => {
    expect(luxembourgMarket.propertyTypes.length).toBeGreaterThan(0)
  })

  it('hashtags are defined for every supported language', () => {
    for (const lang of luxembourgMarket.supportedLanguages) {
      const tags = luxembourgMarket.hashtags[lang as 'de' | 'fr' | 'en']
      expect(tags, `${lang} hashtags`).toBeDefined()
      expect(tags?.length, `${lang} hashtags non-empty`).toBeGreaterThan(0)
    }
  })

  // Locality data integrity (slugs, prices, tags, count) is exercised by
  // scripts/seed-localities.test.ts against data/lu-localities.json — the
  // canonical source after Phase 4.
})
