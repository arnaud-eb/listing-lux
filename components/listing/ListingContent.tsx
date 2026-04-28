"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import type { Language, Listing, ListingUpdates } from "@/lib/types";
import { LANGUAGE_LABELS, HIGHLIGHTS_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import DynamicIcon from "@/components/shared/DynamicIcon";
import type { GenerationStatus } from "@/app/[locale]/(wizard)/listing/[listingId]/use-listing-generation";
import EditableListingContent, { type EditableListingHandle } from "./EditableListingContent";

interface ListingContentProps {
  language: Language;
  status: GenerationStatus;
  listing?: Partial<Listing> | null;
  error?: string;
  currentlyGenerating?: Language;
  onRetry?: () => void;
  isEditing?: boolean;
  onSave?: (updates: ListingUpdates) => void;
  editableRef?: RefObject<EditableListingHandle | null>;
}

export default function ListingContent({
  language,
  status,
  listing,
  error,
  currentlyGenerating,
  onRetry,
  isEditing,
  onSave,
  editableRef,
}: ListingContentProps) {
  const t = useTranslations("wizard.listing");
  return (
    <div className="min-h-100">
      {status === "queued" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <div
            className="size-6 border-2 border-gray-200 border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
            role="status"
            aria-label={t("ariaQueued")}
          />
          <p className="text-sm">
            {t("queued", {
              language: currentlyGenerating
                ? LANGUAGE_LABELS[currentlyGenerating]
                : t("queuedFallback"),
            })}
          </p>
        </div>
      )}

      {status === "idle" && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-400 italic">{t("noContent")}</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-sm text-red-500">{error || t("generationFailed")}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-red-500 border-red-200 hover:bg-red-50"
            >
              {t("retry")}
            </Button>
          )}
        </div>
      )}

      {(status === "generating" || status === "complete") && (
        <>
          {isEditing && listing && onSave ? (
            <EditableListingContent
              ref={editableRef}
              key={language}
              language={language}
              listing={listing}
              onSave={onSave}
            />
          ) : (
            <div className="flex flex-col gap-6 py-4">
              {/* Title */}
              {listing?.title ? (
                <h2 className="font-serif text-2xl font-bold text-navy-deep">
                  {listing.title}
                </h2>
              ) : status === "generating" ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div
                    className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
                    role="status"
                    aria-label={t("ariaGenerating")}
                  />
                  <span className="text-sm">
                    {t("preparing", { language: LANGUAGE_LABELS[language] })}
                  </span>
                </div>
              ) : null}

              {/* Description */}
              {listing?.description && (
                <div className="flex flex-col gap-3">
                  {listing.description.split("\n\n").map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-sm text-gray-600 leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              {/* Highlights */}
              {listing?.highlights && listing.highlights.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-navy-deep uppercase tracking-wider mb-3">
                    {HIGHLIGHTS_LABEL[language]}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {listing.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <DynamicIcon
                          name={typeof highlight === "string" ? "sparkles" : highlight.icon}
                          className="size-4 text-gold shrink-0 mt-0.5"
                        />
                        <span className="text-sm text-gray-600">
                          {typeof highlight === "string" ? highlight : highlight.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {listing?.hashtags && listing.hashtags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-navy-deep uppercase tracking-wider mb-3">
                    {t("hashtags")}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                  {listing.hashtags.filter(Boolean).map((tag, i) => (
                    <span
                      key={i}
                      className="text-2xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5"
                    >
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </span>
                  ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
