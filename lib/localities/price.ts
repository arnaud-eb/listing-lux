import type { LocalityPrice, PriceBand } from './types'

export interface PriceTierRow {
  price_per_sqm_min: number | null
  price_per_sqm_median: number | null
  price_per_sqm_max: number | null
  data_as_of: string | null
}

/** The price-relevant subset of a locality row that resolvePrice reads. */
export interface PriceInputs {
  price_per_sqm_min: number | null
  price_per_sqm_median: number | null
  price_per_sqm_max: number | null
  asking_price_per_sqm_apt: number | null
  asking_price_per_sqm_house: number | null
  data_as_of: string | null
  price_tiers: PriceTierRow | null
}

/** A STATEC asking-price mean: a precise point, no min/max spread. */
function pointBand(perSqm: number, dataAsOf: string | null): PriceBand {
  return {
    medianPerSqm: perSqm,
    minPerSqm: null,
    maxPerSqm: null,
    source: 'statec',
    dataAsOf,
  }
}

/** A hand-curated min/median/max band stored directly on the locality row. */
function overrideBand(row: PriceInputs): PriceBand | null {
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
      dataAsOf: row.data_as_of,
    }
  }
  return null
}

/** The coarse band from the locality's assigned price tier. */
function tierBand(row: PriceInputs): PriceBand | null {
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
      dataAsOf: tier.data_as_of,
    }
  }
  return null
}

/** A parent band counts as inheritable "real data" only if it isn't a tier guess. */
function realData(band: PriceBand | null | undefined): PriceBand | null {
  return band && band.source !== 'tier' ? band : null
}

/**
 * Resolve a locality's price per property type. Precedence, per type:
 *   own STATEC point → own hand-curated band → parent's real data
 *   → own tier → parent's tier.
 * The parent steps let quartiers with no data of their own (STATEC's quartier
 * coverage is Luxembourg-Ville only) inherit their commune's asking price — but
 * a deliberate per-locality tier still outranks a merely-inherited tier.
 */
export function resolvePrice(
  row: PriceInputs,
  parentPrice: LocalityPrice | null,
): LocalityPrice | null {
  const override = overrideBand(row)
  const tier = tierBand(row)
  const parentApt = parentPrice?.apartment ?? null
  const parentHouse = parentPrice?.house ?? null
  const apartment =
    (row.asking_price_per_sqm_apt != null
      ? pointBand(Number(row.asking_price_per_sqm_apt), row.data_as_of)
      : null) ??
    override ??
    realData(parentApt) ??
    tier ??
    parentApt
  const house =
    (row.asking_price_per_sqm_house != null
      ? pointBand(Number(row.asking_price_per_sqm_house), row.data_as_of)
      : null) ??
    override ??
    realData(parentHouse) ??
    tier ??
    parentHouse
  if (!apartment && !house) return null
  return { apartment, house }
}

/** A parent locality's resolved price (one level only — cantons have no price). */
export function parentPriceOf(
  parentRow: PriceInputs | null | undefined,
): LocalityPrice | null {
  return parentRow ? resolvePrice(parentRow, null) : null
}
