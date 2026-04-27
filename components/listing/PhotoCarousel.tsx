"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import PhotoLightbox from "./PhotoLightbox";

interface PhotoCarouselProps {
  urls: string[];
  alt?: string;
}

/** Number of thumbnails visible on desktop before collapsing the rest into
 *  a "+N more" tile that opens the full lightbox. Beyond this, the strip
 *  starts to feel cluttered and pushes the gallery column too wide. */
const DESKTOP_THUMB_LIMIT = 4;

/** Number of off-screen images to eager-load in mobile carousel */
const MOBILE_EAGER_COUNT = 2;

/** Above this count we render a "1 / N" counter on mobile instead of dots
 *  (the row of 44px tap targets would otherwise overflow horizontally). */
const DOT_INDICATOR_LIMIT = 8;

export default function PhotoCarousel({
  urls,
  alt = "Property photo",
}: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  // Desktop thumbnail layout: when there are more than DESKTOP_THUMB_LIMIT
  // photos, show the first (LIMIT - 1) thumbs and use the last tile as a
  // "+N more" overlay that opens the full lightbox. The grid column count
  // matches the actual tile count so each tile takes a consistent fraction
  // of the gallery column whether there are 2 photos or 13.
  const hasOverflow = urls.length > DESKTOP_THUMB_LIMIT;
  const visibleThumbCount = hasOverflow
    ? DESKTOP_THUMB_LIMIT - 1
    : urls.length;
  const remainingCount = urls.length - visibleThumbCount;
  const thumbSlotCount = visibleThumbCount + (hasOverflow ? 1 : 0);

  // Track which slide is visible via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || urls.length <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = itemRefs.current.indexOf(
              entry.target as HTMLDivElement,
            );
            if (index !== -1) setMobileIndex(index);
          }
        }
      },
      { root: container, threshold: 0.6 },
    );

    for (const item of itemRefs.current) {
      if (item) observer.observe(item);
    }

    return () => observer.disconnect();
  }, [urls.length]);

  // One-time nudge hint on mount — scrolls right then snaps back
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || urls.length <= 1) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const timer = setTimeout(() => {
      container.scrollTo({ left: 40, behavior: "smooth" });
      setTimeout(() => {
        container.scrollTo({ left: 0, behavior: "smooth" });
      }, 400);
    }, 600);

    return () => clearTimeout(timer);
  }, [urls.length]);

  const setItemRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      itemRefs.current[index] = el;
    },
    [],
  );

  const scrollToSlide = useCallback(
    (index: number) => {
      const item = itemRefs.current[index];
      if (item) {
        item.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    },
    [],
  );

  if (urls.length === 0) {
    return (
      <div className="aspect-4/3 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
        No photos
      </div>
    );
  }

  return (
    <>
      {/* Mobile: scroll-snap carousel (hidden on lg+) */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 lg:hidden scrollbar-hide"
      >
        {urls.map((url, i) => (
          <div
            key={i}
            ref={setItemRef(i)}
            className="relative aspect-4/3 w-[85vw] shrink-0 rounded-xl overflow-hidden snap-center bg-gray-100"
          >
            <Image
              src={url}
              alt={`${alt} ${i + 1}`}
              fill
              className="object-cover"
              sizes="85vw"
              priority={i === 0}
              loading={i <= MOBILE_EAGER_COUNT ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {/* Indicator (mobile only, multiple photos). Dots when ≤8 photos
          (each tap target is 44px so the row fits a phone), counter when
          more — otherwise the dot row overflows the viewport horizontally. */}
      {urls.length > 1 &&
        (urls.length <= DOT_INDICATOR_LIMIT ? (
          <div
            className="flex justify-center gap-0 pt-2 pb-1 lg:hidden"
            role="tablist"
            aria-label="Photo navigation"
          >
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === mobileIndex}
                aria-label={`Photo ${i + 1}`}
                onClick={() => scrollToSlide(i)}
                className="flex items-center justify-center min-w-11 min-h-11 cursor-pointer"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    i === mobileIndex
                      ? "w-5 h-1.5 bg-gold"
                      : "w-1.5 h-1.5 bg-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        ) : (
          <div
            className="flex justify-center pt-3 pb-1 lg:hidden"
            aria-label="Photo navigation"
          >
            <span
              className="text-2xs font-medium text-gray-500 tabular-nums"
              aria-live="polite"
            >
              {mobileIndex + 1} / {urls.length}
            </span>
          </div>
        ))}

      {/* Desktop: primary image + capped thumbnail strip + lightbox.
          Hidden below lg. */}
      <div className="hidden lg:flex flex-col gap-3">
        <button
          type="button"
          onClick={() => openLightbox(activeIndex)}
          className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100 cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          aria-label="Open photo gallery"
        >
          <Image
            src={urls[activeIndex]}
            alt={`${alt} ${activeIndex + 1}`}
            fill
            className="object-cover transition-opacity duration-200"
            sizes="50vw"
            priority
          />
          {urls.length > 1 && (
            <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
              {activeIndex + 1} / {urls.length}
            </span>
          )}
        </button>

        {urls.length > 1 && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${thumbSlotCount}, minmax(0, 1fr))`,
            }}
          >
            {urls.slice(0, visibleThumbCount).map((url, i) => (
              <Button
                key={i}
                type="button"
                variant="ghost"
                onClick={() => setActiveIndex(i)}
                className={`relative aspect-4/3 w-full rounded-md overflow-hidden p-0 border-2 ${
                  i === activeIndex ? "border-gold" : "border-transparent"
                }`}
                aria-label={`View photo ${i + 1}`}
                aria-pressed={i === activeIndex}
              >
                <Image
                  src={url}
                  alt={`${alt} thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 12vw, 8vw"
                  loading="lazy"
                />
              </Button>
            ))}
            {hasOverflow && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => openLightbox(visibleThumbCount)}
                className="relative aspect-4/3 w-full rounded-md overflow-hidden p-0 border-2 border-transparent group"
                aria-label={`View all ${urls.length} photos`}
              >
                <Image
                  src={urls[visibleThumbCount]}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 12vw, 8vw"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-black/55 group-hover:bg-black/65 transition-colors flex items-center justify-center text-white font-semibold text-sm">
                  +{remainingCount}
                </span>
              </Button>
            )}
          </div>
        )}
      </div>

      <PhotoLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        urls={urls}
        initialIndex={lightboxIndex}
        alt={alt}
      />
    </>
  );
}
