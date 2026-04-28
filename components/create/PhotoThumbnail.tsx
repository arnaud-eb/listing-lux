"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      {/* Prefer local blob (instant, in-memory) — fall back to remote for restored drafts */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.localPreviewUrl || photo.publicUrl || ""}
        alt={t("ariaRemove")}
        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
        draggable={false}
      />

      {/* Uploading overlay */}
      {photo.status === "uploading" && (
        <div
          className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1"
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

      {/* Analyzing overlay */}
      {photo.status === "processing" && (
        <div
          className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2"
          aria-live="polite"
        >
          <div
            className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
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
            onSave={(next) => onUpdateRoomType(photo.id, next)}
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

function RoomTypePill({
  value,
  onSave,
}: {
  value: string;
  onSave: (next: string) => void;
}) {
  const t = useTranslations("wizard.photoThumbnail");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(40);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (measureRef.current) {
      setWidth(Math.max(40, measureRef.current.offsetWidth + 8));
    }
  }, [draft, isEditing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
    setIsEditing(false);
  }

  function cancel() {
    setDraft(value);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        aria-label={t("ariaEditRoomType", { value })}
        className={`${PILL_CLASSES} truncate block max-w-full text-left cursor-text hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-gold`}
      >
        {value}
      </button>
    );
  }

  return (
    <>
      <span
        ref={measureRef}
        aria-hidden
        className={`${PILL_CLASSES} absolute invisible whitespace-pre`}
      >
        {draft || " "}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        style={{ width: `${width}px` }}
        aria-label={t("ariaRoomType")}
        className={`${PILL_CLASSES} border-0 outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-gold`}
      />
    </>
  );
}
