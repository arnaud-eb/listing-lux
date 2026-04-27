import { describe, it, expect } from "vitest";
import { listingOutputSchema } from "./listing";

describe("listingOutputSchema", () => {
  const validListing = {
    title: "Stunning Modern Apartment in Kirchberg",
    description:
      "A beautiful apartment with panoramic views.\n\nThe open-plan living area floods with natural light.",
    highlights: [
      { text: "Panoramic city views", icon: "mountain" },
      { text: "Open-plan kitchen", icon: "cooking-pot" },
      { text: "Private parking", icon: "car" },
    ],
    hashtags: [
      "#NeoclassicalFacade",
      "#MarbleFloors",
      "#CityView",
    ],
  };

  it("validates a correct listing output", () => {
    const result = listingOutputSchema.safeParse(validListing);
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const { title, ...rest } = validListing;
    void title;
    const result = listingOutputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const { description, ...rest } = validListing;
    void description;
    const result = listingOutputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing highlights", () => {
    const { highlights, ...rest } = validListing;
    void highlights;
    const result = listingOutputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing hashtags", () => {
    const { hashtags, ...rest } = validListing;
    void hashtags;
    const result = listingOutputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("accepts empty arrays for highlights and hashtags", () => {
    const result = listingOutputSchema.safeParse({
      ...validListing,
      highlights: [],
      hashtags: [],
    });
    expect(result.success).toBe(true);
  });
});
