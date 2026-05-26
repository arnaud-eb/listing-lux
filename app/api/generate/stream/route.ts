import { streamText, Output } from "ai";
import { getTranslations } from "next-intl/server";
import { openai, LISTING_MODEL } from "@/lib/ai/client";
import { createServiceClient } from "@/lib/supabase.server";
import { buildBaseHashtags, dedupeHashtags } from "@/lib/markets";
import { getBySlug as getLocalityBySlug } from "@/lib/localities/repository";
import { buildListingPrompt, PROMPT_VERSION } from "@/lib/ai/prompts";
import { listingOutputSchema } from "@/lib/schemas/listing";
import type { Language, PhotoAnalysis } from "@/lib/types";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";
import { getSessionIdFromCookie } from "@/lib/session";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

function readLocaleFromCookie(cookieHeader: string): "fr" | "en" {
  const match = cookieHeader.match(/NEXT_LOCALE=(\w+)/);
  return match?.[1] === "en" ? "en" : "fr";
}

const VALID_LANGUAGES = new Set<Language>(["de", "fr", "en"]);

// Sequential per-language generation can run ~30–45s end-to-end; default Vercel
// Hobby cap of 10s would 504. 60s is the Hobby max.
export const maxDuration = 60;

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const locale = readLocaleFromCookie(cookieHeader);
  const t = await getTranslations({
    locale,
    namespace: "errors.generation",
  });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: t("invalidJson") }, { status: 400 });
  }
  const { propertyId, language, comment, currentListing, preservedHashtags } = body;

  if (!propertyId || typeof propertyId !== "string") {
    return Response.json({ error: t("propertyIdRequired") }, { status: 400 });
  }

  if (!language || !VALID_LANGUAGES.has(language as Language)) {
    return Response.json(
      { error: t("languageInvalid") },
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
    return Response.json({ error: t("propertyNotFound") }, { status: 404 });
  }

  // Verify session ownership
  const sessionId = getSessionIdFromCookie(cookieHeader);
  if (!sessionId || property.session_id !== sessionId) {
    return Response.json({ error: t("unauthorized") }, { status: 403 });
  }

  // Per-session rate limit. Runs AFTER ownership check so 403 still wins for
  // foreign sessions — limit reads here would otherwise waste Upstash budget.
  const rl = await checkRateLimit(sessionId, "generate");
  if (!rl.success) {
    const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    return Response.json(
      { error: t("rateLimited") },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders(rl),
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  // Build prompt
  const locality = await getLocalityBySlug(property.neighborhood);
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
    locality,
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

      // On comment-guided regeneration, preserve the hashtags the user already has
      // (base set + any AI/manual edits) — content feedback shouldn't touch them.
      // On first generation, merge AI-specific tags with the curated base set.
      const safePreserved = Array.isArray(preservedHashtags)
        ? (preservedHashtags as string[]).filter((t) => typeof t === "string")
        : null;
      const finalHashtags = safePreserved && safePreserved.length > 0
        ? safePreserved
        : dedupeHashtags([
            ...buildBaseHashtags({
              language: lang,
              propertyType: property.property_type,
              neighborhoodName: locality?.name ?? null,
            }),
            ...object.hashtags,
          ]);

      // Upsert listing into DB
      await supabase.from("listings").upsert(
        {
          property_id: propertyId,
          language: lang,
          title: object.title,
          description: object.description,
          highlights: object.highlights,
          hashtags: finalHashtags,
          prompt_version: PROMPT_VERSION,
          model: LISTING_MODEL,
        },
        { onConflict: "property_id,language" },
      );
    },
  });

  return result.toTextStreamResponse();
}
