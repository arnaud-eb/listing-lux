"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROOM_TYPES, normalizeRoomType } from "@/lib/constants";
import type { ListingPhoto } from "@/lib/types";

interface PhotoThumbnailProps {
  photo: ListingPhoto;
  onRemove: (id: string) => void;
  onUpdateRoomType: (id: string, value: string) => void;
  isFirst?: boolean;
}

export default memo(function PhotoThumbnail({
  photo,
  onRemove,
  onUpdateRoomType,
  isFirst,
}: PhotoThumbnailProps) {
  const t = useTranslations("wizard.photoThumbnail");

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-200 group">
      {/* Prefer local blob (instant, in-memory) — fall back to remote for restored drafts.
          The image is decorative inside the thumbnail: status (uploading/analyzing/error)
          is announced by the overlay's `aria-label`/`role`, the room-type pill carries the
          per-photo label, and the surrounding remove-button has its own aria-label. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.localPreviewUrl || photo.publicUrl || ""}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
        draggable={false}
      />

      {/* Uploading overlay */}
      {photo.status === "uploading" && (
        <div
          className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2"
          aria-live="polite"
        >
          <div
            className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
            role="status"
            aria-label={t("ariaUploading")}
          />
          <span className="text-white text-xs font-medium">
            {photo.uploadProgress > 0
              ? `${photo.uploadProgress}%`
              : t("uploading")}
          </span>
        </div>
      )}

      {/* Analyzing overlay — same spinner treatment as the uploading state */}
      {photo.status === "processing" && (
        <div
          className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2"
          aria-live="polite"
        >
          <div
            className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
            role="status"
            aria-label={t("ariaAnalyzing")}
          />
          <span className="text-white text-xs font-medium">{t("analyzing")}</span>
        </div>
      )}

      {/* Error overlay */}
      {photo.status === "error" && (
        <div
          className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
          role="alert"
        >
          <span className="text-red-700 text-xs font-medium px-2 py-1 bg-red-100 rounded">
            {t("error")}
          </span>
        </div>
      )}

      {/* Top-left badge: editable room type, or "Main View" fallback */}
      {photo.status === "ready" && photo.aiAnalysis ? (
        <div className="absolute top-2 left-2 max-w-3/4">
          <RoomTypePill
            value={photo.aiAnalysis.room_type}
            onChange={(next) => onUpdateRoomType(photo.id, next)}
          />
        </div>
      ) : isFirst && photo.status === "ready" ? (
        <div className="absolute top-2 left-2">
          <span className="bg-gold text-white text-2xs px-2 py-0.5 rounded font-bold uppercase tracking-tighter">
            {t("mainView")}
          </span>
        </div>
      ) : null}

      {/* Remove button — visible on hover & always reachable via keyboard */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onRemove(photo.id)}
        aria-label={t("ariaRemove")}
        className="absolute top-1.5 right-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 hover:text-white opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 [@media(hover:none)]:size-6 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="size-3.5 [@media(hover:none)]:size-3" />
      </Button>
    </div>
  );
});

const PILL_CLASSES =
  "bg-gold text-white text-2xs px-2 py-0.5 rounded font-bold uppercase tracking-tighter";

/**
 * The room type the AI detected, as a translated <select> the agent can
 * correct. The value is always a canonical ROOM_TYPES id — the select shows
 * the localized label but stores the id, so a correction (e.g. balcony →
 * terrace) re-syncs feature chips identically in every UI language.
 */
function RoomTypePill({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const t = useTranslations("wizard.photoThumbnail");

  return (
    <div className="relative inline-block max-w-full">
      <select
        value={normalizeRoomType(value)}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        aria-label={t("ariaRoomType")}
        className={`${PILL_CLASSES} appearance-none cursor-pointer pr-5 max-w-full truncate hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-gold`}
      >
        {ROOM_TYPES.map((rt) => (
          <option key={rt} value={rt}>
            {t(`roomTypes.${rt}`)}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-1 top-1/2 -translate-y-1/2 size-3 text-white pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
