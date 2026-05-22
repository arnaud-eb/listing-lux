import { describe, it, expect } from 'vitest'
import { resolvePrice, parentPriceOf, type PriceInputs } from './price'

function inputs(over: Partial<PriceInputs> = {}): PriceInputs {
  return {
    price_per_sqm_min: null,
    price_per_sqm_median: null,
    price_per_sqm_max: null,
    asking_price_per_sqm_apt: null,
    asking_price_per_sqm_house: null,
    data_as_of: '2026-03-26',
    price_tiers: null,
    ...over,
  }
}

const TIER = {
  price_per_sqm_min: 4000,
  price_per_sqm_median: 5500,
  price_per_sqm_max: 7500,
  data_as_of: '2026-01-01',
}

describe('resolvePrice', () => {
  it('returns null when the row and parent carry no price', () => {
    expect(resolvePrice(inputs(), null)).toBeNull()
  })

  it('uses the STATEC mean per type, as a no-spread point band', () => {
    const p = resolvePrice(
      inputs({ asking_price_per_sqm_apt: 12000, asking_price_per_sqm_house: 8000 }),
      null,
    )
    expect(p?.apartment).toEqual({
      medianPerSqm: 12000,
      minPerSqm: null,
      maxPerSqm: null,
      source: 'statec',
      dataAsOf: '2026-03-26',
    })
    expect(p?.house?.medianPerSqm).toBe(8000)
  })

  it('STATEC beats the hand-curated band and the tier', () => {
    const p = resolvePrice(
      inputs({
        asking_price_per_sqm_apt: 12000,
        price_per_sqm_min: 5000,
        price_per_sqm_median: 6000,
        price_per_sqm_max: 7000,
        price_tiers: TIER,
      }),
      null,
    )
    expect(p?.apartment).toMatchObject({ source: 'statec', medianPerSqm: 12000 })
  })

  it('falls to the hand-curated override band when STATEC is absent', () => {
    const p = resolvePrice(
      inputs({
        price_per_sqm_min: 5000,
        price_per_sqm_median: 6000,
        price_per_sqm_max: 7000,
      }),
      null,
    )
    expect(p?.apartment).toEqual({
      medianPerSqm: 6000,
      minPerSqm: 5000,
      maxPerSqm: 7000,
      source: 'override',
      dataAsOf: '2026-03-26',
    })
  })

  it('falls to the tier when there is no STATEC, override, or parent', () => {
    const p = resolvePrice(inputs({ price_tiers: TIER }), null)
    expect(p?.apartment).toMatchObject({ source: 'tier', medianPerSqm: 5500 })
  })

  it("carries each band's data_as_of through — locality row's, or the tier's", () => {
    const statec = resolvePrice(
      inputs({ asking_price_per_sqm_apt: 12000, data_as_of: '2026-03-26' }),
      null,
    )
    expect(statec?.apartment?.dataAsOf).toBe('2026-03-26')
    const tiered = resolvePrice(inputs({ price_tiers: TIER }), null)
    expect(tiered?.apartment?.dataAsOf).toBe('2026-01-01')
  })

  it('inherits the parent price when the row has no data of its own', () => {
    const parent = parentPriceOf(
      inputs({ asking_price_per_sqm_apt: 12000, asking_price_per_sqm_house: 8000 }),
    )
    const p = resolvePrice(inputs(), parent)
    expect(p?.apartment).toMatchObject({ source: 'statec', medianPerSqm: 12000 })
    expect(p?.house?.medianPerSqm).toBe(8000)
  })

  it("prefers the parent's real data over the row's own tier", () => {
    const parent = parentPriceOf(inputs({ asking_price_per_sqm_apt: 12000 }))
    const p = resolvePrice(inputs({ price_tiers: TIER }), parent)
    expect(p?.apartment).toMatchObject({ source: 'statec', medianPerSqm: 12000 })
    // parent has no house price → the row's own tier fills the house band
    expect(p?.house).toMatchObject({ source: 'tier' })
  })

  it("keeps the row's own tier over a parent that itself only has a tier", () => {
    const parentTier = { ...TIER, price_per_sqm_median: 9000 }
    const parent = parentPriceOf(inputs({ price_tiers: parentTier }))
    const p = resolvePrice(inputs({ price_tiers: TIER }), parent)
    // own tier (5500) wins — an inherited tier must not displace a deliberate one
    expect(p?.apartment).toMatchObject({ source: 'tier', medianPerSqm: 5500 })
  })

  it('resolves each type independently when STATEC suppressed one', () => {
    const parent = parentPriceOf(inputs({ asking_price_per_sqm_house: 8000 }))
    const p = resolvePrice(inputs({ asking_price_per_sqm_apt: 12000 }), parent)
    expect(p?.apartment).toMatchObject({ source: 'statec', medianPerSqm: 12000 })
    expect(p?.house?.medianPerSqm).toBe(8000) // inherited from parent
  })
})

describe('parentPriceOf', () => {
  it('returns null for a missing parent', () => {
    expect(parentPriceOf(null)).toBeNull()
    expect(parentPriceOf(undefined)).toBeNull()
  })
})
