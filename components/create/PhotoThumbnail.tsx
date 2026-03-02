'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import type { ListingPhoto } from '@/lib/types'

interface PhotoThumbnailProps {
  photo: ListingPhoto
  onRemove: (id: string) => void
}

export default function PhotoThumbnail({ photo, onRemove }: PhotoThumbnailProps) {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
      {/* Image preview */}
      {photo.publicUrl ? (
        <Image
          src={photo.publicUrl}
          alt="Property photo"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.localPreviewUrl}
          alt="Property photo preview"
          className="w-full h-full object-cover"
        />
      )}

      {/* Status badge */}
      {photo.status === 'uploading' && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-white text-xs font-medium">
            {photo.uploadProgress > 0 ? `${photo.uploadProgress}%` : 'Uploading…'}
          </span>
        </div>
      )}

      {photo.status === 'processing' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-white text-xs font-medium px-2 py-1 bg-black/60 rounded">
            Processing…
          </span>
        </div>
      )}

      {photo.status === 'error' && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
          <span className="text-red-700 text-xs font-medium px-2 py-1 bg-red-100 rounded">
            Error
          </span>
        </div>
      )}

      {photo.status === 'ready' && (
        <div className="absolute top-1.5 left-1.5">
          <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
            ✓
          </span>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(photo.id)}
        aria-label="Remove photo"
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
      >
        <X size={12} />
      </button>
    </div>
  )
}
