"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import DeleteListingButton from "@/app/[locale]/(wizard)/history/DeleteListingButton";
import ListingGenerator from "@/components/listing/ListingGenerator";
import PropertyHeader from "@/components/listing/PropertyHeader";
import type { Listing, Property } from "@/lib/types";

interface ListingPageClientProps {
  property: Property;
  initialListings: Listing[];
  /** Server-rendered gallery slot (PhotoCarousel). */
  gallery: React.ReactNode;
}

export default function ListingPageClient({
  property: initialProperty,
  initialListings,
  gallery,
}: ListingPageClientProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingProperty, setIsEditingProperty] = useState(false);
  const [property, setProperty] = useState(initialProperty);
  const t = useTranslations("wizard.listing");

  return (
    <>
      <div className="mb-8 relative">
        <PropertyHeader
          property={property}
          onUpdate={setProperty}
          onEditingChange={setIsEditingProperty}
        />
        <div className={`mt-3 lg:absolute lg:right-0 lg:top-2 flex items-center gap-2${isEditingProperty ? " lg:hidden" : ""}`}>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-400 hover:bg-gray-50 shadow-none transition-colors"
          >
            <Plus className="size-3" />
            {t("newListing")}
          </Link>
          <DeleteListingButton
            propertyId={property.id}
            variant="header"
            disabled={isGenerating}
            onDeleted={() => router.push("/history")}
          />
        </div>
      </div>

      {/* Two-column layout via standard grid + col-span. Each grid-cols-N
          track is `minmax(0, 1fr)` by default, so children with wide
          intrinsic content (the photo thumbnail strip) can't blow past
          their share. xl+ : 1 / 2 (gallery / content). lg–xl: 2 / 3.
          Below lg: stacked. */}
      <div className="grid grid-cols-3 gap-8 max-xl:grid-cols-5 max-lg:grid-cols-1">
        <div className="col-span-1 max-xl:col-span-2 max-lg:col-span-full max-lg:order-1">
          {gallery}
        </div>
        <div className="col-span-2 max-xl:col-span-3 max-lg:col-span-full max-lg:order-2">
          <ListingGenerator
            propertyId={property.id}
            initialListings={initialListings}
            property={property}
            onGeneratingChange={setIsGenerating}
          />
        </div>
      </div>
    </>
  );
}
