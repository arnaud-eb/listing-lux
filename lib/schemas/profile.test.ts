import { describe, it, expect } from "vitest";
import { agentProfileSchema } from "./profile";

describe("agentProfileSchema", () => {
  const validProfile = {
    full_name: "Arnaud Depierreux",
    email: "arnaud@unicorn.lu",
  };

  it("validates minimal profile (name + email only)", () => {
    const result = agentProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("validates full profile with all optional fields", () => {
    const result = agentProfileSchema.safeParse({
      ...validProfile,
      agency_name: "Unicorn Real Estate",
      phone: "+352 661 308 700",
      agency_address: "1 Rue de Clausen, Luxembourg",
      agency_website: "https://unicorn.lu",
      logo_url: "https://storage.example.com/logo.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = agentProfileSchema.safeParse({ ...validProfile, full_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = agentProfileSchema.safeParse({ ...validProfile, full_name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = agentProfileSchema.safeParse({ ...validProfile, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = agentProfileSchema.safeParse({ full_name: "Test User" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields as undefined", () => {
    const result = agentProfileSchema.safeParse({
      ...validProfile,
      agency_name: undefined,
      phone: undefined,
      agency_address: undefined,
      agency_website: undefined,
      logo_url: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("accepts logo_url as null", () => {
    const result = agentProfileSchema.safeParse({
      ...validProfile,
      logo_url: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid website URL", () => {
    const result = agentProfileSchema.safeParse({
      ...validProfile,
      agency_website: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for website (optional field cleared)", () => {
    const result = agentProfileSchema.safeParse({
      ...validProfile,
      agency_website: "",
    });
    expect(result.success).toBe(true);
  });
});
