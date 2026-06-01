import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServiceClient } from "@/lib/supabase.server";
import { verifyPropertyOwnership, UnauthorizedError } from "@/lib/auth";
import { getBySlug as getLocalityBySlug, listForDropdown } from "@/lib/localities/repository";
import { pickLocalized } from "@/lib/localities/locale";
import PhotoCarousel from "@/components/listing/PhotoCarousel";
import type { Language } from "@/lib/types";
import { propertyTypeLabel, frPrepositionFor } from "@/lib/constants";
import ListingPageClient from "./listing-page-client";
import { propertySchema } from "@/lib/schemas/property";
import type { Listing, Property } from "@/lib/types";
import { z } from "zod";

interface PageProps {
  params: Promise<{ listingId: string; locale: string }>;
}

const getProperty = cache(async (id: string) => {
  const supabase = createServiceClient();
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
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("property_id", propertyId);
  return data ?? [];
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { listingId, locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const p = await getProperty(listingId);

  if (!p) {
    return { title: t("listingNotFoundTitle") };
  }

  const locality = await getLocalityBySlug(p.neighborhood);
  const neighborhoodName = pickLocalized(
    locality?.nameLocalized,
    locale as Language,
    p.neighborhood,
  );
  const typeName = propertyTypeLabel(p.property_type, locale as Language);
  // FR contracts the article ("au Centre-Ville", not "à Centre-Ville"); other
  // locales just use the plain English/German connector.
  const prep = locale === "fr" ? frPrepositionFor(p.neighborhood) : "in";

  return {
    title: t("listingTitleTemplate", {
      type: typeName,
      prep,
      neighborhood: neighborhoodName,
    }),
    description:
      p.sqm != null
        ? t("listingDescriptionTemplate", {
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            sqm: p.sqm,
            type: typeName,
            prep,
            neighborhood: neighborhoodName,
          })
        : t("listingDescriptionTemplateNoSqm", {
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            type: typeName,
            prep,
            neighborhood: neighborhoodName,
          }),
    openGraph: {
      images: p.photo_urls[0] ? [{ url: p.photo_urls[0] }] : [],
    },
    robots: { index: false, follow: false },
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { listingId, locale } = await params;

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

  const property: Property = {
    id: p.id,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    sqm: p.sqm ?? null,
    price: p.price ?? null,
    neighborhood: p.neighborhood,
    property_type: p.property_type,
    features: p.features,
    photo_urls: p.photo_urls,
    address: p.address,
    created_at: p.created_at,
    listing_kind: p.listing_kind,
    cpe_class: p.cpe_class ?? null,
    thermal_insulation_class: p.thermal_insulation_class ?? null,
    year_built: p.year_built ?? null,
    charges_monthly: p.charges_monthly ?? null,
    floors_total: p.floors_total ?? null,
    floor_of_unit: p.floor_of_unit ?? null,
    availability_date: p.availability_date ?? null,
  };

  // Page is owner-only (verifyPropertyOwnership above) so eager-loading the
  // dropdown for inline edit is safe — no anonymous-LCP cost.
  const [locality, localityOptions] = await Promise.all([
    getLocalityBySlug(p.neighborhood),
    listForDropdown(),
  ]);
  const neighborhoodName = pickLocalized(
    locality?.nameLocalized,
    locale as Language,
    p.neighborhood,
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
          neighborhoodName={neighborhoodName}
          localityOptions={localityOptions}
          initialListings={existingListings}
          gallery={gallery}
        />
      </div>
    </div>
  );
}
