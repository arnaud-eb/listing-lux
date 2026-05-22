import { describe, it, expect } from "vitest";
import {
  normalizeName,
  matchLocalities,
  STATEC_COMMUNE_ALIASES,
  STATEC_QUARTIER_ALIASES,
} from "./slug-match";

describe("normalizeName", () => {
  it("lowercases and strips accents", () => {
    expect(normalizeName("Pétange")).toBe("petange");
    expect(normalizeName("Käerjeng")).toBe("kaerjeng");
    expect(normalizeName("Mühlenbach")).toBe("muhlenbach");
  });

  it("collapses spaces and dash variants to a single dash", () => {
    expect(normalizeName("Esch-sur-Alzette")).toBe("esch-sur-alzette");
    expect(normalizeName("Ville-Haute")).toBe("ville-haute");
  });

  it("drops apostrophes", () => {
    expect(normalizeName("Vallée de l'Ernz")).toBe("vallee-de-lernz");
  });

  it("trims stray leading/trailing whitespace", () => {
    expect(normalizeName("  Bertrange  ")).toBe("bertrange");
  });
});

describe("matchLocalities", () => {
  const slugs = new Set(["bertrange", "esch-sur-alzette", "luxembourg-city"]);

  it("matches via direct normalization", () => {
    const r = matchLocalities(["Bertrange", "Esch-sur-Alzette"], slugs, {});
    expect(r.matched.map((m) => m.slug)).toEqual(["bertrange", "esch-sur-alzette"]);
    expect(r.matched.every((m) => m.via === "normalize")).toBe(true);
    expect(r.unmatched).toEqual([]);
  });

  it("matches via the alias map", () => {
    const r = matchLocalities(["Luxembourg"], slugs, {
      luxembourg: "luxembourg-city",
    });
    expect(r.matched[0]).toMatchObject({ slug: "luxembourg-city", via: "alias" });
  });

  it("reports unmatched names", () => {
    const r = matchLocalities(["Bertrange", "Nowhere"], slugs, {});
    expect(r.unmatched).toEqual(["Nowhere"]);
  });

  it("reports known slugs STATEC didn't ship", () => {
    const r = matchLocalities(["Bertrange"], slugs, {});
    expect(r.unseenSlugs).toEqual(["esch-sur-alzette", "luxembourg-city"]);
  });
});

describe("alias maps", () => {
  it("keys are already in normalized form", () => {
    for (const map of [STATEC_COMMUNE_ALIASES, STATEC_QUARTIER_ALIASES]) {
      for (const key of Object.keys(map)) {
        expect(normalizeName(key)).toBe(key);
      }
    }
  });
});
