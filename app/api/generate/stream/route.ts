import { streamText, Output } from "ai";
import { openai, LISTING_MODEL } from "@/lib/ai/client";
import { createServiceClient } from "@/lib/supabase.server";
import { getNeighborhoodBySlug } from "@/lib/markets";
import { buildListingPrompt, PROMPT_VERSION } from "@/lib/ai/prompts";
import { listingOutputSchema } from "@/lib/schemas/listing";
import type { Language, PhotoAnalysis } from "@/lib/types";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";
import { getSessionIdFromCookie } from "@/lib/session";

const VALID_LANGUAGES = new Set<Language>(["de", "fr", "en", "lu"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { propertyId, language, comment, currentListing } = body;

  if (!propertyId || typeof propertyId !== "string") {
    return Response.json({ error: "propertyId is required" }, { status: 400 });
  }

  if (!language || !VALID_LANGUAGES.has(language as Language)) {
    return Response.json(
      { error: "language must be one of: de, fr, en, lu" },
      { status: 400 },
    );
  }

  const lang = language as Language;
  const supabase = createServiceClient();

  // Fetch property
  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (error || !property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  // Verify session ownership
  const sessionId = getSessionIdFromCookie(
    request.headers.get("cookie") ?? "",
  );
  if (!sessionId || property.session_id !== sessionId) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Build prompt
  const neighborhood = getNeighborhoodBySlug(property.neighborhood);
  const photoAnalyses: PhotoAnalysis[] = property.photo_analyses ?? [];
  // Validate optional comment
  const safeComment =
    typeof comment === "string" ? comment.slice(0, MAX_COMMENT_LENGTH) : undefined;
  const cl = currentListing as Record<string, unknown> | undefined;
  const safeCurrentListing =
    cl &&
    typeof cl === "object" &&
    typeof cl.title === "string"
      ? {
          title: cl.title as string,
          description: (cl.description as string) ?? "",
          highlights: Array.isArray(cl.highlights)
            ? (cl.highlights as Array<{ text: string; icon: string }>)
            : [],
        }
      : undefined;

  const prompt = buildListingPrompt(
    lang,
    property,
    photoAnalyses,
    neighborhood,
    safeComment,
    safeCurrentListing,
  );

  // Stream the object — feedback gets its own user message for role isolation
  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: prompt.system },
    { role: "user", content: prompt.user },
  ];
  if (prompt.feedback) {
    messages.push({ role: "user", content: prompt.feedback });
  }

  const result = streamText({
    model: openai(LISTING_MODEL),
    output: Output.object({ schema: listingOutputSchema }),
    messages,
    onFinish: async ({ text }) => {
      const parsed = listingOutputSchema.safeParse(JSON.parse(text));
      if (!parsed.success) return;

      const object = parsed.data;

      // Upsert listing into DB
      await supabase.from("listings").upsert(
        {
          property_id: propertyId,
          language: lang,
          title: object.title,
          description: object.description,
          highlights: object.highlights,
          seo_keywords: object.seo_keywords,
          prompt_version: PROMPT_VERSION,
          model: LISTING_MODEL,
        },
        { onConflict: "property_id,language" },
      );
    },
  });

  return result.toTextStreamResponse();
}
