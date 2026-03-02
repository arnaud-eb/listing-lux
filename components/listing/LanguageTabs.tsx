'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Language } from '@/lib/types'

const LANGUAGE_LABELS: Record<Language, string> = {
  de: 'Deutsch',
  fr: 'Français',
  en: 'English',
  lu: 'Lëtzebuergesch',
}

interface LanguageTabsProps {
  children: (language: Language) => React.ReactNode
}

export default function LanguageTabs({ children }: LanguageTabsProps) {
  return (
    <Tabs defaultValue="de">
      <TabsList className="gap-1">
        {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
          <TabsTrigger key={lang} value={lang} className="uppercase font-semibold">
            {lang}
            <span className="sr-only"> ({LANGUAGE_LABELS[lang]})</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
        <TabsContent key={lang} value={lang}>
          {children(lang)}
        </TabsContent>
      ))}
    </Tabs>
  )
}
