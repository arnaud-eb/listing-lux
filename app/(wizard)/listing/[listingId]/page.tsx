import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase.server";
import { verifyPropertyOwnership, UnauthorizedError } from "@/lib/auth";
import { getNeighborhoodBySlug } from "@/lib/markets";
import PhotoCarousel from "@/components/listing/PhotoCarousel";
import PriceDisplay from "@/components/shared/PriceDisplay";
import ListingPageClient from "./listing-page-client";
import { propertySchema } from "@/lib/schemas/property";
import type { Listing, Property } from "@/lib/types";
import { z } from "zod";

interface PageProps {
  params: Promise<{ listingId: string }>;
}

const getProperty = cache(async (id: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;

  // Verify session ownership
  try {
    await verifyPropertyOwnership(data.session_id);
  } catch (e) {
    if (e instanceof UnauthorizedError) return null;
    throw e;
  }

  const parsed = propertySchema.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid property data:", parsed.error.flatten());
    return null;
  }
  return parsed.data;
});

const getExistingListings = cache(async function getExistingListings(propertyId: string): Promise<Listing[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("property_id", propertyId);
  return data ?? [];
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { listingId } = await params;
  const p = await getProperty(listingId);

  if (!p) {
    return { title: "Listing Not Found — ListingLux AI" };
  }

  const neighborhood = getNeighborhoodBySlug(p.neighborhood);
  const neighborhoodName = neighborhood?.name ?? p.neighborhood.replace(/-/g, " ");
  const typeName = p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1);

  return {
    title: `${typeName} in ${neighborhoodName} — ListingLux AI`,
    description: `${p.bedrooms} bed · ${p.bathrooms} bath · ${p.sqm} m² luxury ${p.property_type} in ${neighborhoodName}, Luxembourg`,
    openGraph: {
      images: p.photo_urls[0] ? [{ url: p.photo_urls[0] }] : [],
    },
    robots: { index: false, follow: false },
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { listingId } = await params;

  if (!z.string().uuid().safeParse(listingId).success) {
    notFound();
  }

  // Fetch property + existing listings in parallel
  const [p, existingListings] = await Promise.all([
    getProperty(listingId),
    getExistingListings(listingId),
  ]);

  if (!p) {
    notFound();
  }

  const neighborhood = getNeighborhoodBySlug(p.neighborhood);
  const neighborhoodName = neighborhood?.name ?? p.neighborhood.replace(/-/g, " ");

  const property: Property = {
    id: p.id,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    sqm: p.sqm,
    price: p.price,
    neighborhood: p.neighborhood,
    property_type: p.property_type,
    features: p.features,
    photo_urls: p.photo_urls,
    address: p.address,
    created_at: p.created_at,
  };

  // Server-rendered header content — stays server via the slot pattern.
  const header = (
    <>
      <h1 className="font-serif text-3xl font-bold text-navy-deep capitalize">
        {p.property_type} in {neighborhoodName}
      </h1>
      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
        <span>{p.bedrooms} bed</span>
        <span>·</span>
        <span>{p.bathrooms} bath</span>
        <span>·</span>
        <span>{p.sqm} m²</span>
        <span>·</span>
        <PriceDisplay
          amount={p.price}
          className="font-semibold text-navy-deep"
        />
      </div>
    </>
  );

  const gallery = (
    <PhotoCarousel
      urls={p.photo_urls}
      alt={`${p.property_type} in ${p.neighborhood}`}
    />
  );

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      <div className="container mx-auto px-6 py-8 flex-1">
        <ListingPageClient
          property={property}
          initialListings={existingListings}
          header={header}
          gallery={gallery}
        />
      </div>
    </div>
  );
}
