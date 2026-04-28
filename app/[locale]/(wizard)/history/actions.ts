"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase.server";
import { getSessionId } from "@/lib/session";

/**
 * Soft-delete a property. Sets `deleted_at` timestamp on the property row.
 * Data is preserved (useful for future features, GDPR hard-delete comes later).
 * All listings cascade-hide via queries that filter `deleted_at IS NULL`.
 */
export async function deleteProperty(
  propertyId: string,
): Promise<{ success: true }> {
  if (!propertyId || typeof propertyId !== "string") {
    throw new Error("propertyId is required");
  }

  const sessionId = await getSessionId();
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const supabase = createServiceClient();

  // Verify ownership inline (single query) and mark as deleted
  const { data, error } = await supabase
    .from("properties")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", propertyId)
    .eq("session_id", sessionId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Failed to delete listing — not found or unauthorized");
  }

  revalidatePath("/history");

  return { success: true };
}
