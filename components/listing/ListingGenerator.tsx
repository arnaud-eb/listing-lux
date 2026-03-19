"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Language, Listing } from "@/lib/types";
import { LANGUAGES, LANGUAGE_LABELS } from "@/lib/constants";
import { useListingGeneration } from "@/app/(wizard)/listing/[listingId]/use-listing-generation";
import ListingContent from "./ListingContent";
import ListingBottomBar from "./ListingBottomBar";

interface ListingGeneratorProps {
  propertyId: string;
  initialListings: Listing[];
}

export default function ListingGenerator({
  propertyId,
  initialListings,
}: ListingGeneratorProps) {
  const {
    state,
    activeTab,
    setActiveTab,
    isGenerating,
    initialGenerationDone,
    regenerate,
  } = useListingGeneration(propertyId, initialListings);

  // Find currently generating language for "queued" display
  const generatingLang = LANGUAGES.find(
    (l) => state[l].status === "generating",
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as Language)}
        >
          <TabsList className="gap-1">
            {LANGUAGES.map((lang) => (
              <TabsTrigger
                key={lang}
                value={lang}
                className="uppercase font-semibold"
              >
                {lang}
                {(state[lang].status === "generating" ||
                  state[lang].status === "queued") && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-gold rounded-full animate-pulse motion-reduce:animate-none" />
                )}
                <span className="sr-only"> ({LANGUAGE_LABELS[lang]})</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {LANGUAGES.map((lang) => (
            <TabsContent key={lang} value={lang}>
              <ListingContent
                language={lang}
                status={state[lang].status}
                listing={state[lang].listing}
                error={state[lang].error}
                currentlyGenerating={generatingLang}
                onRetry={() => regenerate(lang)}
              />
            </TabsContent>
          ))}
        </Tabs>

        <ListingBottomBar
          onRegenerate={
            initialGenerationDone ? () => regenerate(activeTab) : undefined
          }
          isGenerating={isGenerating}
          activeLanguage={initialGenerationDone ? activeTab : undefined}
        />
    </div>
  );
}
