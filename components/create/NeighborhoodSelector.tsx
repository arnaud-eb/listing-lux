'use client'

import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getActiveMarket, estimatePrice } from '@/lib/markets'

interface NeighborhoodSelectorProps {
  value: string
  onChange: (value: string) => void
  sqm: number
}

export default function NeighborhoodSelector({ value, onChange, sqm }: NeighborhoodSelectorProps) {
  const market = getActiveMarket()

  const neighborhoods = useMemo(
    () => market.areas.flatMap((a) => a.neighborhoods),
    [market.areas],
  )

  const estimate = value && sqm > 0 ? estimatePrice(value, sqm) : null

  const locale = market.areas[0]?.locale ?? 'fr-LU'
  const currency = market.areas[0]?.defaultCurrency ?? 'EUR'

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700" htmlFor="neighborhood-select">
        Neighborhood *
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="neighborhood-select" className="w-full">
          <SelectValue placeholder="Select neighborhood…" />
        </SelectTrigger>
        <SelectContent>
          {neighborhoods.map((n) => (
            <SelectItem key={n.slug} value={n.slug}>
              {n.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {estimate !== null && (
        <div className="flex items-center gap-2 mt-1" aria-live="polite">
          <span className="text-xs text-gray-500">Estimated market value:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gold/10 text-gold text-xs font-semibold" aria-label={`Estimated average price: ${new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(estimate)}`}>
            Avg: {new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(estimate)}
          </span>
        </div>
      )}
    </div>
  )
}
