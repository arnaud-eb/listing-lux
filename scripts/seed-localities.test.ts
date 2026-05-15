import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";

// We're testing the JSON shape + the kind-ordering invariant the script depends
// on, not the Supabase client. The script itself runs `main()` on import, so we
// re-implement the two pure helpers here instead of importing.

type LocalityKind =
  | "country"
  | "region"
  | "canton"
  | "commune"
  | "quartier"
  | "sub_quartier";

interface MinimalLocality {
  kind: LocalityKind;
  slug: string;
  parent_slug: string | null;
}

const KIND_ORDER: LocalityKind[] = [
  "country",
  "region",
  "canton",
  "commune",
  "quartier",
  "sub_quartier",
];

function topoSortByKind<T extends MinimalLocality>(localities: T[]): T[] {
  return [...localities].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind),
  );
}

describe("seed-localities — topo sort", () => {
  it("places communes before quartiers regardless of input order", () => {
    const input: MinimalLocality[] = [
      { kind: "quartier", slug: "kirchberg", parent_slug: "luxembourg-city" },
      { kind: "commune", slug: "strassen", parent_slug: "canton-luxembourg" },
      { kind: "quartier", slug: "belair", parent_slug: "luxembourg-city" },
    ];
    const sorted = topoSortByKind(input);
    const kinds = sorted.map((l) => l.kind);
    const firstQuartierIdx = kinds.indexOf("quartier");
    const lastCommuneIdx = kinds.lastIndexOf("commune");
    expect(lastCommuneIdx).toBeLessThan(firstQuartierIdx);
  });

  it("is stable on equal-kind entries (preserves input order within a level)", () => {
    const input: MinimalLocality[] = [
      { kind: "quartier", slug: "a", parent_slug: "p" },
      { kind: "quartier", slug: "b", parent_slug: "p" },
      { kind: "quartier", slug: "c", parent_slug: "p" },
    ];
    expect(topoSortByKind(input).map((l) => l.slug)).toEqual(["a", "b", "c"]);
  });
});

describe("seed-localities — data file integrity", () => {
  const DATA_FILE = path.resolve(
    process.cwd(),
    "data",
    "lu-localities.json",
  );

  it("loads as well-formed JSON with the expected shape", async () => {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed._meta.country_code).toBe("LU");
    expect(parsed._meta.data_as_of).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Array.isArray(parsed.localities)).toBe(true);
    expect(parsed.localities.length).toBeGreaterThan(0);
  });

  it("every entry has the fields the schema requires", async () => {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const { localities } = JSON.parse(raw) as {
      localities: Array<Record<string, unknown>>;
    };
    for (const loc of localities) {
      expect(loc.slug, `slug missing on ${JSON.stringify(loc)}`).toBeTruthy();
      expect(loc.kind).toMatch(/^(country|region|canton|commune|quartier|sub_quartier)$/);
      expect(loc.name).toBeTruthy();
      expect(loc.name_localized, `name_localized missing on ${loc.slug}`).toBeTruthy();
    }
  });

  it("every quartier names a parent commune; every commune names a parent canton", async () => {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const { localities } = JSON.parse(raw) as {
      localities: Array<{ kind: LocalityKind; slug: string; parent_slug: string | null }>;
    };
    for (const loc of localities) {
      if (loc.kind === "quartier") {
        expect(loc.parent_slug, `quartier ${loc.slug} missing parent_slug`).toBeTruthy();
      }
      if (loc.kind === "commune") {
        expect(loc.parent_slug, `commune ${loc.slug} missing parent_slug`).toBeTruthy();
      }
    }
  });

  it("slugs are unique within the file", async () => {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const { localities } = JSON.parse(raw) as {
      localities: Array<{ slug: string }>;
    };
    const slugs = localities.map((l) => l.slug);
    const unique = new Set(slugs);
    expect(slugs.length).toBe(unique.size);
  });

  it("every parent_slug references either migration-010-seeded slug or a slug earlier in this file", async () => {
    // Mirrors the seed script's "seededByMigration010" set. If migration 010 changes,
    // update this constant in BOTH places.
    const seededByMigration010 = new Set([
      "lu",
      "canton-capellen",
      "canton-clervaux",
      "canton-diekirch",
      "canton-echternach",
      "canton-esch-sur-alzette",
      "canton-grevenmacher",
      "canton-luxembourg",
      "canton-mersch",
      "canton-redange",
      "canton-remich",
      "canton-vianden",
      "canton-wiltz",
      "luxembourg-city",
      "strassen",
      "bertrange",
      "mamer",
      "hesperange",
      "walferdange",
      "esch-sur-alzette",
      "differdange",
    ]);

    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const { localities } = JSON.parse(raw) as {
      localities: Array<{ slug: string; parent_slug: string | null; kind: LocalityKind }>;
    };
    const sorted = topoSortByKind(localities);
    const known = new Set(seededByMigration010);
    for (const loc of sorted) {
      if (loc.parent_slug) {
        expect(
          known.has(loc.parent_slug),
          `parent_slug "${loc.parent_slug}" of ${loc.slug} not seeded by migration 010 nor earlier in file`,
        ).toBe(true);
      }
      known.add(loc.slug);
    }
  });
});
