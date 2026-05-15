"use server";

import { generateText } from "ai";
import { openai, LISTING_MODEL } from "@/lib/ai/client";
import { createServiceClient } from "@/lib/supabase.server";
import { verifyListingOwnership, verifyPropertyOwnership } from "@/lib/auth";
import type { ListingUpdates } from "@/lib/types";

export async function updateProperty(
  propertyId: string,
  updates: {
    bedrooms?: number;
    bathrooms?: number;
    sqm?: number | null;
    price?: number | null;
    property_type?: string;
    neighborhood?: string;
    address?: string | null;
  },
): Promise<{ success: boolean }> {
  if (!propertyId || typeof propertyId !== "string") {
    throw new Error("propertyId is required");
  }

  const fields: Record<string, unknown> = {};
  if (updates.bedrooms !== undefined) fields.bedrooms = updates.bedrooms;
  if (updates.bathrooms !== undefined) fields.bathrooms = updates.bathrooms;
  if (updates.sqm !== undefined) fields.sqm = updates.sqm;
  if (updates.price !== undefined) fields.price = updates.price;
  if (updates.property_type !== undefined) fields.property_type = updates.property_type;
  if (updates.neighborhood !== undefined) fields.neighborhood = updates.neighborhood;
  if ("address" in updates) fields.address = updates.address ?? null;

  if (Object.keys(fields).length === 0) {
    throw new Error("At least one field must be provided");
  }

  const supabase = createServiceClient();

  const { data: prop } = await supabase
    .from("properties")
    .select("session_id")
    .eq("id", propertyId)
    .single();

  if (!prop) throw new Error("Property not found");

  await verifyPropertyOwnership(prop.session_id);

  const { error } = await supabase
    .from("properties")
    .update(fields)
    .eq("id", propertyId);

  if (error) {
    throw new Error(`Failed to update property: ${error.message}`);
  }

  return { success: true };
}

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
  if (updates.hashtags !== undefined) fields.hashtags = updates.hashtags;

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

/**
 * Lightweight AI call to infer a Lucide icon name for a highlight.
 * Called on blur when a user edits a highlight's text.
 */
export async function inferHighlightIcon(
  text: string,
): Promise<{ icon: string }> {
  if (!text || text.trim().length < 2) {
    return { icon: "sparkles" };
  }

  try {
    const { text: result } = await generateText({
      model: openai(LISTING_MODEL),
      maxTokens: 20,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Given a real estate property highlight, respond with ONLY a single Lucide React icon name (kebab-case) that best represents it. Examples: trees, car, bath, mountain, shield, zap, sofa, cooking-pot, map-pin, sun, bed, home, key, thermometer, wifi, waves, elevator, ruler, paintbrush, fence, school, dumbbell. Respond with just the icon name, nothing else.",
        },
        {
          role: "user",
          content: text.trim(),
        },
      ],
    });

    const icon = result.trim().toLowerCase().replace(/[^a-z-]/g, "");
    return { icon: icon || "sparkles" };
  } catch {
    return { icon: "sparkles" };
  }
}
