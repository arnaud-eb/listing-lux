import { describe, it, expect } from 'vitest'
import { luxembourgMarket } from './lu'

describe('luxembourgMarket data integrity', () => {
  it('has correct market id and country code', () => {
    expect(luxembourgMarket.id).toBe('lu')
    expect(luxembourgMarket.countryCode).toBe('LU')
  })

  it('has all 4 supported languages', () => {
    expect(luxembourgMarket.supportedLanguages).toEqual(
      expect.arrayContaining(['de', 'fr', 'en', 'lu'])
    )
    expect(luxembourgMarket.supportedLanguages.length).toBe(4)
  })

  it('all neighborhoods have valid price ranges', () => {
    for (const area of luxembourgMarket.areas) {
      for (const n of area.neighborhoods) {
        expect(n.pricePerSqm.median, `${n.name} median`).toBeGreaterThan(0)
        expect(n.pricePerSqm.min, `${n.name} min < median`).toBeLessThan(n.pricePerSqm.median)
        expect(n.pricePerSqm.max, `${n.name} max > median`).toBeGreaterThan(n.pricePerSqm.median)
        expect(n.pricePerSqm.currency, `${n.name} currency`).toBe('EUR')
      }
    }
  })

  it('neighborhood slugs are URL-safe', () => {
    const slugs = luxembourgMarket.areas.flatMap((a) =>
      a.neighborhoods.map((n) => n.slug)
    )
    for (const slug of slugs) {
      expect(slug, `slug "${slug}" should be URL-safe`).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('neighborhood slugs are unique within a market', () => {
    const slugs = luxembourgMarket.areas.flatMap((a) =>
      a.neighborhoods.map((n) => n.slug)
    )
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('all neighborhoods have at least one tag', () => {
    for (const area of luxembourgMarket.areas) {
      for (const n of area.neighborhoods) {
        expect(n.tags.length, `${n.name} should have tags`).toBeGreaterThan(0)
      }
    }
  })

  it('has at least 8 neighborhoods', () => {
    const total = luxembourgMarket.areas.reduce(
      (sum, a) => sum + a.neighborhoods.length,
      0
    )
    expect(total).toBeGreaterThanOrEqual(8)
  })

  it('property types are defined', () => {
    expect(luxembourgMarket.propertyTypes.length).toBeGreaterThan(0)
  })

  it('all areas use sqm', () => {
    for (const area of luxembourgMarket.areas) {
      expect(area.areaUnit).toBe('sqm')
    }
  })
})
