import { describe, it, expect } from "vitest";
import {
  agentProfileSchema,
  isValidEmail,
  EMAIL_INVALID_MESSAGE,
} from "./profile";

describe("agentProfileSchema", () => {
  it("accepts an entirely empty profile (all fields optional)", () => {
    const result = agentProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts only full_name", () => {
    const result = agentProfileSchema.safeParse({ full_name: "Arnaud" });
    expect(result.success).toBe(true);
  });

  it("accepts only email", () => {
    const result = agentProfileSchema.safeParse({ email: "a@b.co" });
    expect(result.success).toBe(true);
  });

  it("validates a full profile with every optional field set", () => {
    const result = agentProfileSchema.safeParse({
      full_name: "Arnaud Depierreux",
      email: "arnaud@unicorn.lu",
      agency_name: "Unicorn Real Estate",
      phone: "+352 661 308 700",
      agency_address: "1 Rue de Clausen, Luxembourg",
      agency_website: "https://unicorn.lu",
      logo_url: "https://storage.example.com/logo.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects malformed email when one is provided", () => {
    const result = agentProfileSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(EMAIL_INVALID_MESSAGE);
    }
  });

  it("accepts empty string for email (optional field cleared)", () => {
    const result = agentProfileSchema.safeParse({ email: "" });
    expect(result.success).toBe(true);
  });

  it("accepts logo_url as null", () => {
    const result = agentProfileSchema.safeParse({ logo_url: null });
    expect(result.success).toBe(true);
  });

  it("rejects invalid website URL", () => {
    const result = agentProfileSchema.safeParse({
      agency_website: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for website (optional field cleared)", () => {
    const result = agentProfileSchema.safeParse({ agency_website: "" });
    expect(result.success).toBe(true);
  });
});

describe("isValidEmail", () => {
  it("returns true for empty string (optional field)", () => {
    expect(isValidEmail("")).toBe(true);
  });

  it("returns true for valid email", () => {
    expect(isValidEmail("agent@agency.lu")).toBe(true);
    expect(isValidEmail("a.b+c@sub.example.co.uk")).toBe(true);
  });

  it("returns false for missing @", () => {
    expect(isValidEmail("agent.agency.lu")).toBe(false);
  });

  it("returns false for missing TLD", () => {
    expect(isValidEmail("agent@agency")).toBe(false);
  });

  it("returns false for whitespace", () => {
    expect(isValidEmail("agent @agency.lu")).toBe(false);
    expect(isValidEmail("agent@agency .lu")).toBe(false);
  });
});
