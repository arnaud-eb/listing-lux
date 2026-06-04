"use server";

import { createServiceClient } from "@/lib/supabase.server";
import { getOrCreateSession } from "@/lib/session";
import { getBySlug as getLocalityBySlug } from "@/lib/localities/repository";
import type { PropertyFormData } from "@/lib/types";
import {
  PHOTO_BUCKET,
  ALLOWED_IMAGE_TYPES,
  sanitizeFilename,
} from "@/lib/constants";
import { generateObject } from "ai";
import { openai } from "@/lib/ai/client";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";
import { propertyFormSchema } from "@/lib/schemas/property";
import { photoAnalysisSchema, type PhotoAnalysis } from "@/lib/schemas/photo-analysis";
import {
  propertyAggregatesSchema,
  type DerivedAggregates,
} from "@/lib/schemas/property-aggregates";
import {
  PROPERTY_TYPES,
  FEATURE_OPTIONS,
  normalizeRoomType,
} from "@/lib/constants";

const FEATURE_ID_SET = new Set<string>(FEATURE_OPTIONS.map((f) => f.id));

/** Feature ids the photo aggregator is forbidden to auto-select. See
 *  derivePropertyAggregates for the per-id rationale. */
const FEATURES_NEVER_AUTO_DERIVED = new Set<string>([
  "furnished",
  "basement",
  "city-view",
]);

export async function getSignedUploadUrl(
  filename: string,
  contentType: string,
  propertyId: string,
): Promise<{ signedUrl: string; path: string }> {
  // Validate content type
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      contentType as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    throw new Error(
      "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    );
  }

  // Sanitize filename to prevent path traversal and special chars
  const safeName = sanitizeFilename(filename);

  const supabase = createServiceClient();
  const path = `${propertyId}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to get signed upload URL: ${error?.message}`);
  }

  return { signedUrl: data.signedUrl, path };
}

export async function confirmUpload(
  path: string,
  propertyId: string,
): Promise<{ publicUrl: string }> {
  const supabase = createServiceClient();

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);

  // Update property photo_urls if property exists
  if (propertyId && propertyId !== "pending") {
    await supabase
      .from("properties")
      .update({
        photo_urls: supabase.rpc("array_append_unique", {
          arr: "photo_urls",
          val: data.publicUrl,
        }),
      })
      .eq("id", propertyId);
  }

  return { publicUrl: data.publicUrl };
}

export async function analyzePhoto(photoUrl: string) {
  if (!photoUrl || typeof photoUrl !== "string") {
    throw new Error("photoUrl is required");
  }

  try {
    new URL(photoUrl);
  } catch {
    throw new Error("photoUrl must be a valid URL");
  }

  // Per-session rate limit. Photo analysis is cheaper per call than generation
  // but agents batch-upload 10–20 photos, so this bucket is roomier (30/min
  // vs 10/min for generation).
  const sessionId = await getOrCreateSession();
  const rl = await checkRateLimit(sessionId, "photoAnalysis");
  if (!rl.success) {
    const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    throw new RateLimitError(retryAfter);
  }

  const { object: analysis } = await generateObject({
    model: openai("gpt-4.1-mini"),
    schema: photoAnalysisSchema,
    messages: [
      {
        role: "system",
        content:
          "You are a luxury real estate photographer analyzing a single property photo. " +
          "Identify the room type, key features, architectural style, condition, top selling points, and overall atmosphere. " +
          "Be specific and use language that appeals to high-end property buyers. " +
          "If — and only if — the photo IS a Luxembourg CPE / Energiepass certificate (or otherwise visibly displays the 'Classe énergétique' / 'Energieklasse' / 'Energy class' label with a letter A+..I), set `cpe_class` and `thermal_insulation_class` to the values shown. " +
          "Do NOT guess these classes from interior photos, exterior photos, kitchen renovations, etc. — leave both null in that case. Inventing a class is a regulatory issue under Luxembourg's RGD du 30 nov. 2007.",
      },
      {
        role: "user",
        content: [
          {
            type: "image",
            image: new URL(photoUrl),
          },
          {
            type: "text",
            text: "Analyze this property photo for a luxury real estate listing.",
          },
        ],
      },
    ],
  });

  return analysis;
}

export async function derivePropertyAggregates(
  analyses: PhotoAnalysis[],
): Promise<DerivedAggregates> {
  // Read the CPE classes extracted by `analyzePhoto` directly from the photo analyses
  // — if the agent uploaded a CPE certificate, the vision step set these. We pick the
  // first non-null occurrence; the agent can override in the form. The aggregator LLM
  // does NOT see these fields (they're not in propertyAggregatesSchema) — letting the
  // LLM emit a class would risk inferring it from build year or materials, which the
  // rubric §6 anchor 1 forbids.
  const cpeClass =
    analyses.find((a) => a.cpe_class != null)?.cpe_class ?? null;
  const thermalClass =
    analyses.find((a) => a.thermal_insulation_class != null)
      ?.thermal_insulation_class ?? null;

  if (analyses.length === 0) {
    return {
      property_type: "apartment",
      features: [],
      cpe_class: cpeClass,
      thermal_insulation_class: thermalClass,
    };
  }

  const summaries = analyses
    .map(
      (a, i) =>
        `Photo ${i + 1}: ${a.room_type} — ${a.atmosphere}, ${a.style} style, ${a.condition}. Features: ${a.features.join(", ")}. Selling points: ${a.selling_points.join(", ")}.`,
    )
    .join("\n");

  const propertyTypeList = PROPERTY_TYPES.map((t) => t.value).join(", ");
  // Features the photo-aggregator must NOT auto-select — a single photo cannot
  // reliably establish them, so only the agent should tick them:
  //   - 'furnished': whether furniture conveys is a contract decision, not
  //     something staging or a tenant's belongings can prove.
  //   - 'basement': a full sub-grade floor is a building characteristic; an
  //     interior shot of a room "in the basement" still just looks like a room.
  //   - 'city-view': views are perspective-dependent — a window with buildings
  //     visible doesn't make it a marketable city view.
  const featureList = FEATURE_OPTIONS.filter(
    (f) => !FEATURES_NEVER_AUTO_DERIVED.has(f.id),
  )
    .map((f) => `${f.id} (${f.label})`)
    .join(", ");

  const { object } = await generateObject({
    model: openai("gpt-4.1-mini"),
    schema: propertyAggregatesSchema,
    messages: [
      {
        role: "system",
        content:
          "You determine the overall property type and visible amenities for a real estate listing based on photo summaries. " +
          `Available property types: ${propertyTypeList}. ` +
          `Available amenities (id and label): ${featureList}. ` +
          "Pick the single best-fit property type. Only include amenities that are clearly evidenced by the photo summaries — do not guess or infer beyond what's described.",
      },
      {
        role: "user",
        content: `Photo summaries:\n${summaries}`,
      },
    ],
  });

  // A photo the vision step classified as e.g. a "garage" evidences that
  // feature more reliably than re-deriving it from prose against qualified
  // labels. Mirrors the room-type-correction sync in use-property-form.ts.
  const roomTypeFeatures = analyses
    .map((a) => normalizeRoomType(a.room_type))
    .filter(
      (id) => FEATURE_ID_SET.has(id) && !FEATURES_NEVER_AUTO_DERIVED.has(id),
    );

  return {
    ...object,
    // Guard in case the model emits an excluded feature despite the prompt.
    features: Array.from(
      new Set([
        ...object.features.filter((id) => !FEATURES_NEVER_AUTO_DERIVED.has(id)),
        ...roomTypeFeatures,
      ]),
    ),
    cpe_class: cpeClass,
    thermal_insulation_class: thermalClass,
  };
}

export async function saveProperty(
  formData: PropertyFormData,
): Promise<{ id: string }> {
  // Server-side Zod validation (never trust client)
  const parsed = propertyFormSchema.safeParse(formData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Validation failed: ${messages}`);
  }

  // Validate locality slug exists in the localities table. The client dropdown
  // is the contract; a tampered slug or stale client-side state shouldn't
  // create an orphan property row pointing at a nonexistent locality.
  const locality = await getLocalityBySlug(formData.neighborhood);
  if (!locality) {
    throw new Error(`Validation failed: unknown locality "${formData.neighborhood}"`);
  }

  // Session tracking: read or create session cookie
  const sessionId = await getOrCreateSession();

  const supabase = createServiceClient();

  // Server-side rent gating (defense in depth — the client also gates in
  // buildPropertyFormData, but never trust the client). Sale listings must never
  // persist charges/availability even if a forged payload sends them.
  const listingKind = formData.listing_kind ?? "sale";
  const isRent = listingKind === "rent";

  // Reject past availability dates server-side. ISO YYYY-MM-DD sorts
  // lexicographically, so a string compare against today's ISO date is correct
  // without parsing into Date objects.
  if (isRent && formData.availability_date) {
    const todayIso = new Date().toISOString().slice(0, 10);
    if (formData.availability_date < todayIso) {
      throw new Error(
        "Validation failed: availability_date cannot be in the past",
      );
    }
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      sqm: formData.sqm,
      price: formData.price,
      neighborhood: formData.neighborhood,
      property_type: formData.property_type || "apartment",
      features: formData.features,
      photo_urls: formData.photo_urls,
      photo_analyses: formData.photo_analyses ?? [],
      session_id: sessionId,
      listing_kind: listingKind,
      address: formData.address ?? null,
      cpe_class: formData.cpe_class ?? null,
      thermal_insulation_class: formData.thermal_insulation_class ?? null,
      year_built: formData.year_built ?? null,
      floors_total: formData.floors_total ?? null,
      floor_of_unit: formData.floor_of_unit ?? null,
      charges_monthly: formData.charges_monthly ?? null,
      availability_date: isRent ? formData.availability_date ?? null : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to save property: ${error?.message}`);
  }

  return { id: data.id };
}
