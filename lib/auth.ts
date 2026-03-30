import { getSessionId } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase.server";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Verify the current session owns a property.
 * Throws UnauthorizedError if the session doesn't match.
 */
export async function verifyPropertyOwnership(
  propertySessionId: string | undefined,
): Promise<string> {
  const sessionId = await getSessionId();
  if (!sessionId || propertySessionId !== sessionId) {
    throw new UnauthorizedError();
  }
  return sessionId;
}

/**
 * Verify the current session owns a listing (single join query).
 * Throws UnauthorizedError if unauthorized, or Error if listing not found.
 */
export async function verifyListingOwnership(
  listingId: string,
): Promise<string> {
  const sessionId = await getSessionId();
  if (!sessionId) throw new UnauthorizedError();

  const supabase = createServiceClient();

  // Single query with FK join — Supabase returns many-to-one joins as an object
  // at runtime, but generated types infer an array. The `as unknown as` cast is
  // scoped to this Supabase type mismatch; regenerate types to remove it:
  //   bunx supabase gen types typescript --project-id <id> > lib/database.types.ts
  const { data: listing } = await supabase
    .from("listings")
    .select("property_id, properties(session_id)")
    .eq("id", listingId)
    .single();

  if (!listing) throw new Error("Listing not found");

  const property = listing.properties as unknown as
    | { session_id: string }
    | null;

  if (!property || property.session_id !== sessionId) {
    throw new UnauthorizedError();
  }

  return sessionId;
}
