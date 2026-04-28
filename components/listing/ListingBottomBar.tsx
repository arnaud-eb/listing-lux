"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LANGUAGE_LABELS, MAX_COMMENT_LENGTH } from "@/lib/constants";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import type { Language, Listing, Property } from "@/lib/types";

const ExportMenu = dynamic(() => import("./ExportMenu"), { ssr: false });

const SUGGESTION_KEYS = [
  "suggestionConcise",
  "suggestionDetailed",
  "suggestionLocation",
  "suggestionLuxury",
] as const;

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
  const isMobile = useIsMobile();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [comment, setComment] = useState("");
  const t = useTranslations("wizard.listing.bottomBar");

  const QUICK_SUGGESTIONS = SUGGESTION_KEYS.map((k) => t(k));

  const handleConfirm = () => {
    onRegenerate?.(comment.trim() || undefined);
    setComment("");
    setPopoverOpen(false);
  };

  const handleCancel = () => {
    setComment("");
    setPopoverOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (isEditing) return;
    setPopoverOpen(open);
  };

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      disabled={isGenerating || isEditing}
      className="gap-1.5 rounded-lg border-gray-300 text-gray-700 shadow-none"
    >
      <RefreshCw
        className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`}
      />
      <span className="max-sm:hidden">{t("regenerate")}</span>
      {activeLanguage && (
        <span className="uppercase text-2xs font-bold bg-gold/10 text-gold rounded px-1.5 py-0.5">
          {activeLanguage}
        </span>
      )}
    </Button>
  );

  // Same regenerate body in both containers — Popover anchored to the trigger
  // on desktop, Dialog (which morphs to a bottom sheet on mobile via the
  // adaptive Dialog primitive) on mobile.
  const regenerateBody = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 max-md:hidden">
        <RefreshCw className="size-4 text-gold" />
        <span className="font-semibold text-sm text-navy-deep">
          {t("regenerateTitle", {
            language: activeLanguage ? LANGUAGE_LABELS[activeLanguage] : "",
          })}
        </span>
      </div>

      <div>
        <label
          htmlFor="regen-comment"
          className="text-xs text-gray-500 mb-1.5 block"
        >
          {t("guideAi")}
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
          placeholder={t("commentPlaceholder")}
          className="resize-none text-sm"
          rows={isMobile ? 4 : 3}
        />
        {comment.length > 0 && (
          <p className="text-2xs text-gray-400 text-right mt-1">
            {comment.length} / {MAX_COMMENT_LENGTH}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_SUGGESTIONS.map((suggestion) => {
          const tokens = comment
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          const isActive = tokens.some(
            (t) => t.toLowerCase() === suggestion.toLowerCase(),
          );
          return (
            <button
              key={suggestion}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                setComment((prev) => {
                  const prevTokens = prev
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  const suggestionLower = suggestion.toLowerCase();
                  const existingIdx = prevTokens.findIndex(
                    (t) => t.toLowerCase() === suggestionLower,
                  );
                  if (existingIdx !== -1) {
                    prevTokens.splice(existingIdx, 1);
                  } else {
                    prevTokens.push(suggestionLower);
                  }
                  if (prevTokens.length === 0) return "";
                  const [first, ...rest] = prevTokens;
                  return [
                    first.charAt(0).toUpperCase() + first.slice(1),
                    ...rest,
                  ].join(", ");
                })
              }
              className={`text-2xs rounded-full px-2.5 py-1 transition-colors cursor-pointer ${
                isActive
                  ? "bg-gold/10 text-gold hover:bg-gold/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {suggestion}
            </button>
          );
        })}
      </div>

      <p className="text-2xs text-gray-400 max-md:hidden">
        {t("leaveEmptyHint")}
      </p>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="rounded-lg shadow-none"
        >
          {t("cancel")}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          className="gap-1.5 rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
        >
          <RefreshCw className="size-3" />
          {t("regenerate")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="border-t border-gray-100 mt-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          {onRegenerate &&
            (isMobile ? (
              <Dialog open={popoverOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-navy-deep flex items-center gap-2">
                      <RefreshCw className="size-4 text-gold" />
                      {t("regenerateTitle", {
                        language: activeLanguage
                          ? LANGUAGE_LABELS[activeLanguage]
                          : "",
                      })}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="px-6 pb-6">{regenerateBody}</div>
                </DialogContent>
              </Dialog>
            ) : (
              <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  className="max-w-90 w-[calc(100vw-2rem)] p-4"
                >
                  <PopoverArrow className="fill-white" />
                  {regenerateBody}
                </PopoverContent>
              </Popover>
            ))}
        </div>
        <ExportMenu
          hideTextOnMobile
          listing={listing ?? null}
          property={property ?? null}
          isEditing={isEditing}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
