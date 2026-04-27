"use client";

import Image from "next/image";

interface PhotoSelectorProps {
  /** All available photo URLs (from the property). */
  photoUrls: string[];
  /** Ordered list of currently selected URLs (click order = display order). */
  selected: string[];
  /** Called when the user toggles a photo. */
  onToggle: (url: string) => void;
  /** Called when the user clicks the "Clear" button to deselect everything. */
  onClear?: () => void;
  /** Maximum allowed selections. */
  max?: number;
  /**
   * When true, the built-in selection counter / Clear footer is hidden.
   * Useful when the parent renders this UI in a sticky footer (e.g. the
   * adaptive PDF wizard sheet on mobile, where the counter must remain
   * visible while the photo grid scrolls).
   */
  hideFooter?: boolean;
}

/**
 * Grid of property photos with click-order selection.
 *
 * - Click an unselected photo → adds to selection, shows its order number badge.
 * - Click a selected photo → removes it, subsequent numbers auto-shift.
 * - When `max` is reached, unselected photos become dimmed/non-clickable.
 * - First selected photo (number 1) becomes the PDF hero (full-width).
 */
export default function PhotoSelector({
  photoUrls,
  selected,
  onToggle,
  onClear,
  max = 5,
  hideFooter = false,
}: PhotoSelectorProps) {
  const atMax = selected.length >= max;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photoUrls.map((url, i) => {
          const position = selected.indexOf(url);
          const isSelected = position !== -1;
          const isDisabled = !isSelected && atMax;

          return (
            <button
              key={url}
              type="button"
              onClick={() => {
                if (isDisabled) return;
                onToggle(url);
              }}
              disabled={isDisabled}
              aria-label={
                isSelected
                  ? `Photo ${i + 1} selected as position ${position + 1} — click to remove`
                  : `Select photo ${i + 1}`
              }
              aria-pressed={isSelected}
              className={`group relative aspect-[16/10] overflow-hidden rounded-lg border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-gold shadow-md shadow-gold/20 cursor-pointer"
                  : isDisabled
                    ? "border-gray-200 opacity-30 cursor-not-allowed"
                    : "border-gray-200 hover:border-gold/50 cursor-pointer"
              }`}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />
              {/* Order badge */}
              {isSelected && (
                <span className="absolute top-2 right-2 z-10 size-7 flex items-center justify-center rounded-full bg-gold text-navy-deep font-bold text-sm shadow-md">
                  {position + 1}
                </span>
              )}
              {/* Dimming overlay for disabled state on hover */}
              {!isSelected && !isDisabled && (
                <span className="absolute inset-0 bg-gold/0 group-hover:bg-gold/5 transition-colors" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selection counter + Clear button. Hidden when the parent wants to
          render this UI elsewhere (e.g. wizard sticky footer). */}
      {!hideFooter && (
        <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
          <p aria-live="polite">
            {selected.length} / {max} selected
            {selected.length === 0 &&
              " — click photos in the order you want them to appear"}
          </p>
          {selected.length > 0 && onClear && (
            <>
              <span aria-hidden="true" className="text-gray-300">
                ·
              </span>
              <button
                type="button"
                onClick={onClear}
                className="text-gray-500 hover:text-navy-deep transition-colors cursor-pointer outline-none focus-visible:text-navy-deep focus-visible:underline underline-offset-4"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
