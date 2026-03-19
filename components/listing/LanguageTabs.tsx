'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Language } from '@/lib/types'
import { LANGUAGES, LANGUAGE_LABELS } from '@/lib/constants'

interface LanguageTabsProps {
  tabs: Record<Language, React.ReactNode>
}

export default function LanguageTabs({ tabs }: LanguageTabsProps) {
  return (
    <Tabs defaultValue="de">
      <TabsList className="gap-1">
        {LANGUAGES.map((lang) => (
          <TabsTrigger key={lang} value={lang} className="uppercase font-semibold">
            {lang}
            <span className="sr-only"> ({LANGUAGE_LABELS[lang]})</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {LANGUAGES.map((lang) => (
        <TabsContent key={lang} value={lang}>
          {tabs[lang]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
