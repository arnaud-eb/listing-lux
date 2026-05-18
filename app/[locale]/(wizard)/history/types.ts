import { LANGUAGES, type ListingKind } from "@/lib/constants";
import type { Language } from "@/lib/types";

export interface HistoryRow {
  id: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number | null;
  price: number | null;
  neighborhood: string;
  /** Pre-resolved display name for the neighborhood slug. Server-side lookup so
   *  the client doesn't hit the DB per card. Falls back to a humanized slug. */
  neighborhoodName: string;
  property_type: string;
  photo_url: string | null;
  created_at: string;
  listing_kind: ListingKind;
  title: string | null;
}

export const HISTORY_PAGE_SIZE = 12;

export interface PropertyWithListings {
  id: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number | null;
  price: number | null;
  neighborhood: string;
  property_type: string;
  photo_urls: string[] | null;
  created_at: string;
  listing_kind: ListingKind;
  listings: { title: string; language: string }[] | null;
}

export function toHistoryRow(
  p: PropertyWithListings,
  neighborhoodName: string,
): HistoryRow {
  const sorted = p.listings
    ? [...p.listings].sort(
        (a, b) =>
          (LANGUAGES.indexOf(a.language as Language) + 1 || 99) -
          (LANGUAGES.indexOf(b.language as Language) + 1 || 99),
      )
    : [];
  return {
    id: p.id,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    sqm: p.sqm,
    price: p.price,
    neighborhood: p.neighborhood,
    neighborhoodName,
    property_type: p.property_type,
    photo_url: p.photo_urls?.[0] ?? null,
    created_at: p.created_at,
    listing_kind: p.listing_kind,
    title: sorted[0]?.title ?? null,
  };
}
