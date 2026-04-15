import { describe, it, expect, vi, beforeEach } from "vitest";

const mockVerifyListingOwnership = vi.fn();

vi.mock("@/lib/auth", () => ({
  verifyListingOwnership: (...args: unknown[]) =>
    mockVerifyListingOwnership(...args),
}));

const mockUpdate = vi.fn();
const mockUpdateEq = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  createServiceClient: () => ({
    from: vi.fn(() => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: mockUpdateEq };
      },
    })),
  }),
}));

import { updateListing } from "./actions";

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
      seo_keywords: ["k1"],
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      title: "New Title",
      description: "New desc",
      highlights: [{ text: "h1", icon: "sparkles" }, { text: "h2", icon: "sparkles" }],
      seo_keywords: ["k1"],
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
