import type { Language } from '@/lib/types'

interface ListingContentProps {
  language: Language
  isGenerating?: boolean
}

const LANGUAGE_LABELS: Record<Language, string> = {
  de: 'Deutsch',
  fr: 'Français',
  en: 'English',
  lu: 'Lëtzebuergesch',
}

export default function ListingContent({
  language,
  isGenerating = true,
}: ListingContentProps) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-400">
        <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Generating your {LANGUAGE_LABELS[language]} listing…</p>
        <p className="text-xs text-gray-300">Phase 3 — coming soon</p>
      </div>
    )
  }

  return (
    <div className="prose prose-sm max-w-none text-gray-600">
      <p className="text-gray-400 italic">No content generated yet.</p>
    </div>
  )
}
