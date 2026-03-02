'use client'

import { useState, useCallback, useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PhotoUploader from '@/components/create/PhotoUploader'
import StepperInput from '@/components/create/StepperInput'
import FeatureChips from '@/components/create/FeatureChips'
import NeighborhoodSelector from '@/components/create/NeighborhoodSelector'
import GenerateBar from '@/components/create/GenerateBar'
import { getSignedUploadUrl, confirmUpload, saveProperty } from './actions'
import type { ListingPhoto, PropertyFormData } from '@/lib/types'

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'villa', label: 'Villa' },
]

export default function CreatePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [bedrooms, setBedrooms] = useState(2)
  const [bathrooms, setBathrooms] = useState(1)
  const [sqm, setSqm] = useState<number | ''>('')
  const [price, setPrice] = useState<number | ''>('')
  const [neighborhood, setNeighborhood] = useState('')
  const [propertyType, setPropertyType] = useState('apartment')
  const [features, setFeatures] = useState<Record<string, boolean>>({})

  // Photos
  const [photos, setPhotos] = useState<ListingPhoto[]>([])
  const [optimisticPhotos, addOptimisticPhoto] = useOptimistic<
    ListingPhoto[],
    ListingPhoto
  >(photos, (state, newPhoto) => [...state, newPhoto])

  const readyPhotoCount = optimisticPhotos.filter((p) => p.status === 'ready').length

  const hasRequiredFields =
    bedrooms > 0 &&
    typeof sqm === 'number' && sqm > 0 &&
    typeof price === 'number' && price > 0 &&
    neighborhood !== ''

  async function uploadPhoto(file: File): Promise<void> {
    const id = crypto.randomUUID()
    const localPreviewUrl = URL.createObjectURL(file)

    const optimisticEntry: ListingPhoto = {
      id,
      localPreviewUrl,
      supabasePath: null,
      publicUrl: null,
      status: 'uploading',
      uploadProgress: 0,
      aiAnalysis: null,
    }

    startTransition(() => {
      addOptimisticPhoto(optimisticEntry)
    })

    try {
      // Get a temporary property ID for the upload path
      const tempPropertyId = `pending-${crypto.randomUUID()}`
      const { signedUrl, path } = await getSignedUploadUrl(file.name, file.type, tempPropertyId)

      // Upload directly to Supabase via signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const { publicUrl } = await confirmUpload(path, tempPropertyId)

      setPhotos((prev) => {
        const existing = prev.find((p) => p.id === id)
        if (existing) {
          return prev.map((p) =>
            p.id === id
              ? { ...p, status: 'ready', supabasePath: path, publicUrl, uploadProgress: 100 }
              : p
          )
        }
        return [
          ...prev,
          {
            id,
            localPreviewUrl,
            supabasePath: path,
            publicUrl,
            status: 'ready',
            uploadProgress: 100,
            aiAnalysis: null,
          },
        ]
      })
    } catch {
      setPhotos((prev) => {
        const existing = prev.find((p) => p.id === id)
        if (existing) {
          return prev.map((p) => (p.id === id ? { ...p, status: 'error' } : p))
        }
        return [
          ...prev,
          {
            id,
            localPreviewUrl,
            supabasePath: null,
            publicUrl: null,
            status: 'error',
            uploadProgress: 0,
            aiAnalysis: null,
          },
        ]
      })
    }
  }

  const handleAddPhotos = useCallback((files: File[]) => {
    files.forEach((file) => uploadPhoto(file))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRemovePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  async function handleGenerate() {
    if (!hasRequiredFields || readyPhotoCount < 5) return

    const readyPhotos = photos.filter((p) => p.status === 'ready' && p.publicUrl)
    const photoUrls = readyPhotos.map((p) => p.publicUrl!)

    const formData: PropertyFormData = {
      bedrooms,
      bathrooms,
      sqm: sqm as number,
      price: price as number,
      neighborhood,
      property_type: propertyType,
      features,
      photo_urls: photoUrls,
    }

    startTransition(async () => {
      const { id } = await saveProperty(formData)
      router.push(`/listing/${id}`)
    })
  }

  return (
    <div className="min-h-screen bg-[#f6f7f7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="font-serif text-xl font-bold text-[#1a2332]">Create Listing</h1>
          <a href="/" className="text-sm text-gray-500 hover:text-[#1a2332] transition-colors">
            ← Back
          </a>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-8 items-start max-lg:grid-cols-1">

          {/* Left column: Photos */}
          <div className="sticky top-8 max-lg:static">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-[#1a2332] mb-4">Property Photos</h2>
              <PhotoUploader
                photos={optimisticPhotos}
                onAddPhotos={handleAddPhotos}
                onRemovePhoto={handleRemovePhoto}
              />
            </div>
          </div>

          {/* Right column: Form */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-[#1a2332] mb-6">Property Details</h2>

              <div className="flex flex-col gap-5">
                {/* Property type */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="property-type">Property Type</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger id="property-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-2 gap-4">
                  <StepperInput
                    id="bedrooms"
                    label="Bedrooms"
                    value={bedrooms}
                    onChange={setBedrooms}
                    min={0}
                    max={10}
                    step={1}
                  />
                  <StepperInput
                    id="bathrooms"
                    label="Bathrooms"
                    value={bathrooms}
                    onChange={setBathrooms}
                    min={1}
                    max={5}
                    step={0.5}
                  />
                </div>

                {/* Size */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sqm">Size (m²) *</Label>
                  <Input
                    id="sqm"
                    type="number"
                    placeholder="e.g. 120"
                    value={sqm}
                    onChange={(e) => setSqm(e.target.value ? Number(e.target.value) : '')}
                    min={1}
                    required
                  />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="price">Asking Price (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g. 850000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    min={1}
                    required
                  />
                </div>

                {/* Neighborhood */}
                <NeighborhoodSelector
                  value={neighborhood}
                  onChange={setNeighborhood}
                  sqm={typeof sqm === 'number' ? sqm : 0}
                />

                {/* Features */}
                <FeatureChips features={features} onChange={setFeatures} />
              </div>
            </div>

            {/* Generate bar (desktop: inline; mobile: sticky via CSS) */}
            <GenerateBar
              readyPhotoCount={readyPhotoCount}
              hasRequiredFields={hasRequiredFields}
              onGenerate={handleGenerate}
              isLoading={isPending}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
