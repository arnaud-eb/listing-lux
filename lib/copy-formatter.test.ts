import { describe, it, expect } from "vitest";
import {
  stripEmojis,
  getEmojiForIcon,
  formatForAthome,
  formatForImmotop,
  formatForEmail,
  formatForSocialMedia,
  ATHOME_CHAR_LIMIT,
  IMMOTOP_CHAR_LIMIT,
} from "./copy-formatter";
import type { Listing, Property } from "./types";

const mockListing: Partial<Listing> = {
  title: "Luxury Apartment in Kirchberg",
  description: "A stunning property with panoramic views.\n\nPerfect for families.",
  highlights: [
    { text: "Private garden", icon: "trees" },
    { text: "Two parking spaces", icon: "car" },
    { text: "Modern kitchen", icon: "cooking-pot" },
  ],
  seo_keywords: ["kirchberg", "luxury"],
  language: "en",
};

const mockProperty: Property = {
  id: "prop-1",
  bedrooms: 3,
  bathrooms: 2,
  sqm: 150,
  price: 1200000,
  neighborhood: "Kirchberg",
  property_type: "apartment",
  features: {},
  photo_urls: [],
  address: "12 Rue de Clausen, Luxembourg",
  created_at: "2026-01-01",
};

describe("stripEmojis", () => {
  it("removes emoji characters", () => {
    expect(stripEmojis("Hello 🌳 World")).toBe("Hello World");
  });

  it("collapses double spaces after removal", () => {
    expect(stripEmojis("🏠 Title here")).toBe("Title here");
  });

  it("trims whitespace", () => {
    expect(stripEmojis("  🌳  ")).toBe("");
  });

  it("preserves plain text", () => {
    expect(stripEmojis("No emojis here")).toBe("No emojis here");
  });

  it("handles multiple consecutive emojis", () => {
    expect(stripEmojis("🏠🌳🚗 Test")).toBe("Test");
  });
});

describe("getEmojiForIcon", () => {
  it("returns mapped emoji for known icons", () => {
    expect(getEmojiForIcon("trees")).toBe("🌳");
    expect(getEmojiForIcon("car")).toBe("🚗");
  });

  it("returns sparkles fallback for unknown icons", () => {
    expect(getEmojiForIcon("unknown-icon")).toBe("✨");
  });
});

describe("formatForAthome", () => {
  it("produces plain text without emojis", () => {
    const result = formatForAthome(mockListing);
    expect(result.text).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });

  it("uses dash bullets for highlights", () => {
    const result = formatForAthome(mockListing);
    expect(result.text).toContain("- Private garden");
    expect(result.text).toContain("- Two parking spaces");
  });

  it("does not include property details", () => {
    const result = formatForAthome(mockListing);
    expect(result.text).not.toContain("1.200.000");
    expect(result.text).not.toContain("150 m²");
    expect(result.text).not.toContain("bedroom");
  });

  it("returns accurate char count", () => {
    const result = formatForAthome(mockListing);
    expect(result.charCount).toBe(result.text.length);
  });

  it("reports over limit correctly", () => {
    const longListing = {
      ...mockListing,
      description: "x".repeat(ATHOME_CHAR_LIMIT + 100),
    };
    const result = formatForAthome(longListing);
    expect(result.isOverLimit).toBe(true);
    expect(result.overBy).toBeGreaterThan(0);
  });
});

describe("formatForImmotop", () => {
  it("uses highlight emojis as bullet prefixes", () => {
    const result = formatForImmotop(mockListing);
    expect(result.text).toContain("🌳 Private garden");
    expect(result.text).toContain("🚗 Two parking spaces");
  });

  it("does not include property details", () => {
    const result = formatForImmotop(mockListing);
    expect(result.text).not.toContain("1.200.000");
    expect(result.text).not.toContain("150 m²");
  });

  it("reports char count with 3000 limit", () => {
    const result = formatForImmotop(mockListing);
    expect(result.charCount).toBe(result.text.length);
    expect(result.isOverLimit).toBe(false);
  });

  it("detects over limit", () => {
    const longListing = {
      ...mockListing,
      description: "x".repeat(IMMOTOP_CHAR_LIMIT + 100),
    };
    const result = formatForImmotop(longListing);
    expect(result.isOverLimit).toBe(true);
  });
});

describe("formatForEmail", () => {
  it("includes property details in plain text", () => {
    const result = formatForEmail(mockListing, mockProperty);
    expect(result.plainText).toContain("150 m²");
    expect(result.plainText).toContain("3 bedrooms");
    expect(result.plainText).toContain("2 bathrooms");
  });

  it("includes address when available", () => {
    const result = formatForEmail(mockListing, mockProperty);
    expect(result.plainText).toContain("12 Rue de Clausen");
  });

  it("includes highlight emojis", () => {
    const result = formatForEmail(mockListing, mockProperty);
    expect(result.plainText).toContain("🌳 Private garden");
  });

  it("does NOT include hashtags", () => {
    const result = formatForEmail(mockListing, mockProperty);
    expect(result.plainText).not.toContain("#LuxembourgRealEstate");
  });

  it("has HTML with bold tags", () => {
    const result = formatForEmail(mockListing, mockProperty);
    expect(result.html).toContain("<strong>");
    expect(result.html).toContain(mockListing.title);
  });

  it("omits address when not available", () => {
    const noAddressProperty = { ...mockProperty, address: undefined };
    const result = formatForEmail(mockListing, noAddressProperty);
    expect(result.plainText).not.toContain("📍");
  });
});

describe("formatForSocialMedia", () => {
  it("includes property details", () => {
    const result = formatForSocialMedia(mockListing, mockProperty);
    expect(result).toContain("150 m²");
    expect(result).toContain("3 bedrooms");
  });

  it("uses localized labels for the listing language (German)", () => {
    const deListing = { ...mockListing, language: "de" as const };
    const result = formatForSocialMedia(deListing, mockProperty);
    expect(result).toContain("3 Schlafzimmer");
    expect(result).toContain("2 Badezimmer");
  });

  it("uses localized labels for the listing language (French)", () => {
    const frListing = { ...mockListing, language: "fr" as const };
    const result = formatForSocialMedia(frListing, mockProperty);
    expect(result).toContain("3 chambres");
    expect(result).toContain("2 salles de bain");
  });

  it("includes highlight emojis", () => {
    const result = formatForSocialMedia(mockListing, mockProperty);
    expect(result).toContain("🌳 Private garden");
  });

  it("includes hashtags", () => {
    const result = formatForSocialMedia(mockListing, mockProperty);
    expect(result).toContain("#LuxembourgRealEstate");
    expect(result).toContain("#Kirchberg");
  });

  it("includes address when available", () => {
    const result = formatForSocialMedia(mockListing, mockProperty);
    expect(result).toContain("📍 12 Rue de Clausen");
  });

  it("is plain text only (no HTML)", () => {
    const result = formatForSocialMedia(mockListing, mockProperty);
    expect(result).not.toContain("<strong>");
    expect(result).not.toContain("<br>");
  });
});
