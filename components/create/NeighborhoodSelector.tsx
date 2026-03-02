'use client'

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
  const neighborhoods = market.areas.flatMap((a) => a.neighborhoods)
  const estimate = value && sqm > 0 ? estimatePrice(value, sqm) : null

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700" htmlFor="neighborhood-select">
        Neighborhood
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
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">Estimated market value:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#C5A059]/10 text-[#C5A059] text-xs font-semibold">
            Avg: {new Intl.NumberFormat('fr-LU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(estimate)}
          </span>
        </div>
      )}
    </div>
  )
}
