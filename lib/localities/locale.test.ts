import { describe, expect, it } from 'vitest'
import { pickLocalized } from './locale'

describe('pickLocalized', () => {
  it('returns the value for the requested locale when present', () => {
    expect(pickLocalized({ fr: 'Localité', en: 'Locality', de: 'Ortschaft' }, 'fr')).toBe('Localité')
    expect(pickLocalized({ fr: 'Localité', en: 'Locality', de: 'Ortschaft' }, 'en')).toBe('Locality')
    expect(pickLocalized({ fr: 'Localité', en: 'Locality', de: 'Ortschaft' }, 'de')).toBe('Ortschaft')
  })

  it('cascades requested → fr → en → de', () => {
    expect(pickLocalized({ en: 'EN', de: 'DE' }, 'fr')).toBe('EN')
    expect(pickLocalized({ de: 'DE' }, 'fr')).toBe('DE')
    expect(pickLocalized({ de: 'DE' }, 'en')).toBe('DE')
  })

  it('does not pick the requested locale twice in the cascade', () => {
    expect(pickLocalized({ en: 'EN' }, 'en')).toBe('EN')
  })

  it('falls back to any non-empty value when the FR/EN/DE chain is empty', () => {
    expect(pickLocalized({ lu: 'Stroossen' }, 'fr')).toBe('Stroossen')
  })

  it('humanizes the fallback slug when nothing matches and a slug is given', () => {
    expect(pickLocalized({}, 'fr', 'esch-sur-alzette')).toBe('Esch Sur Alzette')
    expect(pickLocalized({}, 'fr', 'bertrange')).toBe('Bertrange')
    expect(pickLocalized(undefined, 'fr', 'kirchberg')).toBe('Kirchberg')
  })

  it('returns empty string when nothing matches and no fallback slug given', () => {
    expect(pickLocalized({}, 'fr')).toBe('')
    expect(pickLocalized(null, 'fr')).toBe('')
    expect(pickLocalized(undefined, 'fr')).toBe('')
  })

  it('ignores empty string values during cascade', () => {
    expect(pickLocalized({ fr: '', en: 'EN' }, 'fr')).toBe('EN')
  })
})
