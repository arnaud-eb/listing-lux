import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStatecXls } from "./parse-xls";

const dir = path.dirname(fileURLToPath(import.meta.url));
const fixture = (f: string) => path.join(dir, "fixtures", f);

describe("parseStatecXls — commune file", () => {
  it("reads one row per commune, dropping preamble and footer", () => {
    const rows = parseStatecXls(fixture("commune-apartment.xls"));
    expect(rows).toHaveLength(100);
    expect(rows.some((r) => /moyenne|total|source/i.test(r.name))).toBe(false);
  });

  it("extracts the mean €/m² for an unsuppressed commune", () => {
    const bertrange = parseStatecXls(fixture("commune-apartment.xls")).find(
      (r) => r.name === "Bertrange",
    );
    expect(bertrange?.pricePerSqm).toBeGreaterThan(8000);
    expect(bertrange?.pricePerSqm).toBeLessThan(20000);
  });

  it("returns null for communes STATEC suppressed (<30 listings)", () => {
    const bech = parseStatecXls(fixture("commune-apartment.xls")).find(
      (r) => r.name === "Bech",
    );
    expect(bech).toBeDefined();
    expect(bech?.pricePerSqm).toBeNull();
  });
});

describe("parseStatecXls — quartier file", () => {
  it("reads quartier rows, dropping preamble and the Luxembourg-Ville total", () => {
    const rows = parseStatecXls(fixture("quartier-apartment.xlsx"));
    expect(rows.length).toBeGreaterThan(20);
    expect(rows.some((r) => /^luxembourg-ville$/i.test(r.name))).toBe(false);
    expect(rows.some((r) => /moyenne|total|source/i.test(r.name))).toBe(false);
  });

  it("extracts a known quartier price", () => {
    const belair = parseStatecXls(fixture("quartier-apartment.xlsx")).find(
      (r) => r.name === "Belair",
    );
    expect(belair?.pricePerSqm).toBeGreaterThan(10000);
  });
});
