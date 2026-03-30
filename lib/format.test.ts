import { describe, it, expect } from "vitest";
import { formatNumber, parseFormattedNumber, formatCurrency } from "./format";

describe("formatNumber", () => {
  it("formats with thousand separators", () => {
    expect(formatNumber(850000)).toMatch(/850.000/);
  });

  it("returns empty string for empty value", () => {
    expect(formatNumber("")).toBe("");
  });

  it("returns empty string for zero", () => {
    expect(formatNumber(0)).toBe("");
  });

  it("handles small numbers without separator", () => {
    expect(formatNumber(999)).toBe("999");
  });

  it("handles millions", () => {
    expect(formatNumber(1200000)).toMatch(/1.200.000/);
  });
});

describe("parseFormattedNumber", () => {
  it("strips non-digit characters and returns number", () => {
    expect(parseFormattedNumber("850.000")).toBe(850000);
  });

  it("handles plain digits", () => {
    expect(parseFormattedNumber("1200000")).toBe(1200000);
  });

  it("returns empty string for empty input", () => {
    expect(parseFormattedNumber("")).toBe("");
  });

  it("returns empty string for non-numeric input", () => {
    expect(parseFormattedNumber("abc")).toBe("");
  });

  it("strips spaces and commas", () => {
    expect(parseFormattedNumber("1,200,000")).toBe(1200000);
    expect(parseFormattedNumber("1 200 000")).toBe(1200000);
  });
});

describe("formatCurrency", () => {
  it("formats with currency symbol and separators", () => {
    const result = formatCurrency(850000);
    expect(result).toContain("850");
    expect(result).toMatch(/€/);
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0/);
    expect(result).toMatch(/€/);
  });
});
