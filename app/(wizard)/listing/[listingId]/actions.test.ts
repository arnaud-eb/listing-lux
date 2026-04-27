import { describe, it, expect, vi, beforeEach } from "vitest";

const mockVerifyListingOwnership = vi.fn();
const mockVerifyPropertyOwnership = vi.fn();

vi.mock("@/lib/auth", () => ({
  verifyListingOwnership: (...args: unknown[]) =>
    mockVerifyListingOwnership(...args),
  verifyPropertyOwnership: (...args: unknown[]) =>
    mockVerifyPropertyOwnership(...args),
}));

const mockSelectSingle = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateEq = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  createServiceClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSelectSingle,
        })),
      })),
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: mockUpdateEq };
      },
    })),
  }),
}));

import { updateListing, updateProperty } from "./actions";

describe("updateListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyListingOwnership.mockResolvedValue("session-123");
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  it("updates title in database", async () => {
    const result = await updateListing("listing-1", { title: "New Title" });
    expect(result.success).toBe(true);
    expect(mockVerifyListingOwnership).toHaveBeenCalledWith("listing-1");
    expect(mockUpdate).toHaveBeenCalledWith({ title: "New Title" });
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "listing-1");
  });

  it("updates multiple fields", async () => {
    await updateListing("listing-1", {
      title: "New Title",
      description: "New desc",
      highlights: [{ text: "h1", icon: "sparkles" }, { text: "h2", icon: "sparkles" }],
      hashtags: ["#tag1"],
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      title: "New Title",
      description: "New desc",
      highlights: [{ text: "h1", icon: "sparkles" }, { text: "h2", icon: "sparkles" }],
      hashtags: ["#tag1"],
    });
  });

  it("throws when no fields provided", async () => {
    await expect(updateListing("listing-1", {})).rejects.toThrow(
      "At least one field must be provided",
    );
  });

  it("throws when listingId is empty", async () => {
    await expect(updateListing("", { title: "x" })).rejects.toThrow(
      "listingId is required",
    );
  });

  it("throws when unauthorized", async () => {
    mockVerifyListingOwnership.mockRejectedValueOnce(
      new Error("Unauthorized"),
    );
    await expect(
      updateListing("listing-1", { title: "x" }),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws when listing not found", async () => {
    mockVerifyListingOwnership.mockRejectedValueOnce(
      new Error("Listing not found"),
    );
    await expect(
      updateListing("listing-1", { title: "x" }),
    ).rejects.toThrow("Listing not found");
  });

  it("throws on database error", async () => {
    mockUpdateEq.mockResolvedValueOnce({
      error: { message: "DB error" },
    });
    await expect(
      updateListing("listing-1", { title: "x" }),
    ).rejects.toThrow("Failed to update listing");
  });
});

describe("updateProperty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyPropertyOwnership.mockResolvedValue("session-123");
    mockSelectSingle.mockResolvedValue({ data: { session_id: "session-123" } });
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  it("updates bedrooms in database", async () => {
    const result = await updateProperty("prop-1", { bedrooms: 3 });
    expect(result.success).toBe(true);
    expect(mockVerifyPropertyOwnership).toHaveBeenCalledWith("session-123");
    expect(mockUpdate).toHaveBeenCalledWith({ bedrooms: 3 });
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "prop-1");
  });

  it("updates multiple fields", async () => {
    await updateProperty("prop-1", {
      bedrooms: 3,
      bathrooms: 2,
      sqm: 145,
      price: 1200000,
      property_type: "house",
      neighborhood: "kirchberg",
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      bedrooms: 3,
      bathrooms: 2,
      sqm: 145,
      price: 1200000,
      property_type: "house",
      neighborhood: "kirchberg",
    });
  });

  it("clears address when null passed", async () => {
    await updateProperty("prop-1", { address: null });
    expect(mockUpdate).toHaveBeenCalledWith({ address: null });
  });

  it("throws when propertyId is empty", async () => {
    await expect(updateProperty("", { bedrooms: 2 })).rejects.toThrow(
      "propertyId is required",
    );
  });

  it("throws when no fields provided", async () => {
    await expect(updateProperty("prop-1", {})).rejects.toThrow(
      "At least one field must be provided",
    );
  });

  it("throws when property not found", async () => {
    mockSelectSingle.mockResolvedValueOnce({ data: null });
    await expect(updateProperty("prop-1", { bedrooms: 2 })).rejects.toThrow(
      "Property not found",
    );
  });

  it("throws when unauthorized", async () => {
    mockVerifyPropertyOwnership.mockRejectedValueOnce(new Error("Unauthorized"));
    await expect(updateProperty("prop-1", { bedrooms: 2 })).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("throws on database error", async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(updateProperty("prop-1", { bedrooms: 2 })).rejects.toThrow(
      "Failed to update property",
    );
  });
});
