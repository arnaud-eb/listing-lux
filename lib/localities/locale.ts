import type { Language } from '@/lib/types'
import type { LocalizedString } from './types'

const FALLBACK_CASCADE: Language[] = ['fr', 'en', 'de']

export function pickLocalized(
  value: LocalizedString | undefined | null,
  locale: Language,
  fallbackSlug?: string,
): string {
  if (value) {
    const cascade = [locale, ...FALLBACK_CASCADE.filter((l) => l !== locale)]
    for (const key of cascade) {
      const v = value[key]
      if (v) return v
    }
    for (const v of Object.values(value)) {
      if (v) return v
    }
  }
  return fallbackSlug ? humanizeSlug(fallbackSlug) : ''
}

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => (part.length === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join(' ')
}
