import { streamText, Output } from "ai";
import { openai, LISTING_MODEL } from "@/lib/ai/client";
import { createServiceClient } from "@/lib/supabase.server";
import { getNeighborhoodBySlug } from "@/lib/markets";
import { buildListingPrompt, PROMPT_VERSION } from "@/lib/ai/prompts";
import { listingOutputSchema } from "@/lib/schemas/listing";
import type { Language, PhotoAnalysis } from "@/lib/types";

const VALID_LANGUAGES = new Set<Language>(["de", "fr", "en", "lu"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { propertyId, language } = body;

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

  // Build prompt
  const neighborhood = getNeighborhoodBySlug(property.neighborhood);
  const photoAnalyses: PhotoAnalysis[] = property.photo_analyses ?? [];
  const prompt = buildListingPrompt(lang, property, photoAnalyses, neighborhood);

  // Stream the object
  const result = streamText({
    model: openai(LISTING_MODEL),
    output: Output.object({ schema: listingOutputSchema }),
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
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
