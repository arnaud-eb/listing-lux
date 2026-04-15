"use client";

import type { RefObject } from "react";
import type { Language, Listing, ListingUpdates } from "@/lib/types";
import { LANGUAGE_LABELS, HIGHLIGHTS_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import DynamicIcon from "@/components/shared/DynamicIcon";
import type { GenerationStatus } from "@/app/(wizard)/listing/[listingId]/use-listing-generation";
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
  return (
    <div className="min-h-100">
      {status === "queued" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <div
            className="size-6 border-2 border-gray-200 border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
            role="status"
            aria-label="Queued for generation"
          />
          <p className="text-sm">
            Queued — will generate after{" "}
            {currentlyGenerating
              ? LANGUAGE_LABELS[currentlyGenerating]
              : "current language"}
          </p>
        </div>
      )}

      {status === "idle" && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-400 italic">
            No content generated yet.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-sm text-red-500">{error || "Generation failed"}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-red-500 border-red-200 hover:bg-red-50"
            >
              Retry
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
                    aria-label="Generating listing"
                  />
                  <span className="text-sm">
                    Preparing your {LANGUAGE_LABELS[language]} listing…
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

              {/* SEO Keywords */}
              {listing?.seo_keywords && listing.seo_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {listing.seo_keywords.filter(Boolean).map((keyword, i) => (
                    <span
                      key={i}
                      className="text-2xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
