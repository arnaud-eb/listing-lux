"use server";

import { createServiceClient } from "@/lib/supabase.server";
import { getOrCreateSession } from "@/lib/session";
import type { PropertyFormData } from "@/lib/types";
import {
  PHOTO_BUCKET,
  ALLOWED_IMAGE_TYPES,
  sanitizeFilename,
} from "@/lib/constants";
import { generateObject } from "ai";
import { openai } from "@/lib/ai/client";
import { propertyFormSchema } from "@/lib/schemas/property";
import { photoAnalysisSchema, type PhotoAnalysis } from "@/lib/schemas/photo-analysis";
import {
  propertyAggregatesSchema,
  type PropertyAggregates,
} from "@/lib/schemas/property-aggregates";
import { PROPERTY_TYPES, FEATURE_OPTIONS } from "@/lib/constants";

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

  const { object: analysis } = await generateObject({
    model: openai("gpt-4.1-mini"),
    schema: photoAnalysisSchema,
    messages: [
      {
        role: "system",
        content:
          "You are a luxury real estate photographer analyzing a single property photo. " +
          "Identify the room type, key features, architectural style, condition, top selling points, and overall atmosphere. " +
          "Be specific and use language that appeals to high-end property buyers.",
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
): Promise<PropertyAggregates> {
  if (!Array.isArray(analyses) || analyses.length === 0) {
    return { property_type: "apartment", features: [] };
  }

  const summaries = analyses
    .map(
      (a, i) =>
        `Photo ${i + 1}: ${a.room_type} — ${a.atmosphere}, ${a.style} style, ${a.condition}. Features: ${a.features.join(", ")}. Selling points: ${a.selling_points.join(", ")}.`,
    )
    .join("\n");

  const propertyTypeList = PROPERTY_TYPES.map((t) => t.value).join(", ");
  const featureList = FEATURE_OPTIONS.map((f) => `${f.id} (${f.label})`).join(
    ", ",
  );

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

  return object;
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

  // Session tracking: read or create session cookie
  const sessionId = await getOrCreateSession();

  const supabase = createServiceClient();

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
      ...(formData.address ? { address: formData.address } : {}),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to save property: ${error?.message}`);
  }

  return { id: data.id };
}
