"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteListingButton from "@/app/(wizard)/history/DeleteListingButton";
import ListingGenerator from "@/components/listing/ListingGenerator";
import type { Listing, Property } from "@/lib/types";

interface ListingPageClientProps {
  property: Property;
  initialListings: Listing[];
  /** Server-rendered header content (title, details) passed as a slot. */
  header: React.ReactNode;
  /** Server-rendered gallery slot (PhotoCarousel). */
  gallery: React.ReactNode;
}

/**
 * Single client boundary for the listing detail page.
 *
 * Owns the `isGenerating` state shared between the delete button and the
 * listing generator. Static content (title, details, gallery) is passed as
 * server-rendered slots via children props, following the Next.js composition
 * pattern.
 */
export default function ListingPageClient({
  property,
  initialListings,
  header,
  gallery,
}: ListingPageClientProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <>
      <div className="mb-8 relative">
        {header}
        <DeleteListingButton
          propertyId={property.id}
          variant="header"
          disabled={isGenerating}
          onDeleted={() => router.push("/history")}
        />
      </div>

      <div className="grid grid-cols-[1fr_2fr] gap-8 max-lg:grid-cols-1 max-xl:grid-cols-[2fr_3fr]">
        <div className="max-lg:order-1">{gallery}</div>
        <div className="max-lg:order-2">
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
