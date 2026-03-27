"use client";

import { memo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ListingPhoto } from "@/lib/types";

interface PhotoThumbnailProps {
  photo: ListingPhoto;
  onRemove: (id: string) => void;
  isFirst?: boolean;
}

export default memo(function PhotoThumbnail({
  photo,
  onRemove,
  isFirst,
}: PhotoThumbnailProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-200 group">
        {/* Prefer local blob (instant, in-memory) — fall back to remote for restored drafts */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.localPreviewUrl || photo.publicUrl || ""}
          alt="Property photo"
          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
          draggable={false}
        />

        {/* Uploading overlay */}
        {photo.status === "uploading" && (
          <div
            className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1"
            aria-live="polite"
          >
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin motion-reduce:animate-none" role="status" aria-label="Uploading" />
            <span className="text-white text-xs font-medium">
              {photo.uploadProgress > 0
                ? `${photo.uploadProgress}%`
                : "Uploading…"}
            </span>
          </div>
        )}

        {/* Analyzing overlay */}
        {photo.status === "processing" && (
          <div
            className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2"
            aria-live="polite"
          >
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin motion-reduce:animate-none" role="status" aria-label="Analyzing photo" />
            <span className="text-white text-xs font-medium">Analyzing…</span>
          </div>
        )}

        {/* Error overlay */}
        {photo.status === "error" && (
          <div
            className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
            role="alert"
          >
            <span className="text-red-700 text-xs font-medium px-2 py-1 bg-red-100 rounded">
              Error
            </span>
          </div>
        )}

        {/* Top-left badge: room type or "Main View" */}
        {photo.status === "ready" && photo.aiAnalysis ? (
          <div className="absolute top-2 left-2 max-w-3/4">
            <span className="bg-gold text-white text-2xs px-2 py-0.5 rounded font-bold uppercase tracking-tighter truncate block">
              {photo.aiAnalysis.room_type}
            </span>
          </div>
        ) : isFirst && photo.status === "ready" ? (
          <div className="absolute top-2 left-2">
            <span className="bg-gold text-white text-2xs px-2 py-0.5 rounded font-bold uppercase tracking-tighter">
              Main View
            </span>
          </div>
        ) : null}

        {/* Remove button — visible on hover & always reachable via keyboard */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onRemove(photo.id)}
          aria-label="Remove photo"
          className="absolute top-1.5 right-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Feature chips below thumbnail — min-h reserves space to prevent CLS */}
      <div className="min-h-5.5 flex flex-wrap gap-1">
        {photo.aiAnalysis && photo.aiAnalysis.features.length > 0 &&
          photo.aiAnalysis.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="text-2xs bg-gold/10 text-gold border border-gold/30 rounded-full px-2 py-0.5 leading-tight"
            >
              {feature}
            </span>
          ))}
      </div>
    </div>
  );
});
