import { describe, it, expect } from "vitest";
import { normalizeToE164 } from "./phone";

describe("normalizeToE164", () => {
  describe("empty / nullish input", () => {
    it("returns undefined for empty string", () => {
      expect(normalizeToE164("")).toBeUndefined();
    });

    it("returns undefined for null", () => {
      expect(normalizeToE164(null)).toBeUndefined();
    });

    it("returns undefined for undefined", () => {
      expect(normalizeToE164(undefined)).toBeUndefined();
    });

    it("returns undefined for whitespace-only string", () => {
      expect(normalizeToE164("   ")).toBeUndefined();
    });
  });

  describe("already E.164", () => {
    it("passes through Luxembourg E.164 unchanged", () => {
      expect(normalizeToE164("+352661308700")).toBe("+352661308700");
    });

    it("passes through French E.164 unchanged", () => {
      expect(normalizeToE164("+33612345678")).toBe("+33612345678");
    });

    it("strips whitespace from E.164 with spaces", () => {
      expect(normalizeToE164("+352 661 30 87 00")).toBe("+352661308700");
    });
  });

  describe("international call prefix (00)", () => {
    it("converts 00xx prefix to +xx for Luxembourg", () => {
      expect(normalizeToE164("00352661308700")).toBe("+352661308700");
    });

    it("converts 00xx prefix to +xx for Belgium", () => {
      expect(normalizeToE164("0032498230533")).toBe("+32498230533");
    });

    it("converts 00xx prefix to +xx for France", () => {
      expect(normalizeToE164("0033612345678")).toBe("+33612345678");
    });

    it("strips whitespace before converting 00 prefix", () => {
      expect(normalizeToE164("00 32 498 23 05 33")).toBe("+32498230533");
    });
  });

  describe("fallback / unrecognized formats", () => {
    it("passes through national format unchanged for library to handle", () => {
      // National format without country code — library will likely reject
      // but we don't want to silently drop it.
      expect(normalizeToE164("661308700")).toBe("661308700");
    });

    it("strips whitespace even from unrecognized formats", () => {
      expect(normalizeToE164("661 30 87 00")).toBe("661308700");
    });
  });
});
