import { describe, it, expect, vi } from "vitest";

const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn((): { value: string } | null => null);

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

import { getSignedUploadUrl, saveProperty } from "./actions";

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
});
