import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase.server";
import { getSessionId } from "@/lib/session";
import { getNeighborhoodBySlug } from "@/lib/markets";
import PriceDisplay from "@/components/shared/PriceDisplay";
import { Button } from "@/components/ui/button";
import { Bath, BedDouble, Maximize } from "lucide-react";
import DeleteListingButton from "./DeleteListingButton";

/** Shape returned by Supabase join: properties with nested listings */
interface PropertyWithListings {
  id: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  price: number;
  neighborhood: string;
  property_type: string;
  photo_urls: string[] | null;
  created_at: string;
  listings: { title: string; language: string }[] | null;
}

export const metadata = {
  title: "Your Listings — ListingLux AI",
};

export default async function HistoryPage() {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return <EmptyState />;
  }

  const supabase = createServiceClient();

  // Single query: fetch properties with their first listing title via join
  const { data: properties } = await supabase
    .from("properties")
    .select("*, listings(title, language)")
    .eq("session_id", sessionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!properties || properties.length === 0) {
    return <EmptyState />;
  }

  // Extract first listing title per property from joined data
  const typedProperties = properties as unknown as PropertyWithListings[];
  const titleMap = new Map<string, string>();
  for (const property of typedProperties) {
    if (property.listings && property.listings.length > 0) {
      const sorted = [...property.listings].sort((a, b) =>
        a.language.localeCompare(b.language),
      );
      titleMap.set(property.id, sorted[0].title);
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-navy-deep">
          Your Listings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Properties you&apos;ve created
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {typedProperties.map((property) => {
          const neighborhood = getNeighborhoodBySlug(property.neighborhood);
          const title = titleMap.get(property.id);
          const thumbnail = property.photo_urls?.[0];
          const createdAt = new Date(property.created_at).toLocaleDateString(
            "fr-LU",
            { day: "numeric", month: "short", year: "numeric" },
          );

          return (
            <div
              key={property.id}
              className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <DeleteListingButton propertyId={property.id} title={title} />
              <Link href={`/listing/${property.id}`} className="block">
                {/* Thumbnail */}
                <div className="aspect-16/10 relative bg-gray-100 overflow-hidden">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={title ?? "Property photo"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <Maximize className="size-8" />
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4">
                  {title && (
                    <h2 className="font-serif text-base font-semibold text-navy-deep line-clamp-1 mb-1">
                      {title}
                    </h2>
                  )}

                  <p className="text-sm text-gray-500 capitalize">
                    {property.property_type}
                    {neighborhood ? ` · ${neighborhood.name}` : ""}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BedDouble className="size-3.5" />
                      {property.bedrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="size-3.5" />
                      {property.bathrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize className="size-3.5" />
                      {property.sqm} m²
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <PriceDisplay
                      amount={property.price}
                      className="text-sm font-semibold text-navy-deep"
                    />
                    <span className="text-2xs text-gray-400">{createdAt}</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <h2 className="font-serif text-2xl font-bold text-navy-deep">
          No listings yet
        </h2>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Create your first property listing to see it here.
        </p>
        <Button
          asChild
          className="mt-2 bg-gold text-navy-deep hover:bg-gold/90 rounded-lg shadow-none"
        >
          <Link href="/create">Create Listing</Link>
        </Button>
      </div>
    </div>
  );
}
