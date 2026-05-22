"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogScrollBody,
  DialogStickyFooter,
  DialogTitle,
} from "@/components/ui/dialog";

interface PhotoLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  /** Index of the photo to show first when the lightbox opens. */
  initialIndex?: number;
  /** Accessible alt prefix; "{prefix} {n+1}" is used per image. */
  alt?: string;
}

/**
 * Full-screen photo browser. Reuses the adaptive Dialog primitive so it lays
 * out correctly on every viewport — centered modal capped at 90dvh on
 * desktop, bottom sheet at 95dvh on mobile, with a sticky footer for the
 * counter and prev/next controls.
 *
 * Hero uses `object-contain` so portrait/landscape mix doesn't crop.
 */
export default function PhotoLightbox({
  open,
  onOpenChange,
  urls,
  initialIndex = 0,
  alt,
}: PhotoLightboxProps) {
  const t = useTranslations("wizard.listing.lightbox");
  const tCarousel = useTranslations("wizard.listing.photoCarousel");
  const resolvedAlt = alt ?? tCarousel("altPrefix");
  const [index, setIndex] = useState(initialIndex);

  // Re-point to initialIndex each time the lightbox transitions to open, so a
  // reopen always starts on the freshly clicked image.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setIndex(initialIndex);
  }

  const goPrev = useCallback(() => {
    setIndex((i) => (i === 0 ? urls.length - 1 : i - 1));
  }, [urls.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i === urls.length - 1 ? 0 : i + 1));
  }, [urls.length]);

  // Keyboard navigation: ←/→ steps through photos. Esc is handled by Dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goPrev, goNext]);

  if (urls.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-navy-deep">
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description", { current: index + 1, total: urls.length })}
          </DialogDescription>
        </DialogHeader>

        <DialogScrollBody className="flex flex-col gap-4">
          {/* Hero — object-contain so vertical photos aren't cropped. */}
          <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={urls[index]}
              alt={`${resolvedAlt} ${index + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 75vw"
              priority
            />
            {urls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={t("ariaPrev")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 size-12 flex items-center justify-center rounded-full bg-black/65 text-white hover:bg-black/80 shadow-lg transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={t("ariaNext")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 size-12 flex items-center justify-center rounded-full bg-black/65 text-white hover:bg-black/80 shadow-lg transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail grid */}
          {urls.length > 1 && (
            <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-3">
              {urls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={t("ariaThumb", { n: i + 1 })}
                  aria-current={i === index ? "true" : undefined}
                  className={`relative aspect-4/3 overflow-hidden rounded-md border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 cursor-pointer ${
                    i === index
                      ? "border-gold"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 20vw"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogScrollBody>

        {urls.length > 1 && (
          <DialogStickyFooter className="justify-center">
            <span
              className="text-xs font-medium text-gray-500 tabular-nums"
              aria-live="polite"
            >
              {index + 1} / {urls.length}
            </span>
          </DialogStickyFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
