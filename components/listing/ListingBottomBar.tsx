"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LANGUAGE_LABELS, MAX_COMMENT_LENGTH } from "@/lib/constants";
import type { Language, Listing, Property } from "@/lib/types";

const ExportMenu = dynamic(() => import("./ExportMenu"), { ssr: false });

const QUICK_SUGGESTIONS = [
  "More concise",
  "More detailed",
  "Emphasize location",
  "Luxury tone",
];

interface ListingBottomBarProps {
  onRegenerate?: (comment?: string) => void;
  isGenerating?: boolean;
  activeLanguage?: Language;
  isEditing?: boolean;
  listing?: Partial<Listing> | null;
  property?: Property;
}

export default function ListingBottomBar({
  onRegenerate,
  isGenerating,
  activeLanguage,
  isEditing,
  listing,
  property,
}: ListingBottomBarProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [comment, setComment] = useState("");

  const handleConfirm = () => {
    onRegenerate?.(comment.trim() || undefined);
    setComment("");
    setPopoverOpen(false);
  };

  const handleCancel = () => {
    setComment("");
    setPopoverOpen(false);
  };

  return (
    <div className="border-t border-gray-100 mt-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          {onRegenerate && (
            <Popover
              open={popoverOpen}
              onOpenChange={(open) => {
                if (isEditing) return;
                setPopoverOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isGenerating || isEditing}
                  className="gap-1.5 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-navy-deep shadow-none"
                >
                  <RefreshCw
                    className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`}
                  />
                  <span className="max-sm:hidden">Regenerate</span>
                  {activeLanguage && (
                    <span className="uppercase text-2xs font-bold bg-gold/10 text-gold rounded px-1.5 py-0.5">
                      {activeLanguage}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="max-w-90 w-[calc(100vw-2rem)] p-4"
              >
                <PopoverArrow className="fill-white" />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="size-4 text-gold" />
                    <span className="font-semibold text-sm text-navy-deep">
                      Regenerate{" "}
                      {activeLanguage ? LANGUAGE_LABELS[activeLanguage] : ""}{" "}
                      listing
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="regen-comment"
                      className="text-xs text-gray-500 mb-1.5 block"
                    >
                      Guide the AI (optional)
                    </label>
                    <Textarea
                      id="regen-comment"
                      value={comment}
                      onChange={(e) =>
                        setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))
                      }
                      onFocus={(e) => {
                        const len = e.target.value.length;
                        e.target.setSelectionRange(len, len);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleConfirm();
                        }
                      }}
                      placeholder="e.g., 'emphasize the garden view', 'make it shorter and more direct'"
                      className="resize-none text-sm"
                      rows={3}
                    />
                    {comment.length > 0 && (
                      <p className="text-2xs text-gray-400 text-right mt-1">
                        {comment.length} / {MAX_COMMENT_LENGTH}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() =>
                          setComment((prev) => {
                            if (!prev.trim()) return suggestion;
                            return `${prev.trimEnd()}, ${suggestion.toLowerCase()}`;
                          })
                        }
                        className="text-2xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  <p className="text-2xs text-gray-400">
                    Leave empty to regenerate without specific guidance.{" "}
                    <kbd className="font-mono">⌘↵</kbd> to confirm.
                  </p>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="rounded-lg shadow-none"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleConfirm}
                      className="gap-1.5 rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
                    >
                      <RefreshCw className="size-3" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="gap-1.5 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-navy-deep shadow-none"
          >
            <Link href="/create">
              <Plus className="size-3.5" />
              New Listing
            </Link>
          </Button>
          <ExportMenu
            hideTextOnMobile
            listing={listing ?? null}
            property={property ?? null}
            activeLanguage={activeLanguage ?? null}
            isEditing={isEditing}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}
