import { describe, it, expect } from "vitest";
import { normalizeWebsite } from "./url";

describe("normalizeWebsite", () => {
  describe("empty / nullish input", () => {
    it("returns undefined for empty string", () => {
      expect(normalizeWebsite("")).toBeUndefined();
    });

    it("returns undefined for null", () => {
      expect(normalizeWebsite(null)).toBeUndefined();
    });

    it("returns undefined for undefined", () => {
      expect(normalizeWebsite(undefined)).toBeUndefined();
    });

    it("returns undefined for whitespace-only string", () => {
      expect(normalizeWebsite("   ")).toBeUndefined();
    });
  });

  describe("without protocol — prepends https://", () => {
    it("prepends https:// to bare domain", () => {
      expect(normalizeWebsite("agency.lu")).toBe("https://agency.lu");
    });

    it("prepends https:// to www subdomain", () => {
      expect(normalizeWebsite("www.agency.lu")).toBe("https://www.agency.lu");
    });

    it("prepends https:// to path-containing URLs", () => {
      expect(normalizeWebsite("agency.lu/listings")).toBe(
        "https://agency.lu/listings",
      );
    });

    it("trims whitespace before prepending", () => {
      expect(normalizeWebsite("  agency.lu  ")).toBe("https://agency.lu");
    });
  });

  describe("with protocol — passes through", () => {
    it("preserves https:// URLs", () => {
      expect(normalizeWebsite("https://agency.lu")).toBe("https://agency.lu");
    });

    it("preserves http:// URLs", () => {
      expect(normalizeWebsite("http://agency.lu")).toBe("http://agency.lu");
    });

    it("is case-insensitive for the protocol check", () => {
      expect(normalizeWebsite("HTTPS://agency.lu")).toBe("HTTPS://agency.lu");
      expect(normalizeWebsite("Http://agency.lu")).toBe("Http://agency.lu");
    });

    it("trims whitespace from already-prefixed URLs", () => {
      expect(normalizeWebsite("  https://agency.lu  ")).toBe(
        "https://agency.lu",
      );
    });
  });

  describe("does not validate — transformation only", () => {
    it("normalizes clearly invalid input (downstream Zod validates)", () => {
      // This is a transformation, not a validator. "not a url" becomes
      // "https://not a url" and Zod rejects it when validating.
      expect(normalizeWebsite("not a url")).toBe("https://not a url");
    });

    it("preserves unusual but technically valid domains", () => {
      expect(normalizeWebsite("localhost:3000")).toBe("https://localhost:3000");
    });
  });
});
