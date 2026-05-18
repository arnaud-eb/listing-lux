import { describe, it, expect } from "vitest";
import { buildListingPrompt, PROMPT_VERSION } from "./prompts";
import type { PhotoAnalysis } from "@/lib/types";
import type { Locality } from "@/lib/localities/types";

const mockLocality: Locality = {
  id: "kirchberg",
  slug: "kirchberg",
  countryCode: "LU",
  kind: "quartier",
  name: "Kirchberg",
  nameLocalized: { de: "Kirchberg", fr: "Kirchberg", en: "Kirchberg" },
  descriptionLocalized: {
    de: "Kirchberg ist das moderne Geschäftsviertel.",
    fr: "Kirchberg est le quartier d'affaires moderne.",
    en: "Kirchberg is the modern business district.",
  },
  keywordsLocalized: {
    de: ["EU-Viertel", "modern"],
    fr: ["quartier européen", "moderne"],
    en: ["EU quarter", "modern"],
  },
  tags: ["EU quarter", "modern", "expat-friendly"],
  parent: null,
  price: {
    minPerSqm: 8500,
    maxPerSqm: 14000,
    medianPerSqm: 11000,
    source: "override",
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
    cpe_class: null,
    thermal_insulation_class: null,
  },
];

describe("buildListingPrompt", () => {
  it("returns system and user prompts", () => {
    const { system, user } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      mockLocality,
    );
    expect(system).toContain("experienced real estate copywriter");
    expect(user).toContain("apartment");
    expect(user).toContain("120 m²");
    // Price is intentionally NOT rendered in the user prompt — see audit P0.7.
    // Tier calibration comes from the neighborhood's pricePerSqm block.
    expect(user).not.toContain("950,000");
  });

  it("includes property features in user prompt", () => {
    const { user } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      mockLocality,
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
      mockLocality,
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
      mockLocality,
    );
    expect(userDe).toContain("Geschäftsviertel");

    const { user: userFr } = buildListingPrompt(
      "fr",
      mockProperty,
      mockAnalyses,
      mockLocality,
    );
    expect(userFr).toContain("quartier d'affaires");
  });

  it("uses correct language system prompt", () => {
    const { system: de } = buildListingPrompt(
      "de",
      mockProperty,
      mockAnalyses,
      mockLocality,
    );
    expect(de).toContain("erfahrener Immobilientexter");

    const { system: fr } = buildListingPrompt(
      "fr",
      mockProperty,
      mockAnalyses,
      mockLocality,
    );
    expect(fr).toContain("rédacteur immobilier expérimenté");
  });

  it("includes photo analyses in user prompt", () => {
    const { user } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      mockLocality,
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
      mockLocality,
    );
    expect(user).toContain("No photo analysis available");
  });

  it("returns comment in separate feedback field for role isolation", () => {
    const { user, feedback } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      mockLocality,
      "emphasize the garden view",
    );
    expect(user).not.toContain("emphasize the garden view");
    expect(feedback).toContain("<user-feedback>emphasize the garden view</user-feedback>");
    expect(feedback).toContain("silently refuse");
  });

  it("includes current listing context in user prompt for comment-guided regeneration", () => {
    const { user, feedback } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      mockLocality,
      "make it shorter",
      {
        title: "Luxury Apartment in Kirchberg",
        description: "A stunning apartment...",
        highlights: [{ text: "Great view", icon: "mountain" }, { text: "Modern kitchen", icon: "cooking-pot" }],
      },
    );
    expect(user).toContain("Current listing");
    expect(user).toContain("Luxury Apartment in Kirchberg");
    expect(user).toContain("Great view, Modern kitchen");
    expect(feedback).toContain("make it shorter");
  });

  it("does not include feedback or current listing sections when not provided", () => {
    const { user, feedback } = buildListingPrompt(
      "en",
      mockProperty,
      mockAnalyses,
      mockLocality,
    );
    expect(feedback).toBeUndefined();
    expect(user).not.toContain("Current listing");
  });

  it("has version 1.6", () => {
    expect(PROMPT_VERSION).toBe("1.6");
  });

  // v1.6 — data-layer architectural fix (kept) after multiple v1.7 prompt-text
  // attempts were reverted. See README §7.2 for the full post-mortem.
  // The fix: buildNeighborhoodContext relabels keyword data as "Area facts" with
  // explicit "allowed: describing area / forbidden: proximity claims" rules.
  // Closed the leak where the model conflated "Kirchberg has Philharmonie"
  // (true area-fact) with "this property is near Philharmonie" (unsupported
  // proximity claim) — lifted factual_fidelity in the v1.7 audit run.
  describe("v1.6 — buildNeighborhoodContext architectural fix", () => {
    const kirchberg: Locality = {
      ...mockLocality,
      keywordsLocalized: {
        de: ["Philharmonie", "MUDAM"],
        fr: ["Philharmonie", "MUDAM"],
        en: ["Philharmonie", "MUDAM"],
      },
    };

    it("frames keywords as area facts, not as proximity-from-this-property", () => {
      const { user } = buildListingPrompt("en", mockProperty, [], kirchberg);
      expect(user).toMatch(/Area facts \(these belong to the NEIGHBORHOOD/);
      expect(user).toMatch(/Allowed: describing what the neighborhood contains/);
      expect(user).toMatch(/Forbidden: any proximity or distance claim/);
    });

    it("emits keyword values within the area-facts framing", () => {
      const { user } = buildListingPrompt("en", mockProperty, [], kirchberg);
      // Both the framing AND the values must be present together. Using
      // [\s\S]* instead of the `s` flag to keep the regex ES2017-compatible
      // (project tsconfig target).
      expect(user).toMatch(/Area facts[\s\S]*Philharmonie/);
      expect(user).toMatch(/Area facts[\s\S]*MUDAM/);
    });
  });
});
