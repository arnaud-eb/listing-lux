import { createServiceClient } from "@/lib/supabase.server";
import { getSessionIdFromCookie } from "@/lib/session";
import { generateListingPDF } from "@/lib/pdf-generator";
import { buildPdfFilename } from "@/lib/pdf-filename";
import type { Language, Listing, Property } from "@/lib/types";

const VALID_LANGUAGES = new Set<Language>(["de", "fr", "en", "lu"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { propertyId, languages, includeBranding } = body;

  if (!propertyId || typeof propertyId !== "string") {
    return Response.json({ error: "propertyId is required" }, { status: 400 });
  }

  if (!Array.isArray(languages) || languages.length === 0) {
    return Response.json(
      { error: "languages must be a non-empty array" },
      { status: 400 },
    );
  }

  const validLanguages = languages.filter((l) =>
    VALID_LANGUAGES.has(l as Language),
  ) as Language[];
  if (validLanguages.length === 0) {
    return Response.json(
      { error: "No valid languages provided" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // Fetch property
  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (propError || !property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  // Verify session ownership
  const sessionId = getSessionIdFromCookie(request.headers.get("cookie") ?? "");
  if (!sessionId || property.session_id !== sessionId) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Fetch listings for requested languages
  const { data: listings, error: listError } = await supabase
    .from("listings")
    .select("*")
    .eq("property_id", propertyId)
    .in("language", validLanguages);

  if (listError || !listings || listings.length === 0) {
    return Response.json(
      { error: "No listings found for the requested languages" },
      { status: 404 },
    );
  }

  // Optionally fetch agent profile for branding
  let profile = null;
  if (includeBranding && sessionId) {
    const { data } = await supabase
      .from("agent_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .single();
    profile = data;
  }

  // Build the listing data in the requested language order
  const listingData = validLanguages
    .map((lang) => {
      const listing = listings.find((l: Listing) => l.language === lang);
      if (!listing) return null;
      return { language: lang, listing: listing as Listing };
    })
    .filter(Boolean) as Array<{ language: Language; listing: Listing }>;

  if (listingData.length === 0) {
    return Response.json(
      { error: "No completed listings found" },
      { status: 404 },
    );
  }

  try {
    const pdfBuffer = await generateListingPDF(
      property as Property,
      listingData,
      profile,
    );

    const filename = buildPdfFilename(
      property as Property,
      profile,
      validLanguages,
    );

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return Response.json(
      {
        error: "PDF generation failed",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
