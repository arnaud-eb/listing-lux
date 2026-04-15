"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ConfirmDiscardDialog from "@/components/shared/ConfirmDiscardDialog";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Language, Listing, Property } from "@/lib/types";
import { LANGUAGES, LANGUAGE_LABELS } from "@/lib/constants";
import { useListingGeneration } from "@/app/(wizard)/listing/[listingId]/use-listing-generation";
import { updateListing } from "@/app/(wizard)/listing/[listingId]/actions";
import ListingContent from "./ListingContent";
import ListingBottomBar from "./ListingBottomBar";
import type { EditableListingHandle } from "./EditableListingContent";

interface ListingGeneratorProps {
  propertyId: string;
  initialListings: Listing[];
  property: Property;
  /** Optional callback fired when the generation state changes — lets parents disable actions during generation. */
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export default function ListingGenerator({
  propertyId,
  initialListings,
  property,
  onGeneratingChange,
}: ListingGeneratorProps) {
  const {
    state,
    activeTab,
    setActiveTab,
    isGenerating,
    initialGenerationDone,
    regenerate,
    updateField,
  } = useListingGeneration(propertyId, initialListings);

  const [isEditing, setIsEditing] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [discardSource, setDiscardSource] = useState<"tab" | "button">("button");
  const pendingTabRef = useRef<Language | null>(null);
  const editableRef = useRef<EditableListingHandle>(null);

  // Notify parent when generation state changes (used to disable external actions like delete)
  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  // Find currently generating language for "queued" display
  const generatingLang = LANGUAGES.find(
    (l) => state[l].status === "generating",
  );

  const canEdit = state[activeTab].status === "complete" && !isGenerating;

  const handleTabChange = useCallback(
    (v: string) => {
      if (isEditing) {
        pendingTabRef.current = v as Language;
        if (editableRef.current?.isDirty()) {
          setDiscardSource("tab");
          setDiscardDialogOpen(true);
        } else {
          setIsEditing(false);
          setActiveTab(v as Language);
        }
        return;
      }
      setActiveTab(v as Language);
    },
    [isEditing, setActiveTab],
  );

  const confirmDiscard = useCallback(() => {
    setIsEditing(false);
    setDiscardDialogOpen(false);
    if (pendingTabRef.current) {
      setActiveTab(pendingTabRef.current);
      pendingTabRef.current = null;
    }
  }, [setActiveTab]);

  const handleSave = useCallback(
    async (
      updates: Partial<
        Pick<Listing, "title" | "description" | "highlights" | "seo_keywords">
      >,
    ) => {
      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        return;
      }

      // Capture previous state for rollback
      const listing = state[activeTab].listing;
      const previousValues: Partial<
        Pick<Listing, "title" | "description" | "highlights" | "seo_keywords">
      > = {};
      for (const key of Object.keys(updates) as (keyof typeof updates)[]) {
        previousValues[key] = listing?.[key] as never;
      }

      // Optimistic local update
      updateField(activeTab, updates);

      // Persist to DB
      if (listing?.id) {
        try {
          await updateListing(listing.id, updates);
          toast.success("Changes saved");
        } catch {
          // Rollback optimistic update
          updateField(activeTab, previousValues);
          toast.error("Failed to save changes");
        }
      }

      setIsEditing(false);
    },
    [activeTab, state, updateField],
  );

  const handleDiscard = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleRegenerate = useCallback(
    (comment?: string) => {
      regenerate(activeTab, comment);
    },
    [activeTab, regenerate],
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between mb-1">
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

          {canEdit && !isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5 rounded-lg text-gray-500 hover:text-navy-deep hover:bg-gray-100"
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editableRef.current?.isDirty()) {
                    setDiscardSource("button");
                    setDiscardDialogOpen(true);
                  } else {
                    handleDiscard();
                  }
                }}
                className="gap-1.5 rounded-lg text-gray-500 hover:text-navy-deep hover:bg-gray-100"
              >
                <X className="size-3.5" />
                <span className="max-sm:hidden">Discard</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => editableRef.current?.save()}
                className="gap-1.5 rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
              >
                <Check className="size-3.5" />
                <span className="max-sm:hidden">Save</span>
              </Button>
            </div>
          )}
        </div>

        {LANGUAGES.map((lang) => (
          <TabsContent key={lang} value={lang}>
            <ListingContent
              language={lang}
              status={state[lang].status}
              listing={state[lang].listing}
              error={state[lang].error}
              currentlyGenerating={generatingLang}
              onRetry={() => regenerate(lang)}
              isEditing={isEditing && lang === activeTab}
              onSave={handleSave}
              editableRef={editableRef}
            />
          </TabsContent>
        ))}
      </Tabs>

      <ListingBottomBar
        onRegenerate={initialGenerationDone ? handleRegenerate : undefined}
        isGenerating={isGenerating}
        activeLanguage={initialGenerationDone ? activeTab : undefined}
        isEditing={isEditing}
        listing={state[activeTab].listing ?? null}
        property={property}
      />

      {/* Discard confirmation for tab switching while editing */}
      <ConfirmDiscardDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        onConfirm={confirmDiscard}
        onCancel={() => {
          pendingTabRef.current = null;
        }}
      />
    </div>
  );
}
