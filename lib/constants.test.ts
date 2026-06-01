import { describe, it, expect } from "vitest";
import {
  ROOM_TYPES,
  FEATURE_OPTIONS,
  normalizeRoomType,
  propertyTypeLabel,
  frPrepositionFor,
} from "./constants";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

describe("ROOM_TYPES", () => {
  // handleUpdatePhotoRoomType re-syncs a feature chip when a photo's room type
  // is corrected — it relies on these ids being byte-identical in the room-type
  // and the feature vocabularies. A rename that desyncs them would silently
  // break that sync; this test fails loudly instead.
  const SHARED_WITH_FEATURES = [
    "balcony",
    "terrace",
    "garden",
    "pool",
    "cellar",
    "basement",
    "attic",
    "parking",
    "garage",
  ] as const;

  it("keeps the feature-synced ids present in both vocabularies", () => {
    const featureIds = FEATURE_OPTIONS.map((f) => f.id);
    for (const id of SHARED_WITH_FEATURES) {
      expect(ROOM_TYPES).toContain(id);
      expect(featureIds).toContain(id);
    }
  });

  it("has an en and fr label for every room type", () => {
    const enLabels = en.wizard.photoThumbnail.roomTypes as Record<
      string,
      string
    >;
    const frLabels = fr.wizard.photoThumbnail.roomTypes as Record<
      string,
      string
    >;
    for (const rt of ROOM_TYPES) {
      expect(enLabels[rt], `missing en label for room type "${rt}"`).toBeTruthy();
      expect(frLabels[rt], `missing fr label for room type "${rt}"`).toBeTruthy();
    }
  });

  it("normalizeRoomType coerces legacy, unknown, and empty values", () => {
    expect(normalizeRoomType("Living Room")).toBe("living-room");
    expect(normalizeRoomType("KITCHEN")).toBe("kitchen");
    expect(normalizeRoomType("hallway/entryway")).toBe("other");
    expect(normalizeRoomType(null)).toBe("other");
    expect(normalizeRoomType("")).toBe("other");
  });
});

describe("propertyTypeLabel", () => {
  it("returns the FR label for a known property type", () => {
    expect(propertyTypeLabel("house", "fr")).toBe("Maison");
    expect(propertyTypeLabel("apartment", "fr")).toBe("Appartement");
  });

  it("returns the EN label for a known property type", () => {
    expect(propertyTypeLabel("villa", "en")).toBe("Villa");
  });

  it("falls back to a capitalized id for an unknown type", () => {
    expect(propertyTypeLabel("townhouse", "fr")).toBe("Townhouse");
  });
});

describe("frPrepositionFor", () => {
  it("returns 'à' for a proper-noun locality", () => {
    expect(frPrepositionFor("limpertsberg")).toBe("à");
    expect(frPrepositionFor("differdange")).toBe("à");
  });

  it("returns 'au' for centre-ville", () => {
    expect(frPrepositionFor("centre-ville")).toBe("au");
  });
});
