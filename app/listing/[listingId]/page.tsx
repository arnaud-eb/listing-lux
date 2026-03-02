import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase.server'
import PhotoCarousel from '@/components/listing/PhotoCarousel'
import LanguageTabs from '@/components/listing/LanguageTabs'
import ListingContent from '@/components/listing/ListingContent'
import ExportMenu from '@/components/listing/ExportMenu'
import PriceDisplay from '@/components/shared/PriceDisplay'
import type { Property, Language } from '@/lib/types'

interface PageProps {
  params: Promise<{ listingId: string }>
}

export default async function ListingPage({ params }: PageProps) {
  // Next.js 16: params is async
  const { listingId } = await params

  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', listingId)
    .single()

  if (error || !property) {
    notFound()
  }

  const p = property as Property

  return (
    <div className="min-h-screen bg-[#f6f7f7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-bold text-[#1a2332]">
            ListingLux AI
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="text-sm text-gray-500 hover:text-[#1a2332] transition-colors"
            >
              ← New Listing
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap max-sm:flex-col">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1a2332] capitalize">
              {p.property_type} in {p.neighborhood.replace(/-/g, ' ')}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{p.bedrooms} bed</span>
              <span>·</span>
              <span>{p.bathrooms} bath</span>
              <span>·</span>
              <span>{p.sqm} m²</span>
              <span>·</span>
              <PriceDisplay amount={p.price} className="font-semibold text-[#1a2332]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/create"
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Regenerate
            </Link>
            <ExportMenu />
          </div>
        </div>

        {/* Two-column layout: gallery left, content right */}
        <div className="grid grid-cols-[1fr_2fr] gap-8 max-lg:grid-cols-1">
          {/* Gallery */}
          <div className="max-lg:order-2">
            <PhotoCarousel
              urls={p.photo_urls}
              alt={`${p.property_type} in ${p.neighborhood}`}
            />
          </div>

          {/* Listing content with language tabs */}
          <div className="max-lg:order-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <LanguageTabs>
                {(language: Language) => (
                  <ListingContent language={language} isGenerating={true} />
                )}
              </LanguageTabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
