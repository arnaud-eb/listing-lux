"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MIN_PHOTOS } from "@/lib/constants";

interface GenerateBarProps {
  readyPhotoCount: number;
  inFlightPhotoCount?: number;
  hasRequiredFields: boolean;
  isLoading?: boolean;
}

export default function GenerateBar({
  readyPhotoCount,
  inFlightPhotoCount = 0,
  hasRequiredFields,
  isLoading = false,
}: GenerateBarProps) {
  const canGenerate =
    readyPhotoCount >= MIN_PHOTOS &&
    inFlightPhotoCount === 0 &&
    hasRequiredFields &&
    !isLoading;
  const photosNeeded = MIN_PHOTOS - readyPhotoCount;

  return (
    <div className="flex flex-col items-center gap-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-lg:sticky max-lg:bottom-4 max-lg:shadow-[0_-4px_12px_rgba(0,0,0,0.08)] max-lg:z-10">
      {/* Generate button */}
      <Button
        type="submit"
        disabled={!canGenerate}
        className="w-full h-12 bg-gold text-navy-deep font-bold text-sm hover:bg-gold/90 disabled:opacity-40 border-0 rounded-lg shadow-md shadow-gold/20"
        size="lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span
              className="w-4 h-4 border-2 border-navy-deep border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
              role="status"
              aria-label="Generating"
            />
            Generating…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Generate Listing
          </span>
        )}
      </Button>

      {/* Validation hint */}
      {!canGenerate && !isLoading && (
        <p className="text-xs text-gray-400" role="status">
          {photosNeeded > 0
            ? `${photosNeeded} more photo${photosNeeded > 1 ? "s" : ""} needed`
            : inFlightPhotoCount > 0
              ? `Analyzing ${inFlightPhotoCount} photo${inFlightPhotoCount > 1 ? "s" : ""}`
              : "Fill in all required fields to continue"}
        </p>
      )}
    </div>
  );
}
