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
    apartment: {
      minPerSqm: 8500,
      maxPerSqm: 14000,
      medianPerSqm: 11000,
      source: "override",
      dataAsOf: "2026-03-26",
    },
    house: {
      minPerSqm: 8500,
      maxPerSqm: 14000,
      medianPerSqm: 11000,
      source: "override",
      dataAsOf: "2026-03-26",
    },
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
    room_type: "living-room",
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
    expect(user).toContain("living-room");
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

  it("has version 2.2", () => {
    expect(PROMPT_VERSION).toBe("2.2");
  });

  describe("v2.1 — transaction type, availability, floor", () => {
    it("states FOR RENT in the user prompt for a rental", () => {
      const { user } = buildListingPrompt(
        "en",
        { ...mockProperty, listing_kind: "rent" },
        mockAnalyses,
        mockLocality,
      );
      expect(user).toContain("FOR RENT");
    });

    it("defaults to FOR SALE when no listing kind is given", () => {
      const { user } = buildListingPrompt(
        "en",
        mockProperty,
        mockAnalyses,
        mockLocality,
      );
      expect(user).toContain("FOR SALE");
    });

    it("includes the availability date for a rental", () => {
      const { user } = buildListingPrompt(
        "en",
        {
          ...mockProperty,
          listing_kind: "rent",
          availability_date: "2026-09-01",
        },
        mockAnalyses,
        mockLocality,
      );
      expect(user).toContain("2026-09-01");
    });

    it("omits the availability date for a sale", () => {
      const { user } = buildListingPrompt(
        "en",
        {
          ...mockProperty,
          listing_kind: "sale",
          availability_date: "2026-09-01",
        },
        mockAnalyses,
        mockLocality,
      );
      expect(user).not.toContain("2026-09-01");
    });

    it("flags a negative floor as a basement level", () => {
      const { user } = buildListingPrompt(
        "en",
        { ...mockProperty, floor_of_unit: -1 },
        mockAnalyses,
        mockLocality,
      );
      expect(user).toContain("basement level");
    });

    it("addresses energy performance in every language's system prompt", () => {
      for (const lang of ["de", "fr", "en"] as const) {
        const { system } = buildListingPrompt(
          lang,
          mockProperty,
          mockAnalyses,
          mockLocality,
        );
        // Matches "energy" / "Energie…" / "énergétique" across the languages.
        expect(system).toMatch(/[ée]nerg/i);
      }
    });
  });

  describe("v2.2 — qualitative energy-class prose for top-tier classes only", () => {
    it("forbids naming the class letter in the English system prompt", () => {
      const { system } = buildListingPrompt(
        "en",
        mockProperty,
        mockAnalyses,
        mockLocality,
      );
      expect(system).toMatch(/never name the energy performance class letter/i);
    });

    it("allows neutral qualitative wording for A+/A/B in every language", () => {
      const qualifiers: Record<string, RegExp> = {
        en: /well-insulated|energy-efficient|low energy consumption/i,
        de: /gut gedämmt|energieeffizient|geringer Energieverbrauch/i,
        fr: /bien isolé|économe en énergie|faible consommation/i,
      };
      // Also assert the gating class list itself stays in the prompt — losing
      // "A+, A or B" while keeping the qualifiers would invert the rule.
      const gates: Record<string, RegExp> = {
        en: /A\+, A or B/,
        de: /A\+, A oder B/,
        fr: /A\+, A ou B/,
      };
      for (const lang of ["de", "fr", "en"] as const) {
        const { system } = buildListingPrompt(
          lang,
          mockProperty,
          mockAnalyses,
          mockLocality,
        );
        expect(system).toMatch(qualifiers[lang]);
        expect(system).toMatch(gates[lang]);
      }
    });

    it("includes the cpe_class in the user prompt when provided", () => {
      const { user } = buildListingPrompt(
        "en",
        { ...mockProperty, cpe_class: "A+" },
        mockAnalyses,
        mockLocality,
      );
      expect(user).toContain("Energy class (CPE): A+");
    });

    it("omits the energy-class line when no cpe_class is provided", () => {
      const { user } = buildListingPrompt(
        "en",
        mockProperty,
        mockAnalyses,
        mockLocality,
      );
      expect(user).not.toMatch(/Energy class \(CPE\)/);
    });
  });

  // The v1.7 architectural fix labels keyword data as "Area facts" with explicit
  // "allowed: describing area / forbidden: proximity claims" rules. A v1.9
  // experiment removed this block to chase a hallucination-score lift; side-
  // by-side reading of the resulting outputs showed the landmark mentions were
  // primed by the description text, not the keywords array — v1.9 shipped less
  // locality grounding for the same hallucination score, so it was reverted.
  describe("v1.8 — buildNeighborhoodContext area-facts framing", () => {
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
      expect(user).toMatch(/Area facts[\s\S]*Philharmonie/);
      expect(user).toMatch(/Area facts[\s\S]*MUDAM/);
    });
  });
});
