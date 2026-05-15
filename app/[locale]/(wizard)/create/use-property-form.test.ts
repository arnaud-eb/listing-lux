import { describe, it, expect } from "vitest";
import type { ListingPhoto } from "@/lib/types";
import { MIN_PHOTOS } from "@/lib/constants";
import { propertyFormSchema } from "@/lib/schemas/property";
import {
  buildPropertyFormData,
  isFormDirty,
  formReducer,
  INITIAL_STATE,
  type PropertyFormState,
} from "./use-property-form";

/**
 * These tests verify the invariant that caused a production bug:
 * when canGenerate is true, toFormData() must produce data that
 * passes Zod validation. Previously, canGenerate counted "processing"
 * photos but toFormData() only collected "ready" ones, so the CTA
 * enabled before the form data was actually valid.
 *
 * The canGenerate derivation itself isn't exported (it lives inside the React
 * hook closure), so we mirror its logic here. The form-data builder, however,
 * IS exported as `buildPropertyFormData` and these tests exercise it directly.
 */

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

function deriveCanGenerate(photos: ListingPhoto[], fields: { bedrooms: number; neighborhood: string }) {
  const readyPhotoCount = photos.filter((p) => p.status === "ready").length;
  const inFlightPhotoCount = photos.filter(
    (p) => p.status === "uploading" || p.status === "processing",
  ).length;
  const hasRequiredFields =
    fields.bedrooms >= 0 && fields.neighborhood !== "";
  return (
    readyPhotoCount >= MIN_PHOTOS &&
    inFlightPhotoCount === 0 &&
    hasRequiredFields
  );
}

/** Build a full PropertyFormState from a partial — fills missing keys from INITIAL_STATE. */
function makeState(overrides: Partial<PropertyFormState> = {}): PropertyFormState {
  return { ...INITIAL_STATE, ...overrides };
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

    const formData = buildPropertyFormData(makeState({ ...VALID_FIELDS, photos }));
    const result = propertyFormSchema.safeParse(formData);
    expect(result.success).toBe(true);
  });

  it("processing photos are excluded from toFormData even if present", () => {
    const photos = [
      ...Array.from({ length: MIN_PHOTOS }, () => makePhoto({ status: "ready" })),
      makePhoto({ status: "processing" }),
    ];

    const formData = buildPropertyFormData(makeState({ ...VALID_FIELDS, photos }));
    expect(formData.photo_urls).toHaveLength(MIN_PHOTOS);
  });

  it("canGenerate is false when extra photos are still processing beyond the minimum", () => {
    // 5 ready (enough to meet MIN_PHOTOS) + 2 still processing
    const photos = [
      ...Array.from({ length: MIN_PHOTOS }, () => makePhoto({ status: "ready" })),
      makePhoto({ status: "processing" }),
      makePhoto({ status: "processing" }),
    ];

    expect(deriveCanGenerate(photos, VALID_FIELDS)).toBe(false);
  });

  it("canGenerate is false when extra photos are still uploading beyond the minimum", () => {
    const photos = [
      ...Array.from({ length: MIN_PHOTOS }, () => makePhoto({ status: "ready" })),
      makePhoto({ status: "uploading" }),
    ];

    expect(deriveCanGenerate(photos, VALID_FIELDS)).toBe(false);
  });

  it("canGenerate is true again once all in-flight photos resolve to ready", () => {
    const photos = Array.from({ length: MIN_PHOTOS + 2 }, () =>
      makePhoto({ status: "ready" }),
    );

    expect(deriveCanGenerate(photos, VALID_FIELDS)).toBe(true);
  });
});

/**
 * Mirror the SET_AGGREGATES reducer merge: derived feature ids OR-merge into
 * the existing features map — they may add `true`, but never overwrite a value
 * the user has already toggled.
 */
function mergeAggregates(
  currentFeatures: Record<string, boolean>,
  derivedIds: string[],
): Record<string, boolean> {
  const merged = { ...currentFeatures };
  for (const id of derivedIds) {
    merged[id] = true;
  }
  return merged;
}

describe("optional sqm and price", () => {
  it("emits null for sqm and price when left blank", () => {
    const data = buildPropertyFormData(
      makeState({ neighborhood: "kirchberg", sqm: "", price: "" }),
    );
    expect(data.sqm).toBeNull();
    expect(data.price).toBeNull();
  });

  it("schema accepts a property with neither sqm nor price", () => {
    const photos = Array.from({ length: MIN_PHOTOS }, () =>
      makePhoto({ status: "ready" }),
    );
    const formData = buildPropertyFormData(
      makeState({ neighborhood: "kirchberg", photos, sqm: "", price: "" }),
    );
    const result = propertyFormSchema.safeParse(formData);
    expect(result.success).toBe(true);
  });

  it("canGenerate is true without sqm or price as long as the neighborhood is set", () => {
    const photos = Array.from({ length: MIN_PHOTOS }, () =>
      makePhoto({ status: "ready" }),
    );
    expect(
      deriveCanGenerate(photos, { bedrooms: 2, neighborhood: "kirchberg" }),
    ).toBe(true);
  });
});

describe("rental form data emission (buildPropertyFormData)", () => {
  it("always emits listing_kind, even on default sale", () => {
    expect(buildPropertyFormData(makeState()).listing_kind).toBe("sale");
  });

  it("flows charges_monthly on sale (co-ownership fees) but nulls availability_date", () => {
    const data = buildPropertyFormData(
      makeState({
        listingKind: "sale",
        chargesMonthly: 350,
        availabilityDate: "2026-09-15",
      }),
    );
    expect(data.charges_monthly).toBe(350);
    expect(data.availability_date).toBeNull();
  });

  it("emits charges_monthly and availability_date on rent when typed", () => {
    const data = buildPropertyFormData(
      makeState({
        listingKind: "rent",
        chargesMonthly: 250,
        availabilityDate: "2026-06-01",
      }),
    );
    expect(data.charges_monthly).toBe(250);
    expect(data.availability_date).toBe("2026-06-01");
  });

  it("nulls empty rent fields even on rent (both are optional)", () => {
    const data = buildPropertyFormData(makeState({ listingKind: "rent" }));
    expect(data.charges_monthly).toBeNull();
    expect(data.availability_date).toBeNull();
    expect(data.listing_kind).toBe("rent");
  });

  it("emits year_built / floors_total / floor_of_unit on both kinds", () => {
    const fields = { yearBuilt: 1998, floorsTotal: 4, floorOfUnit: 0 } as const;
    expect(buildPropertyFormData(makeState(fields))).toMatchObject({
      year_built: 1998,
      floors_total: 4,
      floor_of_unit: 0,
    });
    expect(
      buildPropertyFormData(makeState({ listingKind: "rent", ...fields })),
    ).toMatchObject({
      year_built: 1998,
      floors_total: 4,
      floor_of_unit: 0,
    });
  });

  it("preserves floor_of_unit = 0 (ground floor) — falsy but valid", () => {
    expect(
      buildPropertyFormData(makeState({ floorOfUnit: 0 })).floor_of_unit,
    ).toBe(0);
  });

  it("preserves negative floor_of_unit (basement)", () => {
    expect(
      buildPropertyFormData(makeState({ floorOfUnit: -1 })).floor_of_unit,
    ).toBe(-1);
  });
});

describe("formReducer — listingKind toggles preserve rent-only fields", () => {
  it("preserves chargesMonthly and availabilityDate when toggling to sale (gate happens at submit-time in buildPropertyFormData)", () => {
    const dirtyRent: PropertyFormState = {
      ...INITIAL_STATE,
      listingKind: "rent",
      chargesMonthly: 250,
      availabilityDate: "2026-06-01",
    };
    const next = formReducer(dirtyRent, {
      type: "SET_FIELD",
      key: "listingKind",
      value: "sale",
    });
    expect(next.listingKind).toBe("sale");
    expect(next.chargesMonthly).toBe(250);
    expect(next.availabilityDate).toBe("2026-06-01");
  });

  it("preserves chargesMonthly and availabilityDate when listingKind stays rent", () => {
    const dirtyRent: PropertyFormState = {
      ...INITIAL_STATE,
      listingKind: "rent",
      chargesMonthly: 250,
      availabilityDate: "2026-06-01",
    };
    const next = formReducer(dirtyRent, {
      type: "SET_FIELD",
      key: "listingKind",
      value: "rent",
    });
    expect(next.chargesMonthly).toBe(250);
    expect(next.availabilityDate).toBe("2026-06-01");
  });

  it("does not touch chargesMonthly when an unrelated field is set", () => {
    const dirtyRent: PropertyFormState = {
      ...INITIAL_STATE,
      listingKind: "rent",
      chargesMonthly: 250,
    };
    const next = formReducer(dirtyRent, {
      type: "SET_FIELD",
      key: "yearBuilt",
      value: 1998,
    });
    expect(next.chargesMonthly).toBe(250);
  });
});

describe("isFormDirty", () => {
  it("returns false for the initial state", () => {
    expect(isFormDirty(INITIAL_STATE)).toBe(false);
  });

  it("returns true when sqm has been entered", () => {
    expect(isFormDirty(makeState({ sqm: 120 }))).toBe(true);
  });

  it("returns true when listingKind is rent (toggled away from default sale)", () => {
    expect(isFormDirty(makeState({ listingKind: "rent" }))).toBe(true);
  });

  it("returns true when a feature has been toggled on", () => {
    expect(isFormDirty(makeState({ features: { balcony: true } }))).toBe(true);
  });

  it("returns false when features map exists but every value is false", () => {
    expect(isFormDirty(makeState({ features: { balcony: false } }))).toBe(false);
  });

  it("returns true when at least one photo has been added", () => {
    expect(
      isFormDirty(
        makeState({ photos: [makePhoto({ status: "uploading" })] }),
      ),
    ).toBe(true);
  });

  it("returns true for a building-detail field (floorOfUnit basement)", () => {
    expect(isFormDirty(makeState({ floorOfUnit: -1 }))).toBe(true);
  });
});

describe("SET_AGGREGATES feature merge", () => {
  it("adds derived features to an empty map", () => {
    const merged = mergeAggregates({}, ["balcony", "garden"]);
    expect(merged).toEqual({ balcony: true, garden: true });
  });

  it("preserves user-toggled features that the LLM didn't detect", () => {
    const merged = mergeAggregates(
      { parking: true, "city-view": true },
      ["balcony"],
    );
    expect(merged).toEqual({
      parking: true,
      "city-view": true,
      balcony: true,
    });
  });

  it("does not flip a user-set true to false even if absent from derived list", () => {
    const merged = mergeAggregates({ pool: true }, ["balcony", "garden"]);
    expect(merged.pool).toBe(true);
  });

  it("does not introduce false entries — derivation only adds true", () => {
    const merged = mergeAggregates({}, ["balcony"]);
    expect(Object.values(merged).every((v) => v === true)).toBe(true);
  });
});
