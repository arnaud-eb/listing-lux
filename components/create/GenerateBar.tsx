'use client'

import { Button } from '@/components/ui/button'
import { getActiveMarket } from '@/lib/markets'

interface GenerateBarProps {
  readyPhotoCount: number
  hasRequiredFields: boolean
  onGenerate: () => void
  isLoading?: boolean
}

export default function GenerateBar({
  readyPhotoCount,
  hasRequiredFields,
  onGenerate,
  isLoading = false,
}: GenerateBarProps) {
  const market = getActiveMarket()
  const canGenerate = readyPhotoCount >= 5 && hasRequiredFields && !isLoading

  return (
    <div className="bg-white border-t border-gray-200 p-4 max-lg:sticky max-lg:bottom-0 max-lg:shadow-lg max-lg:z-10">
      {/* Language badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-gray-500">Generates in:</span>
        {market.supportedLanguages.map((lang) => (
          <span
            key={lang}
            className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1a2332] text-white uppercase"
          >
            {lang}
          </span>
        ))}
      </div>

      {/* Generate button */}
      <Button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className="w-full bg-[#C5A059] text-white hover:bg-[#C5A059]/90 disabled:opacity-50 disabled:cursor-not-allowed border-0"
        size="lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating…
          </span>
        ) : (
          'Generate Listing'
        )}
      </Button>

      {/* Validation hints */}
      {!canGenerate && !isLoading && (
        <p className="text-xs text-gray-400 text-center mt-2">
          {readyPhotoCount < 5
            ? `${5 - readyPhotoCount} more photo${5 - readyPhotoCount > 1 ? 's' : ''} needed`
            : 'Fill in all required fields to continue'}
        </p>
      )}
    </div>
  )
}
