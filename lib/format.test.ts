import { describe, it, expect } from "vitest";
import {
  formatNumber,
  parseFormattedNumber,
  formatCurrency,
  parseIntegerInput,
} from "./format";

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

describe("parseIntegerInput", () => {
  it("returns empty for empty input", () => {
    expect(parseIntegerInput("")).toEqual({ cleaned: "", value: "" });
  });

  it("returns empty for non-numeric garbage", () => {
    expect(parseIntegerInput("abc")).toEqual({ cleaned: "", value: "" });
  });

  it("strips letters from mixed input", () => {
    expect(parseIntegerInput("abc123xyz")).toEqual({
      cleaned: "123",
      value: 123,
    });
  });

  it("strips thousand separators ('1,998' → 1998)", () => {
    expect(parseIntegerInput("1,998")).toEqual({
      cleaned: "1998",
      value: 1998,
    });
  });

  it("strips European thousand separator ('1.998' → 1998)", () => {
    expect(parseIntegerInput("1.998")).toEqual({
      cleaned: "1998",
      value: 1998,
    });
  });

  it("treats a decimal as digit concatenation ('1.5' → 15)", () => {
    expect(parseIntegerInput("1.5")).toEqual({ cleaned: "15", value: 15 });
  });

  it("strips minus when allowNegative is false (the default)", () => {
    expect(parseIntegerInput("-42")).toEqual({ cleaned: "42", value: 42 });
  });

  it("preserves a leading minus when allowNegative is true", () => {
    expect(parseIntegerInput("-42", { allowNegative: true })).toEqual({
      cleaned: "-42",
      value: -42,
    });
  });

  it("returns value='' for a lone '-' (transient typing state)", () => {
    expect(parseIntegerInput("-", { allowNegative: true })).toEqual({
      cleaned: "-",
      value: "",
    });
  });

  it("collapses multiple minus signs to a single leading one", () => {
    expect(parseIntegerInput("--1-2-3", { allowNegative: true })).toEqual({
      cleaned: "-123",
      value: -123,
    });
  });

  it("drops a non-leading minus when allowNegative is true ('1-2' → 12)", () => {
    expect(parseIntegerInput("1-2", { allowNegative: true })).toEqual({
      cleaned: "12",
      value: 12,
    });
  });

  it("handles zero", () => {
    expect(parseIntegerInput("0")).toEqual({ cleaned: "0", value: 0 });
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
