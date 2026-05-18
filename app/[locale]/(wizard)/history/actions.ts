"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createServiceClient } from "@/lib/supabase.server";
import { getSessionId } from "@/lib/session";
import { LISTING_KINDS, type ListingKind } from "@/lib/constants";
import { getBySlugs } from "@/lib/localities/repository";
import { pickLocalized } from "@/lib/localities/locale";
import type { Language } from "@/lib/types";
import {
  HISTORY_PAGE_SIZE,
  toHistoryRow,
  type HistoryRow,
  type PropertyWithListings,
} from "./types";

interface GetMoreListingsArgs {
  cursor: string;
  kind: "all" | ListingKind;
}

interface GetMoreListingsResult {
  rows: HistoryRow[];
  hasMore: boolean;
}

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

export async function getMoreListings({
  cursor,
  kind,
}: GetMoreListingsArgs): Promise<GetMoreListingsResult> {
  if (!cursor || typeof cursor !== "string") {
    throw new Error("cursor is required");
  }
  if (
    kind !== "all" &&
    !LISTING_KINDS.includes(kind as ListingKind)
  ) {
    throw new Error("invalid kind");
  }

  const sessionId = await getSessionId();
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const supabase = createServiceClient();
  let query = supabase
    .from("properties")
    .select("*, listings(title, language)")
    .eq("session_id", sessionId)
    .is("deleted_at", null)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(HISTORY_PAGE_SIZE + 1);

  if (kind !== "all") {
    query = query.eq("listing_kind", kind);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Failed to load more listings");
  }

  const rows = (data ?? []) as unknown as PropertyWithListings[];

  const hasMore = rows.length > HISTORY_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, HISTORY_PAGE_SIZE) : rows;

  const slugs = [...new Set(page.map((p) => p.neighborhood))];
  const localityMap = await getBySlugs(slugs);
  const locale = (await getLocale()) as Language;
  const resolveName = (slug: string) =>
    pickLocalized(localityMap.get(slug)?.nameLocalized, locale, slug);

  return {
    rows: page.map((p) => toHistoryRow(p, resolveName(p.neighborhood))),
    hasMore,
  };
}
