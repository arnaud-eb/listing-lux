import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useListingGeneration } from "./use-listing-generation";
import { toast } from "sonner";
import type { Listing } from "@/lib/types";

vi.mock("@/lib/markets", () => ({
  buildBaseHashtags: vi.fn(() => ["#LuxembourgRealEstate"]),
  dedupeHashtags: vi.fn((tags: string[]) => [...new Set(tags)]),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

// Capture onFinish so tests can simulate SDK completion
let capturedOnFinish: ((result: { object?: unknown; error?: Error }) => void) | undefined;
let capturedSubmit: ReturnType<typeof vi.fn>;
let capturedStop: ReturnType<typeof vi.fn>;

vi.mock("@ai-sdk/react", () => ({
  experimental_useObject: (opts: {
    onFinish?: (result: { object?: unknown; error?: Error }) => void;
  }) => {
    capturedOnFinish = opts.onFinish;
    return {
      object: undefined,
      submit: capturedSubmit,
      isLoading: false,
      stop: capturedStop,
      error: undefined,
    };
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedSubmit = vi.fn();
  capturedStop = vi.fn();
  capturedOnFinish = undefined;
});

const mockProperty = { property_type: "apartment", neighborhood: "kirchberg" };

const makeListing = (lang: string) => ({
  title: `Title ${lang}`,
  description: `Description ${lang}`,
  highlights: [{ text: "highlight", icon: "sparkles" }],
  hashtags: ["#tag"],
});

describe("useListingGeneration", () => {
  it("fires success toast after all 3 languages complete via onFinish chain", async () => {
    const { result } = renderHook(() =>
      useListingGeneration("prop-1", [], mockProperty),
    );

    // Auto-trigger on mount calls submit for the first language
    expect(capturedSubmit).toHaveBeenCalledTimes(1);
    expect(capturedSubmit).toHaveBeenCalledWith({
      propertyId: "prop-1",
      language: "de",
    });

    // Simulate SDK completing each language — onFinish chains to next
    const languages = ["de", "fr", "en"];
    for (const lang of languages) {
      act(() => {
        capturedOnFinish?.({ object: makeListing(lang) });
      });
    }

    // After all 3, toast should fire
    expect(toast.success).toHaveBeenCalledWith("All listings generated");
    expect(toast.success).toHaveBeenCalledTimes(1);

    // submit called 3 times total (1 initial + 2 chained)
    expect(capturedSubmit).toHaveBeenCalledTimes(3);
  });

  it("does not fire toast when initialized with existing listings", () => {
    const existing: Listing[] = (["de", "fr", "en"] as const).map(
      (lang) => ({
        id: `id-${lang}`,
        property_id: "prop-1",
        language: lang,
        title: `Title ${lang}`,
        description: `Desc ${lang}`,
        highlights: [],
        hashtags: [],
      }),
    );

    renderHook(() => useListingGeneration("prop-1", existing, mockProperty));

    // No submit called since we have existing listings
    expect(capturedSubmit).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("does not fire toast on single language regeneration", () => {
    const existing: Listing[] = (["de", "fr", "en"] as const).map(
      (lang) => ({
        id: `id-${lang}`,
        property_id: "prop-1",
        language: lang,
        title: `Title ${lang}`,
        description: `Desc ${lang}`,
        highlights: [],
        hashtags: [],
      }),
    );

    const { result } = renderHook(() =>
      useListingGeneration("prop-1", existing, mockProperty),
    );

    // Trigger single language regeneration
    act(() => {
      result.current.regenerate("de");
    });

    expect(capturedSubmit).toHaveBeenCalledWith({
      propertyId: "prop-1",
      language: "de",
    });

    // Simulate completion
    act(() => {
      capturedOnFinish?.({ object: makeListing("de") });
    });

    // Single regen should fire a per-language toast (not "all generated")
    expect(toast.success).toHaveBeenCalledWith("Deutsch listing regenerated");
    expect(toast.success).not.toHaveBeenCalledWith("All listings generated");
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("full batch fires only 'all generated' toast, not per-language toasts", () => {
    const { result } = renderHook(() =>
      useListingGeneration("prop-1", [], mockProperty),
    );

    // Complete all 3 languages
    for (const lang of ["de", "fr", "en"]) {
      act(() => {
        capturedOnFinish?.({ object: makeListing(lang) });
      });
    }

    // Should fire the batch toast only
    expect(toast.success).toHaveBeenCalledWith("All listings generated");
    // The first languages chain to the next, so completedCount only equals
    // totalInQueueRef on the last one. Per-language toasts only fire when
    // totalInQueueRef === 0 (single regen).
    expect(toast.success).not.toHaveBeenCalledWith(
      expect.stringContaining("listing regenerated"),
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("regenerating different languages fires correct per-language labels", () => {
    const existing: Listing[] = (["de", "fr", "en"] as const).map(
      (lang) => ({
        id: `id-${lang}`,
        property_id: "prop-1",
        language: lang,
        title: `Title ${lang}`,
        description: `Desc ${lang}`,
        highlights: [],
        hashtags: [],
      }),
    );

    const { result } = renderHook(() =>
      useListingGeneration("prop-1", existing, mockProperty),
    );

    // Regenerate French
    act(() => {
      result.current.regenerate("fr");
    });
    act(() => {
      capturedOnFinish?.({ object: makeListing("fr") });
    });

    expect(toast.success).toHaveBeenCalledWith("Français listing regenerated");
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("sets error state when onFinish receives an error", () => {
    const { result } = renderHook(() =>
      useListingGeneration("prop-1", [], mockProperty),
    );

    // Simulate SDK error on first language
    act(() => {
      capturedOnFinish?.({ error: new Error("Schema validation failed") });
    });

    expect(result.current.state.de.status).toBe("error");
    expect(result.current.state.de.error).toBe("Schema validation failed");
  });
});
