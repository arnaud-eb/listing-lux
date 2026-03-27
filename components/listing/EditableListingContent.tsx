"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Language, Listing, ListingUpdates } from "@/lib/types";
import { HIGHLIGHTS_LABEL } from "@/lib/constants";
import { Sparkles, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ConfirmDiscardDialog from "@/components/shared/ConfirmDiscardDialog";

// --- Stable-key item helpers ---

interface KeyedItem {
  id: string;
  value: string;
}

let nextId = 0;
function makeId() {
  return `ki-${++nextId}`;
}

function toKeyed(items: string[]): KeyedItem[] {
  return items.map((value) => ({ id: makeId(), value }));
}

function fromKeyed(items: KeyedItem[]): string[] {
  return items.map((item) => item.value);
}

// --- Auto-sizing input ---

function AutoSizeInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(32);

  useEffect(() => {
    if (spanRef.current) {
      setWidth(Math.max(32, spanRef.current.offsetWidth + 4));
    }
  }, [value]);

  return (
    <>
      <span
        ref={spanRef}
        aria-hidden
        className="absolute invisible whitespace-pre text-2xs"
      >
        {value || " "}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: `${width}px` }}
        className={className}
      />
    </>
  );
}

// --- Component ---

interface EditableListingContentProps {
  language: Language;
  listing: Partial<Listing>;
  onSave: (updates: ListingUpdates) => void;
  onDiscard: () => void;
}

export default function EditableListingContent({
  language,
  listing,
  onSave,
  onDiscard,
}: EditableListingContentProps) {
  const [draftTitle, setDraftTitle] = useState(listing.title ?? "");
  const [draftDescription, setDraftDescription] = useState(
    listing.description ?? "",
  );
  const [draftHighlights, setDraftHighlights] = useState<KeyedItem[]>(() =>
    toKeyed(listing.highlights ?? []),
  );
  const [draftKeywords, setDraftKeywords] = useState<KeyedItem[]>(() =>
    toKeyed(listing.seo_keywords ?? []),
  );

  const isDirty = useCallback(() => {
    return (
      draftTitle !== (listing.title ?? "") ||
      draftDescription !== (listing.description ?? "") ||
      JSON.stringify(fromKeyed(draftHighlights)) !==
        JSON.stringify(listing.highlights ?? []) ||
      JSON.stringify(fromKeyed(draftKeywords)) !==
        JSON.stringify(listing.seo_keywords ?? [])
    );
  }, [draftTitle, draftDescription, draftHighlights, draftKeywords, listing]);

  const handleSave = () => {
    if (!draftTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    const highlights = fromKeyed(draftHighlights);
    const keywords = fromKeyed(draftKeywords);

    const updates: ListingUpdates = {};
    if (draftTitle !== listing.title) updates.title = draftTitle;
    if (draftDescription !== listing.description)
      updates.description = draftDescription;
    if (JSON.stringify(highlights) !== JSON.stringify(listing.highlights))
      updates.highlights = highlights.filter(Boolean);
    if (JSON.stringify(keywords) !== JSON.stringify(listing.seo_keywords))
      updates.seo_keywords = keywords.filter(Boolean);

    onSave(updates);
  };

  const updateHighlight = (id: string, value: string) => {
    setDraftHighlights((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item)),
    );
  };

  const removeHighlight = (id: string) => {
    setDraftHighlights((prev) => prev.filter((item) => item.id !== id));
  };

  const updateKeyword = (id: string, value: string) => {
    setDraftKeywords((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item)),
    );
  };

  const removeKeyword = (id: string) => {
    setDraftKeywords((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      <div className="flex flex-col gap-6 py-4">
        {/* Title */}
        <Input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          className="font-serif text-2xl font-bold text-navy-deep border-dashed border-gold bg-gold/5 h-auto py-2"
        />

        {/* Description */}
        <Textarea
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
          className="text-sm text-gray-600 leading-relaxed border-dashed border-gold bg-gold/5 min-h-50"
          rows={10}
        />

        {/* Highlights */}
        <div>
          <h3 className="text-xs font-semibold text-navy-deep uppercase tracking-wider mb-3">
            {HIGHLIGHTS_LABEL[language]}
          </h3>
          <div className="flex flex-col gap-2">
            {draftHighlights.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Sparkles className="size-4 text-gold shrink-0" />
                <Input
                  value={item.value}
                  onChange={(e) => updateHighlight(item.id, e.target.value)}
                  className="text-sm border-dashed border-gold bg-gold/5 h-8"
                />
                <button
                  type="button"
                  onClick={() => removeHighlight(item.id)}
                  className="min-w-11 min-h-11 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  aria-label="Remove highlight"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setDraftHighlights((prev) => [
                  ...prev,
                  { id: makeId(), value: "" },
                ])
              }
              className="flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors py-1 cursor-pointer"
            >
              <Plus className="size-4" />
              Add highlight
            </button>
          </div>
        </div>

        {/* SEO Keywords */}
        <div className="flex flex-wrap gap-2 relative">
          {draftKeywords.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 text-2xs bg-gray-100 text-gray-600 rounded-full pl-2.5 pr-1 py-1"
            >
              <AutoSizeInput
                value={item.value}
                onChange={(v) => updateKeyword(item.id, v)}
                className="bg-transparent border-none shadow-none outline-none h-auto p-0 text-2xs"
              />
              <button
                type="button"
                onClick={() => removeKeyword(item.id)}
                className="size-5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-200 transition-colors cursor-pointer"
                aria-label="Remove keyword"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() =>
              setDraftKeywords((prev) => [
                ...prev,
                { id: makeId(), value: "" },
              ])
            }
            className="text-2xs text-gold hover:text-gold/80 rounded-full px-2.5 py-0.5 border border-dashed border-gold/40 transition-colors cursor-pointer"
          >
            + Add keyword
          </button>
        </div>
      </div>

      {/* Edit actions */}
      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 mt-2">
        {isDirty() ? (
          <ConfirmDiscardDialog
            trigger={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg shadow-none"
              >
                Discard
              </Button>
            }
            onConfirm={onDiscard}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDiscard}
            className="rounded-lg shadow-none"
          >
            Discard
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          className="rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
        >
          Save Changes
        </Button>
      </div>
    </>
  );
}
