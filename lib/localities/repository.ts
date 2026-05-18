import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase.server'
import { LOCALITIES_CACHE_TAG } from './cache'
import type {
  Locality,
  LocalityKind,
  LocalityOption,
  LocalityParent,
  PriceBand,
} from './types'

const DROPDOWN_KINDS = new Set<LocalityKind>(['commune', 'quartier', 'sub_quartier'])

interface PriceTierRow {
  price_per_sqm_min: number | null
  price_per_sqm_median: number | null
  price_per_sqm_max: number | null
}

interface LocalityRow {
  id: string
  slug: string
  country_code: string
  kind: LocalityKind
  name: string
  name_localized: Record<string, string> | null
  description_localized: Record<string, string> | null
  keywords_localized: Record<string, string[]> | null
  tags: string[] | null
  parent_id: string | null
  price_per_sqm_min: number | null
  price_per_sqm_median: number | null
  price_per_sqm_max: number | null
  price_tiers: PriceTierRow | null
}

const SELECT_LOCALITY = `
  id, slug, country_code, kind, name,
  name_localized, description_localized, keywords_localized, tags,
  parent_id,
  price_per_sqm_min, price_per_sqm_median, price_per_sqm_max,
  price_tiers ( price_per_sqm_min, price_per_sqm_median, price_per_sqm_max )
`

function resolvePrice(row: LocalityRow): PriceBand | null {
  if (
    row.price_per_sqm_median != null &&
    row.price_per_sqm_min != null &&
    row.price_per_sqm_max != null
  ) {
    return {
      medianPerSqm: Number(row.price_per_sqm_median),
      minPerSqm: Number(row.price_per_sqm_min),
      maxPerSqm: Number(row.price_per_sqm_max),
      source: 'override',
    }
  }
  const tier = row.price_tiers
  if (
    tier?.price_per_sqm_median != null &&
    tier?.price_per_sqm_min != null &&
    tier?.price_per_sqm_max != null
  ) {
    return {
      medianPerSqm: Number(tier.price_per_sqm_median),
      minPerSqm: Number(tier.price_per_sqm_min),
      maxPerSqm: Number(tier.price_per_sqm_max),
      source: 'tier',
    }
  }
  return null
}

function toLocality(row: LocalityRow, parent: LocalityParent | null): Locality {
  return {
    id: row.id,
    slug: row.slug,
    countryCode: row.country_code,
    kind: row.kind,
    name: row.name,
    nameLocalized: row.name_localized ?? {},
    descriptionLocalized: row.description_localized ?? {},
    keywordsLocalized: row.keywords_localized ?? {},
    tags: row.tags ?? [],
    parent,
    price: resolvePrice(row),
  }
}

function toLocalityOption(row: LocalityRow, parent: LocalityParent | null): LocalityOption | null {
  const price = resolvePrice(row)
  const nameLocalized = row.name_localized ?? {}
  if (row.kind === 'commune') {
    return {
      kind: 'commune',
      slug: row.slug,
      nameLocalized,
      parent: parent
        ? { slug: parent.slug, nameLocalized: parent.nameLocalized }
        : null,
      price,
    }
  }
  if (row.kind === 'quartier' || row.kind === 'sub_quartier') {
    if (!parent) return null
    return {
      kind: row.kind,
      slug: row.slug,
      nameLocalized,
      parent: { slug: parent.slug, nameLocalized: parent.nameLocalized },
      price,
    }
  }
  return null
}

async function _getBySlug(slug: string, countryCode = 'LU'): Promise<Locality | null> {
  const sb = createServiceClient()
  const { data, error } = await sb
    .from('localities')
    .select(SELECT_LOCALITY)
    .eq('country_code', countryCode)
    .eq('slug', slug)
    .maybeSingle<LocalityRow>()
  if (error) throw new Error(`getBySlug(${slug}): ${error.message}`)
  if (!data) return null

  let parent: LocalityParent | null = null
  if (data.parent_id) {
    const { data: p, error: pErr } = await sb
      .from('localities')
      .select('id, slug, name, name_localized')
      .eq('id', data.parent_id)
      .maybeSingle<{ id: string; slug: string; name: string; name_localized: Record<string, string> | null }>()
    if (pErr) throw new Error(`getBySlug parent lookup: ${pErr.message}`)
    parent = p
      ? { id: p.id, slug: p.slug, name: p.name, nameLocalized: p.name_localized ?? {} }
      : null
  }
  return toLocality(data, parent)
}

export const getBySlug = cache(_getBySlug)

export const getBySlugs = cache(async (
  slugs: string[],
  countryCode = 'LU',
): Promise<Map<string, Locality>> => {
  const out = new Map<string, Locality>()
  if (slugs.length === 0) return out
  const sb = createServiceClient()
  const { data, error } = await sb
    .from('localities')
    .select(SELECT_LOCALITY)
    .eq('country_code', countryCode)
    .in('slug', slugs)
    .returns<LocalityRow[]>()
  if (error) throw new Error(`getBySlugs: ${error.message}`)
  if (!data || data.length === 0) return out

  const parentIds = [...new Set(data.map((r) => r.parent_id).filter((id): id is string => !!id))]
  const parentsById = new Map<string, LocalityParent>()
  if (parentIds.length > 0) {
    const { data: parents, error: pErr } = await sb
      .from('localities')
      .select('id, slug, name, name_localized')
      .in('id', parentIds)
      .returns<{ id: string; slug: string; name: string; name_localized: Record<string, string> | null }[]>()
    if (pErr) throw new Error(`getBySlugs parent lookup: ${pErr.message}`)
    for (const p of parents ?? []) {
      parentsById.set(p.id, { id: p.id, slug: p.slug, name: p.name, nameLocalized: p.name_localized ?? {} })
    }
  }

  for (const row of data) {
    const parent = row.parent_id ? parentsById.get(row.parent_id) ?? null : null
    out.set(row.slug, toLocality(row, parent))
  }
  return out
})

const _listForDropdownCached = unstable_cache(
  async (countryCode: string): Promise<LocalityOption[]> => {
    const sb = createServiceClient()
    const { data, error } = await sb
      .from('localities')
      .select(SELECT_LOCALITY)
      .eq('country_code', countryCode)
      .returns<LocalityRow[]>()
    if (error) throw new Error(`listForDropdown: ${error.message}`)
    if (!data) return []

    const byId = new Map(data.map((r) => [r.id, r]))
    const options: LocalityOption[] = []
    for (const row of data) {
      if (!DROPDOWN_KINDS.has(row.kind)) continue
      let parent: LocalityParent | null = null
      if (row.parent_id) {
        const p = byId.get(row.parent_id)
        if (p) {
          parent = {
            id: p.id,
            slug: p.slug,
            name: p.name,
            nameLocalized: p.name_localized ?? {},
          }
        }
      }
      const opt = toLocalityOption(row, parent)
      if (opt) options.push(opt)
    }
    return options
  },
  ['localities-dropdown'],
  { tags: [LOCALITIES_CACHE_TAG] },
)

export async function listForDropdown(countryCode = 'LU'): Promise<LocalityOption[]> {
  return _listForDropdownCached(countryCode)
}

export async function searchByPrefix(
  query: string,
  countryCode = 'LU',
  limit = 10,
): Promise<Array<{ slug: string; name: string; kind: LocalityKind; parentName: string | null }>> {
  const trimmed = query.trim()
  if (!trimmed) return []
  const sb = createServiceClient()
  const { data, error } = await sb.rpc('search_localities', {
    p_country: countryCode,
    p_query: trimmed,
    p_limit: limit,
  })
  if (error) throw new Error(`searchByPrefix: ${error.message}`)
  const rows = (data ?? []) as Array<{
    id: string
    slug: string
    name: string
    kind: LocalityKind
    parent_name: string | null
  }>
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    kind: r.kind,
    parentName: r.parent_name,
  }))
}
