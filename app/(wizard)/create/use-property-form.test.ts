import { describe, it, expect } from "vitest";
import type { ListingPhoto } from "@/lib/types";
import { MIN_PHOTOS } from "@/lib/constants";
import { propertyFormSchema } from "@/lib/schemas/property";

/**
 * These tests verify the invariant that caused a production bug:
 * when canGenerate is true, toFormData() must produce data that
 * passes Zod validation. Previously, canGenerate counted "processing"
 * photos but toFormData() only collected "ready" ones, so the CTA
 * enabled before the form data was actually valid.
 */

// Mirror the derived-state logic from use-property-form.ts
// so we can test it without rendering a React hook.

function makePhoto(overrides: Partial<ListingPhoto> = {}): ListingPhoto {
  return {
    id: crypto.randomUUID(),
    localPreviewUrl: "blob:http://localhost/fake",
    supabasePath: "photos/test.jpg",
    publicUrl: "https://example.com/photo.jpg",
    status: "ready",
    uploadProgress: 100,
    aiAnalysis: null,
    ...overrides,
  };
}

function deriveCanGenerate(photos: ListingPhoto[], fields: { bedrooms: number; sqm: number; price: number; neighborhood: string }) {
  const readyPhotoCount = photos.filter((p) => p.status === "ready").length;
  const hasRequiredFields =
    fields.bedrooms > 0 &&
    fields.sqm > 0 &&
    fields.price > 0 &&
    fields.neighborhood !== "";
  return readyPhotoCount >= MIN_PHOTOS && hasRequiredFields;
}

function buildFormData(photos: ListingPhoto[], fields: { bedrooms: number; bathrooms: number; sqm: number; price: number; neighborhood: string; propertyType: string; features: Record<string, boolean> }) {
  const readyPhotos = photos.filter((p) => p.status === "ready" && p.publicUrl);
  return {
    bedrooms: fields.bedrooms,
    bathrooms: fields.bathrooms,
    sqm: fields.sqm,
    price: fields.price,
    neighborhood: fields.neighborhood,
    property_type: fields.propertyType,
    features: fields.features,
    photo_urls: readyPhotos.map((p) => p.publicUrl!),
    photo_analyses: readyPhotos.filter((p) => p.aiAnalysis).map((p) => p.aiAnalysis!),
  };
}

const VALID_FIELDS = {
  bedrooms: 3,
  bathrooms: 2,
  sqm: 120,
  price: 950000,
  neighborhood: "kirchberg",
  propertyType: "apartment",
  features: {},
};

describe("canGenerate / toFormData invariant", () => {
  it("canGenerate is false when all photos are still processing", () => {
    const photos = Array.from({ length: MIN_PHOTOS }, () =>
      makePhoto({ status: "processing" }),
    );

    expect(deriveCanGenerate(photos, VALID_FIELDS)).toBe(false);
  });

  it("canGenerate is false with a mix of ready and processing below threshold", () => {
    const photos = [
      ...Array.from({ length: MIN_PHOTOS - 1 }, () => makePhoto({ status: "ready" })),
      makePhoto({ status: "processing" }),
    ];

    expect(deriveCanGenerate(photos, VALID_FIELDS)).toBe(false);
  });

  it("canGenerate is true only when enough photos are ready", () => {
    const photos = Array.from({ length: MIN_PHOTOS }, () =>
      makePhoto({ status: "ready" }),
    );

    expect(deriveCanGenerate(photos, VALID_FIELDS)).toBe(true);
  });

  it("when canGenerate is true, toFormData passes Zod validation", () => {
    const photos = Array.from({ length: MIN_PHOTOS }, () =>
      makePhoto({ status: "ready" }),
    );

    const canGenerate = deriveCanGenerate(photos, VALID_FIELDS);
    expect(canGenerate).toBe(true);

    const formData = buildFormData(photos, VALID_FIELDS);
    const result = propertyFormSchema.safeParse(formData);
    expect(result.success).toBe(true);
  });

  it("processing photos are excluded from toFormData even if present", () => {
    const photos = [
      ...Array.from({ length: MIN_PHOTOS }, () => makePhoto({ status: "ready" })),
      makePhoto({ status: "processing" }),
    ];

    const formData = buildFormData(photos, VALID_FIELDS);
    expect(formData.photo_urls).toHaveLength(MIN_PHOTOS);
  });
});
