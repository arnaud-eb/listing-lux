"use server";

import { createServiceClient } from "@/lib/supabase.server";
import { verifyListingOwnership } from "@/lib/auth";
import type { ListingUpdates } from "@/lib/types";

export async function updateListing(
  listingId: string,
  updates: ListingUpdates,
): Promise<{ success: boolean }> {
  if (!listingId || typeof listingId !== "string") {
    throw new Error("listingId is required");
  }

  const fields: Record<string, unknown> = {};
  if (updates.title !== undefined) fields.title = updates.title;
  if (updates.description !== undefined) fields.description = updates.description;
  if (updates.highlights !== undefined) fields.highlights = updates.highlights;
  if (updates.seo_keywords !== undefined) fields.seo_keywords = updates.seo_keywords;

  if (Object.keys(fields).length === 0) {
    throw new Error("At least one field must be provided");
  }

  await verifyListingOwnership(listingId);

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("listings")
    .update(fields)
    .eq("id", listingId);

  if (error) {
    throw new Error(`Failed to update listing: ${error.message}`);
  }

  return { success: true };
}
