import { describe, it, expect, vi } from "vitest";

const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn((): { value: string } | null => null);

const mockGenerateObject = vi.fn();
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    generateObject: (...args: unknown[]) => mockGenerateObject(...args),
  };
});

// Mock next/headers before importing actions
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    get: mockCookieGet,
    has: vi.fn(() => false),
    set: mockCookieSet,
  })),
}));

// Mock supabase service client
vi.mock("@/lib/supabase.server", () => ({
  createServiceClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUploadUrl: vi.fn().mockResolvedValue({
          data: {
            signedUrl: "https://example.com/signed",
            path: "test/photo.jpg",
          },
          error: null,
        }),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: "https://example.com/public/test/photo.jpg" },
        })),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: "test-uuid-1234" },
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
    rpc: vi.fn(),
  })),
}));

const mockCheckRateLimit = vi.fn();
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  };
});

// Phase 3 slug-existence validation: saveProperty now rejects unknown locality
// slugs. Mock returns a non-null Locality so the validation passes for the
// "happy path" tests; tampered-slug coverage lives in its own integration test.
vi.mock("@/lib/localities/repository", () => ({
  getBySlug: vi.fn(async (slug: string) => ({
    id: "loc-id",
    slug,
    countryCode: "LU",
    kind: "quartier",
    name: slug,
    nameLocalized: { fr: slug, en: slug, de: slug },
    descriptionLocalized: {},
    keywordsLocalized: {},
    tags: [],
    parent: null,
    price: null,
  })),
}));

import {
  getSignedUploadUrl,
  saveProperty,
  derivePropertyAggregates,
  analyzePhoto,
} from "./actions";
import type { PhotoAnalysis } from "@/lib/schemas/photo-analysis";

const VALID_URLS = [
  "https://example.com/photo1.jpg",
  "https://example.com/photo2.jpg",
  "https://example.com/photo3.jpg",
  "https://example.com/photo4.jpg",
  "https://example.com/photo5.jpg",
];

describe("getSignedUploadUrl", () => {
  it("returns signed url and a path", async () => {
    const result = await getSignedUploadUrl(
      "photo.jpg",
      "image/jpeg",
      "prop-123",
    );
    expect(result.signedUrl).toBe("https://example.com/signed");
    expect(result.path).toContain("prop-123");
    expect(result.path).toContain("photo.jpg");
  });

  it("sanitizes filenames with spaces and special characters", async () => {
    const result = await getSignedUploadUrl(
      "Image (1).jpeg",
      "image/jpeg",
      "prop-456",
    );
    expect(result.path).toContain("prop-456");
    expect(result.path).toContain("Image__1_.jpeg");
    expect(result.path).not.toContain(" ");
  });

  it("rejects invalid content types", async () => {
    await expect(
      getSignedUploadUrl("photo.exe", "application/x-msdownload", "prop-789"),
    ).rejects.toThrow("Invalid file type");
  });
});

describe("saveProperty", () => {
  it("returns an id on valid data", async () => {
    const result = await saveProperty({
      bedrooms: 3,
      bathrooms: 2,
      sqm: 150,
      price: 1_200_000,
      neighborhood: "belair",
      property_type: "apartment",
      features: { balcony: true, parking: false },
      photo_urls: VALID_URLS,
    });
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
  });

  it("throws on negative bedrooms", async () => {
    await expect(
      saveProperty({
        bedrooms: -1,
        bathrooms: 1,
        sqm: 100,
        price: 500_000,
        neighborhood: "belair",
        property_type: "apartment",
        features: {},
        photo_urls: VALID_URLS,
      }),
    ).rejects.toThrow("Validation failed");
  });

  it("throws when sqm is 0", async () => {
    await expect(
      saveProperty({
        bedrooms: 2,
        bathrooms: 1,
        sqm: 0,
        price: 500_000,
        neighborhood: "belair",
        property_type: "apartment",
        features: {},
        photo_urls: VALID_URLS,
      }),
    ).rejects.toThrow("Validation failed");
  });

  it("throws when price is 0", async () => {
    await expect(
      saveProperty({
        bedrooms: 2,
        bathrooms: 1,
        sqm: 100,
        price: 0,
        neighborhood: "belair",
        property_type: "apartment",
        features: {},
        photo_urls: VALID_URLS,
      }),
    ).rejects.toThrow("Validation failed");
  });

  it("throws when neighborhood is empty", async () => {
    await expect(
      saveProperty({
        bedrooms: 2,
        bathrooms: 1,
        sqm: 100,
        price: 500_000,
        neighborhood: "",
        property_type: "apartment",
        features: {},
        photo_urls: VALID_URLS,
      }),
    ).rejects.toThrow("Validation failed");
  });

  it("throws when fewer than 5 photo URLs", async () => {
    await expect(
      saveProperty({
        bedrooms: 2,
        bathrooms: 1,
        sqm: 100,
        price: 500_000,
        neighborhood: "belair",
        property_type: "apartment",
        features: {},
        photo_urls: ["https://example.com/photo1.jpg"],
      }),
    ).rejects.toThrow("Validation failed");
  });

  it("creates session cookie when missing", async () => {
    mockCookieGet.mockReturnValueOnce(null);
    await saveProperty({
      bedrooms: 3,
      bathrooms: 2,
      sqm: 150,
      price: 1_200_000,
      neighborhood: "belair",
      property_type: "apartment",
      features: {},
      photo_urls: VALID_URLS,
    });
    expect(mockCookieSet).toHaveBeenCalledWith(
      "llx_session",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      }),
    );
  });

  it("reuses existing session cookie", async () => {
    mockCookieGet.mockReturnValueOnce({ value: "existing-session-id" });
    mockCookieSet.mockClear();
    await saveProperty({
      bedrooms: 3,
      bathrooms: 2,
      sqm: 150,
      price: 1_200_000,
      neighborhood: "belair",
      property_type: "apartment",
      features: {},
      photo_urls: VALID_URLS,
    });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("rejects a rent submission with a past availability_date", async () => {
    await expect(
      saveProperty({
        bedrooms: 2,
        bathrooms: 1,
        sqm: 100,
        price: 2_400,
        neighborhood: "belair",
        property_type: "apartment",
        features: {},
        photo_urls: VALID_URLS,
        listing_kind: "rent",
        availability_date: "2000-01-01",
      }),
    ).rejects.toThrow("availability_date cannot be in the past");
  });

  it("accepts a rent submission with a future availability_date", async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const futureIso = future.toISOString().slice(0, 10);
    const result = await saveProperty({
      bedrooms: 2,
      bathrooms: 1,
      sqm: 100,
      price: 2_400,
      neighborhood: "belair",
      property_type: "apartment",
      features: {},
      photo_urls: VALID_URLS,
      listing_kind: "rent",
      availability_date: futureIso,
    });
    expect(result.id).toBeDefined();
  });

  it("ignores availability_date on sale even if set in the past (server rent gate is the only branch that checks)", async () => {
    // The server-side rent gate nulls availability_date on sale before insert,
    // so a past date on sale is benign — it never reaches the DB. This guards
    // against accidentally adding the past-date check outside the isRent branch.
    const result = await saveProperty({
      bedrooms: 2,
      bathrooms: 1,
      sqm: 100,
      price: 850_000,
      neighborhood: "belair",
      property_type: "apartment",
      features: {},
      photo_urls: VALID_URLS,
      listing_kind: "sale",
      availability_date: "2000-01-01",
    });
    expect(result.id).toBeDefined();
  });
});

function makeAnalysis(overrides: Partial<PhotoAnalysis> = {}): PhotoAnalysis {
  return {
    room_type: "kitchen",
    features: ["granite countertops"],
    style: "modern",
    condition: "immaculate",
    selling_points: ["open plan"],
    atmosphere: "bright",
    cpe_class: null,
    thermal_insulation_class: null,
    ...overrides,
  };
}

describe("derivePropertyAggregates", () => {
  it("returns the LLM result for non-empty analyses, with CPE classes overridden by certificate-photo extraction", async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: { property_type: "villa", features: ["pool", "garden"] },
    });

    const result = await derivePropertyAggregates([
      makeAnalysis({ room_type: "exterior", cpe_class: "B", thermal_insulation_class: "C" }),
      makeAnalysis({ room_type: "kitchen" }),
    ]);

    // CPE comes from the photo-level analysis (the agent uploaded a CPE certificate),
    // never from the aggregator LLM — see lib/schemas/photo-analysis.ts and the
    // matching guard in derivePropertyAggregates.
    expect(result).toEqual({
      property_type: "villa",
      features: ["pool", "garden"],
      cpe_class: "B",
      thermal_insulation_class: "C",
    });
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
  });

  it("returns defaults without calling the LLM when analyses is empty", async () => {
    mockGenerateObject.mockClear();
    const result = await derivePropertyAggregates([]);
    expect(result).toEqual({
      property_type: "apartment",
      features: [],
      cpe_class: null,
      thermal_insulation_class: null,
    });
    expect(mockGenerateObject).not.toHaveBeenCalled();
  });

  it("propagates LLM errors so the caller can fall back", async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error("rate limit"));
    await expect(
      derivePropertyAggregates([makeAnalysis()]),
    ).rejects.toThrow("rate limit");
  });
});

describe("analyzePhoto rate limiting", () => {
  it("throws RateLimitError when per-session limit is exhausted", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      limit: 30,
      reset: Date.now() + 30_000,
    });
    // Sanity: the OpenAI call must not happen on a denied request — that's the
    // whole point of the limiter.
    mockGenerateObject.mockClear();

    await expect(
      analyzePhoto("https://example.com/photo.jpg"),
    ).rejects.toMatchObject({
      name: "RateLimitError",
      retryAfter: expect.any(Number),
    });
    expect(mockGenerateObject).not.toHaveBeenCalled();
  });

  it("proceeds to OpenAI when the limiter allows", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: true,
      remaining: 29,
      limit: 30,
      reset: Date.now() + 60_000,
    });
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        room_type: "living-room",
        atmosphere: "bright",
        style: "modern",
        condition: "renovated",
        features: [],
        selling_points: [],
        cpe_class: null,
        thermal_insulation_class: null,
      },
    });
    const result = await analyzePhoto("https://example.com/photo.jpg");
    expect(result.room_type).toBe("living-room");
  });
});
