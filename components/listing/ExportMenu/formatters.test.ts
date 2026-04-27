import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FORMATTERS } from "./formatters";
import type { Listing, Property } from "@/lib/types";

// Mock the clipboard helpers so we can spy on what each formatter dispatches.
vi.mock("@/lib/clipboard", () => ({
  copyPlainText: vi.fn(async () => undefined),
  copyRichText: vi.fn(async () => undefined),
}));

import { copyPlainText, copyRichText } from "@/lib/clipboard";

const PROPERTY: Property = {
  id: "11111111-1111-1111-1111-111111111111",
  bedrooms: 4,
  bathrooms: 2,
  sqm: 130,
  price: 1_000_000,
  neighborhood: "Cents",
  property_type: "duplex",
  features: {},
  photo_urls: ["https://example.com/photo.jpg"],
  created_at: "2026-04-19T00:00:00.000Z",
};

const LISTING: Partial<Listing> = {
  language: "de",
  title: "Exklusives Duplex",
  description: "Ein wunderschönes Duplex mit Garten.",
  highlights: [
    { text: "130 m² Wohnfläche", icon: "house" },
    { text: "Privater Garten", icon: "trees" },
  ],
  hashtags: ["#Duplex", "#Cents"],
};

describe("FORMATTERS map", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("athome dispatches plain-text copy", async () => {
    await FORMATTERS.athome({ listing: LISTING, property: PROPERTY });
    expect(copyPlainText).toHaveBeenCalledTimes(1);
    expect(copyRichText).not.toHaveBeenCalled();
  });

  it("immotop dispatches plain-text copy", async () => {
    await FORMATTERS.immotop({ listing: LISTING, property: PROPERTY });
    expect(copyPlainText).toHaveBeenCalledTimes(1);
    expect(copyRichText).not.toHaveBeenCalled();
  });

  it("email dispatches rich-text copy with html + plain-text fallback", async () => {
    await FORMATTERS.email({ listing: LISTING, property: PROPERTY });
    expect(copyRichText).toHaveBeenCalledTimes(1);
    expect(copyPlainText).not.toHaveBeenCalled();
    const [html, plain] = (copyRichText as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(typeof html).toBe("string");
    expect(typeof plain).toBe("string");
    expect(html.length).toBeGreaterThan(0);
    expect(plain.length).toBeGreaterThan(0);
  });

  it("social dispatches plain-text copy", async () => {
    await FORMATTERS.social({ listing: LISTING, property: PROPERTY });
    expect(copyPlainText).toHaveBeenCalledTimes(1);
    expect(copyRichText).not.toHaveBeenCalled();
  });

  it("exposes exactly the four expected formats", () => {
    expect(Object.keys(FORMATTERS).sort()).toEqual([
      "athome",
      "email",
      "immotop",
      "social",
    ]);
  });
});
