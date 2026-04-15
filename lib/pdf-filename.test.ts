import { describe, it, expect } from "vitest";
import { toCamelCase, buildPdfFilename } from "./pdf-filename";

describe("toCamelCase", () => {
  it("converts space-separated words", () => {
    expect(toCamelCase("Unicorn Real Estate")).toBe("UnicornRealEstate");
  });

  it("converts hyphen-separated words", () => {
    expect(toCamelCase("re-max-luxe")).toBe("ReMaxLuxe");
  });

  it("handles mixed case input", () => {
    expect(toCamelCase("ALL CAPS AGENCY")).toBe("AllCapsAgency");
    expect(toCamelCase("lowercase agency")).toBe("LowercaseAgency");
  });

  it("strips special characters", () => {
    // "RE/MAX" → "/" stripped → "REMAX" (one word) → "Remax"
    expect(toCamelCase("RE/MAX")).toBe("Remax");
    expect(toCamelCase("Sotheby's International")).toBe("SothebysInternational");
    expect(toCamelCase("Coldwell-Banker & Co.")).toBe("ColdwellBankerCo");
  });

  it("collapses multiple whitespace", () => {
    expect(toCamelCase("   spaces   between   ")).toBe("SpacesBetween");
  });

  it("returns empty string for empty input", () => {
    expect(toCamelCase("")).toBe("");
  });

  it("returns empty string when only special characters", () => {
    expect(toCamelCase("!!!@@@###")).toBe("");
  });

  it("preserves digits", () => {
    expect(toCamelCase("Agency 21")).toBe("Agency21");
    expect(toCamelCase("century 21 luxury")).toBe("Century21Luxury");
  });
});

describe("buildPdfFilename", () => {
  const property = {
    neighborhood: "kirchberg",
    property_type: "apartment",
  };

  it("uses agency name in CamelCase when profile is provided", () => {
    expect(
      buildPdfFilename(property, { agency_name: "Unicorn Real Estate" }),
    ).toBe("UnicornRealEstate-Kirchberg-Apartment.pdf");
  });

  it("falls back to ListingLux when profile is null", () => {
    expect(buildPdfFilename(property, null)).toBe(
      "ListingLux-Kirchberg-Apartment.pdf",
    );
  });

  it("falls back to ListingLux when profile is undefined", () => {
    expect(buildPdfFilename(property)).toBe(
      "ListingLux-Kirchberg-Apartment.pdf",
    );
  });

  it("falls back to ListingLux when agency name is empty", () => {
    expect(buildPdfFilename(property, { agency_name: "" })).toBe(
      "ListingLux-Kirchberg-Apartment.pdf",
    );
  });

  it("falls back to ListingLux when agency name contains only special chars", () => {
    expect(buildPdfFilename(property, { agency_name: "!!!" })).toBe(
      "ListingLux-Kirchberg-Apartment.pdf",
    );
  });

  it("title-cases multi-word neighborhoods", () => {
    expect(
      buildPdfFilename({
        neighborhood: "cloche-d-or",
        property_type: "villa",
      }),
    ).toBe("ListingLux-Cloche-D-Or-Villa.pdf");
  });

  it("capitalizes property type", () => {
    expect(
      buildPdfFilename({
        neighborhood: "belair",
        property_type: "penthouse",
      }),
    ).toBe("ListingLux-Belair-Penthouse.pdf");
  });

  it("handles missing neighborhood gracefully", () => {
    expect(
      buildPdfFilename({
        neighborhood: "",
        property_type: "house",
      }),
    ).toBe("ListingLux-Property-House.pdf");
  });

  it("handles missing property type gracefully", () => {
    expect(
      buildPdfFilename({
        neighborhood: "merl",
        property_type: "",
      }),
    ).toBe("ListingLux-Merl-Listing.pdf");
  });

  it("strips special chars from agency name in real-world cases", () => {
    expect(
      buildPdfFilename(property, { agency_name: "RE/MAX Luxembourg" }),
    ).toBe("RemaxLuxembourg-Kirchberg-Apartment.pdf");

    expect(
      buildPdfFilename(property, {
        agency_name: "Sotheby's International Realty",
      }),
    ).toBe("SothebysInternationalRealty-Kirchberg-Apartment.pdf");
  });

  describe("language suffix", () => {
    it("appends uppercase language code when exactly one language is selected", () => {
      expect(buildPdfFilename(property, null, ["fr"])).toBe(
        "ListingLux-Kirchberg-Apartment-FR.pdf",
      );
      expect(buildPdfFilename(property, null, ["de"])).toBe(
        "ListingLux-Kirchberg-Apartment-DE.pdf",
      );
      expect(buildPdfFilename(property, null, ["en"])).toBe(
        "ListingLux-Kirchberg-Apartment-EN.pdf",
      );
      expect(buildPdfFilename(property, null, ["lu"])).toBe(
        "ListingLux-Kirchberg-Apartment-LU.pdf",
      );
    });

    it("does not append language suffix when multiple languages are selected", () => {
      expect(buildPdfFilename(property, null, ["de", "fr"])).toBe(
        "ListingLux-Kirchberg-Apartment.pdf",
      );
      expect(buildPdfFilename(property, null, ["de", "fr", "en", "lu"])).toBe(
        "ListingLux-Kirchberg-Apartment.pdf",
      );
    });

    it("does not append language suffix when languages array is empty", () => {
      expect(buildPdfFilename(property, null, [])).toBe(
        "ListingLux-Kirchberg-Apartment.pdf",
      );
    });

    it("does not append language suffix when languages is undefined", () => {
      expect(buildPdfFilename(property, null, undefined)).toBe(
        "ListingLux-Kirchberg-Apartment.pdf",
      );
    });

    it("combines language suffix with agency branding", () => {
      expect(
        buildPdfFilename(property, { agency_name: "Unicorn Real Estate" }, ["fr"]),
      ).toBe("UnicornRealEstate-Kirchberg-Apartment-FR.pdf");
    });
  });
});
