'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURE_OPTIONS = [
  { id: 'balcony', label: 'Balcony' },
  { id: 'parking', label: 'Parking' },
  { id: 'garden', label: 'Garden' },
  { id: 'elevator', label: 'Elevator' },
  { id: 'storage', label: 'Storage/Cellar' },
  { id: 'pool', label: 'Pool' },
  { id: 'terrace', label: 'Terrace' },
  { id: 'furnished', label: 'Furnished' },
  { id: 'new-build', label: 'New Build' },
  { id: 'renovated', label: 'Renovated' },
  { id: 'city-view', label: 'City View' },
]

interface FeatureChipsProps {
  features: Record<string, boolean>
  onChange: (features: Record<string, boolean>) => void
}

export default function FeatureChips({ features, onChange }: FeatureChipsProps) {
  function toggle(id: string) {
    onChange({ ...features, [id]: !features[id] })
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-700 mb-2">Features</legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Property features">
        {FEATURE_OPTIONS.map((option) => {
          const checked = !!features[option.id]
          return (
            <Button
              key={option.id}
              type="button"
              role="checkbox"
              aria-checked={checked}
              variant="outline"
              size="sm"
              onClick={() => toggle(option.id)}
              className={`rounded-full shadow-none ${
                checked
                  ? 'bg-navy-deep/10 border-navy-deep text-navy-deep hover:bg-navy-deep/15 hover:text-navy-deep'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {checked && <Check className="size-3.5 text-gold" aria-hidden="true" />}
              {option.label}
            </Button>
          )
        })}
      </div>
    </fieldset>
  )
}
