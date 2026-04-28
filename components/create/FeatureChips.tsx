'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FEATURE_OPTIONS } from '@/lib/constants'

interface FeatureChipsProps {
  features: Record<string, boolean>
  onChange: (features: Record<string, boolean>) => void
}

export default function FeatureChips({ features, onChange }: FeatureChipsProps) {
  const t = useTranslations('wizard.features')

  function toggle(id: string) {
    onChange({ ...features, [id]: !features[id] })
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-700 mb-2">{t('legend')}</legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('ariaGroupLabel')}>
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
