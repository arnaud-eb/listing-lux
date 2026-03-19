import { describe, it, expect } from "vitest";
import { buildListingPrompt } from "./prompts";
import type { PhotoAnalysis } from "@/lib/types";
import type { Neighborhood } from "@/lib/markets/types";

const mockNeighborhood: Neighborhood = {
  id: "kirchberg",
  name: "Kirchberg",
  slug: "kirchberg",
  pricePerSqm: { min: 8500, max: 14000, median: 11000, currency: "EUR" },
  tags: ["EU quarter", "modern", "expat-friendly"],
  descriptions: {
    de: "Kirchberg ist das moderne Geschäftsviertel.",
    fr: "Kirchberg est le quartier d'affaires moderne.",
    en: "Kirchberg is the modern business district.",
  },
  keywords: {
    de: ["EU-Viertel", "modern"],
    fr: ["quartier européen", "moderne"],
    en: ["EU quarter", "modern"],
  },
};

const mockProperty = {
  bedrooms: 3,
  bathrooms: 2,
  sqm: 120,
  price: 950000,
  neighborhood: "kirchberg",
  property_type: "apartment",
  features: { balcony: true, parking: true, garden: false },
};

const mockAnalyses: PhotoAnalysis[] = [
  {
    room_type: "living room",
    features: ["hardwood floors", "high ceilings"],
    style: "modern",
    condition: "immaculate",
    selling_points: ["open plan", "natural light"],
    atmosphere: "bright and spacious",
  },
];

describe("buildListingPrompt", () => {
  it("returns system and user prompts", () => {
    const { system, user } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      mockNeighborhood,
    );
    expect(system).toContain("luxury real estate copywriter");
    expect(user).toContain("apartment");
    expect(user).toContain("120 m²");
    expect(user).toContain("950,000");
  });

  it("includes property features in user prompt", () => {
    const { user } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      mockNeighborhood,
    );
    expect(user).toContain("balcony");
    expect(user).toContain("parking");
    expect(user).not.toContain("garden"); // false feature excluded
  });

  it("includes neighborhood context", () => {
    const { user } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      mockNeighborhood,
    );
    expect(user).toContain("Kirchberg");
    expect(user).toContain("EU quarter");
    expect(user).toContain("modern business district");
  });

  it("includes language-specific neighborhood descriptions", () => {
    const { user: userDe } = buildListingPrompt(
      "de",
      mockProperty,
      mockAnalyses,
      mockNeighborhood,
    );
    expect(userDe).toContain("Geschäftsviertel");

    const { user: userFr } = buildListingPrompt(
      "fr",
      mockProperty,
      mockAnalyses,
      mockNeighborhood,
    );
    expect(userFr).toContain("quartier d'affaires");
  });

  it("uses correct language system prompt", () => {
    const { system: de } = buildListingPrompt(
      "de",
      mockProperty,
      mockAnalyses,
      mockNeighborhood,
    );
    expect(de).toContain("Luxus-Immobilientexter");

    const { system: fr } = buildListingPrompt(
      "fr",
      mockProperty,
      mockAnalyses,
      mockNeighborhood,
    );
    expect(fr).toContain("rédacteur immobilier de luxe");

    const { system: lu } = buildListingPrompt(
      "lu",
      mockProperty,
      mockAnalyses,
      mockNeighborhood,
    );
    expect(lu).toContain("Lëtzebuerger");
  });

  it("includes photo analyses in user prompt", () => {
    const { user } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      mockNeighborhood,
    );
    expect(user).toContain("living room");
    expect(user).toContain("hardwood floors");
    expect(user).toContain("bright and spacious");
  });

  it("handles missing neighborhood gracefully", () => {
    const { user } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      null,
    );
    expect(user).toContain("apartment");
    expect(user).not.toContain("Kirchberg");
  });

  it("handles empty photo analyses", () => {
    const { user } = buildListingPrompt(
      "en",
      mockProperty,
      [],
      mockNeighborhood,
    );
    expect(user).toContain("No photo analysis available");
  });
});
