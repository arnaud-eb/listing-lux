'use client'

import { useRef } from 'react'
import { Upload } from 'lucide-react'
import type { ListingPhoto } from '@/lib/types'
import PhotoThumbnail from './PhotoThumbnail'

const MAX_PHOTOS = 10

interface PhotoUploaderProps {
  photos: ListingPhoto[]
  onAddPhotos: (files: File[]) => void
  onRemovePhoto: (id: string) => void
}

export default function PhotoUploader({
  photos,
  onAddPhotos,
  onRemovePhoto,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const available = MAX_PHOTOS - photos.length
    if (available <= 0) return
    const selected = Array.from(files).slice(0, available)
    onAddPhotos(selected)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const canAddMore = photos.length < MAX_PHOTOS

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#C5A059] hover:bg-[#C5A059]/5 transition-colors"
        >
          <Upload className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-sm font-medium text-gray-600">
            Drag &amp; drop photos here, or{' '}
            <span className="text-[#C5A059] underline">browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPEG, PNG, WebP, HEIC · Up to {MAX_PHOTOS} photos
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {photos.length}/{MAX_PHOTOS} uploaded
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,image/heic,.heic,.heif"
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
            aria-label="Upload property photos"
          />
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
          {photos.map((photo) => (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              onRemove={onRemovePhoto}
            />
          ))}
        </div>
      )}

      {/* Minimum photos notice */}
      {photos.length > 0 && photos.length < 5 && (
        <p className="text-xs text-amber-600 text-center">
          Add at least {5 - photos.length} more photo{5 - photos.length > 1 ? 's' : ''} to enable generation
        </p>
      )}
    </div>
  )
}
