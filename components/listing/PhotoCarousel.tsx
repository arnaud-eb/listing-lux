"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface PhotoCarouselProps {
  urls: string[];
  alt?: string;
}

/** Number of off-screen images to eager-load in mobile carousel */
const MOBILE_EAGER_COUNT = 2;

export default function PhotoCarousel({
  urls,
  alt = "Property photo",
}: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

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

      {/* Dot indicators (mobile only, multiple photos) */}
      {urls.length > 1 && (
        <div className="flex justify-center gap-0 pt-2 pb-1 lg:hidden" role="tablist" aria-label="Photo navigation">
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === mobileIndex}
              aria-label={`Photo ${i + 1}`}
              onClick={() => scrollToSlide(i)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer"
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
      )}

      {/* Desktop: primary image + thumbnail strip (hidden below lg) */}
      <div className="hidden lg:flex flex-col gap-3">
        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100">
          <Image
            src={urls[activeIndex]}
            alt={`${alt} ${activeIndex + 1}`}
            fill
            className="object-cover transition-opacity duration-200"
            sizes="50vw"
            priority
          />
          {urls.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
              {activeIndex + 1} / {urls.length}
            </div>
          )}
        </div>

        {urls.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-1">
            {urls.map((url, i) => (
              <Button
                key={i}
                type="button"
                variant="ghost"
                onClick={() => setActiveIndex(i)}
                className={`relative w-16 h-12 shrink-0 rounded-md overflow-hidden p-0 border-2 ${
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
                  sizes="64px"
                  loading="lazy"
                />
              </Button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
