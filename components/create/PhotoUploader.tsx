"use client";

import { useRef } from "react";
import { CloudUpload, PlusCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ListingPhoto } from "@/lib/types";
import { MAX_PHOTOS, MAX_PHOTO_SIZE, MIN_PHOTOS } from "@/lib/constants";
import PhotoThumbnail from "./PhotoThumbnail";

interface PhotoUploaderProps {
  photos: ListingPhoto[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (id: string) => void;
}

export default function PhotoUploader({
  photos,
  onAddPhotos,
  onRemovePhoto,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const available = MAX_PHOTOS - photos.length;
    if (available <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    const all = Array.from(files);
    const oversized = all.filter((f) => f.size > MAX_PHOTO_SIZE);
    const valid = all.filter((f) => f.size <= MAX_PHOTO_SIZE);
    if (oversized.length > 0) {
      toast.error(
        `${oversized.length} file${oversized.length > 1 ? "s" : ""} exceeded the 10 MB limit and ${oversized.length > 1 ? "were" : "was"} skipped.`,
      );
    }
    const selected = valid.slice(0, available);
    if (selected.length > 0) onAddPhotos(selected);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-deep">
          Property Gallery
        </h2>
        <span className="text-xs text-gold font-medium max-md:hidden">
          Recommended: 10+ high-res photos
        </span>
      </div>

      {/* Drop zone */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          aria-label="Upload property photos — drag and drop or press to browse"
          className="w-full border-2 border-dashed border-gold/30 rounded-xl bg-gold/5 p-12 max-md:p-6 flex flex-col items-center justify-center text-center group hover:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 transition-colors cursor-pointer outline-none"
        >
          <div className="size-14 rounded-full bg-gold/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <CloudUpload className="text-gold size-6" />
          </div>
          <p className="text-base font-medium text-navy-deep">
            Drag and drop images here
          </p>
          <p className="text-slate-500 text-sm mt-1">
            or click to browse your files (JPG, PNG, WebP up to 10MB)
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {photos.length}/{MAX_PHOTOS} uploaded
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,image/heic,.heic,.heif"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </button>
      )}

      {/* Thumbnail grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              onRemove={onRemovePhoto}
              isFirst={index === 0}
            />
          ))}
          {/* Add more tile */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Add more photos"
              className="aspect-square rounded-lg border-2 border-gold/10 flex flex-col items-center justify-center text-gold/60 hover:text-gold hover:bg-gold/5 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 transition-all cursor-pointer outline-none"
            >
              <PlusCircle className="size-6 mb-1" />
              <span className="text-xs font-semibold">Add More</span>
            </button>
          )}
        </div>
      )}

      {/* AI Tip — replaces ugly minimum photos notice */}
      {photos.length > 0 && photos.length < MIN_PHOTOS && (
        <div className="flex items-start gap-3 rounded-lg border border-gold/20 bg-gold/5 p-3">
          <div className="size-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="text-gold size-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-navy-deep">AI Tip</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Add {MIN_PHOTOS - photos.length} more photo
              {MIN_PHOTOS - photos.length > 1 ? "s" : ""} to enable AI
              generation. Our AI performs best with photos of the kitchen,
              primary bedroom, and living area.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
