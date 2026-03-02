'use client'

import { useState } from 'react'
import Image from 'next/image'

interface PhotoCarouselProps {
  urls: string[]
  alt?: string
}

export default function PhotoCarousel({ urls, alt = 'Property photo' }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (urls.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
        No photos
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Primary image (desktop) */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 max-lg:hidden">
        <Image
          src={urls[activeIndex]}
          alt={`${alt} ${activeIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-200"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={activeIndex === 0}
        />
        {urls.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
            {activeIndex + 1} / {urls.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip (desktop) */}
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 max-lg:hidden">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative w-16 h-12 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                i === activeIndex ? 'border-[#C5A059]' : 'border-transparent'
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
              />
            </button>
          ))}
        </div>
      )}

      {/* CSS scroll-snap carousel (mobile only) */}
      <div
        className="hidden max-lg:flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {urls.map((url, i) => (
          <div
            key={i}
            className="relative aspect-[4/3] w-[85vw] flex-shrink-0 rounded-xl overflow-hidden snap-center bg-gray-100"
          >
            <Image
              src={url}
              alt={`${alt} ${i + 1}`}
              fill
              className="object-cover"
              sizes="85vw"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
