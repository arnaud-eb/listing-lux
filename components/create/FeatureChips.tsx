'use client'

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
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">Features</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Property features">
        {FEATURE_OPTIONS.map((option) => {
          const checked = !!features[option.id]
          return (
            <label
              key={option.id}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer
                border transition-colors select-none
                ${checked
                  ? 'bg-[#1a2332]/5 border-[#1a2332] text-[#1a2332]'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }
              `}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggle(option.id)}
                aria-label={option.label}
              />
              {checked && <span className="text-[#C5A059]">✓</span>}
              {option.label}
            </label>
          )
        })}
      </div>
    </div>
  )
}
