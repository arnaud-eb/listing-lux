import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ListingPhoto } from "@/lib/types";
import type { PhotoAnalysis } from "@/lib/schemas/photo-analysis";

const mockDerive = vi.fn();

vi.mock("./actions", () => ({
  getSignedUploadUrl: vi.fn(),
  confirmUpload: vi.fn(),
  analyzePhoto: vi.fn(),
  derivePropertyAggregates: (...args: unknown[]) => mockDerive(...args),
}));

import { usePropertyForm } from "./use-property-form";

const DRAFT_KEY = "listinglux-create-draft";

function analysis(roomType = "kitchen"): PhotoAnalysis {
  return {
    room_type: roomType,
    features: [],
    style: "modern",
    condition: "good",
    selling_points: [],
    atmosphere: "bright",
    cpe_class: null,
    thermal_insulation_class: null,
  } as PhotoAnalysis;
}

function readyPhoto(id: string, roomType = "kitchen"): ListingPhoto {
  return {
    id,
    localPreviewUrl: "blob:x",
    supabasePath: `${id}.jpg`,
    publicUrl: `https://example.com/${id}.jpg`,
    status: "ready",
    uploadProgress: 100,
    aiAnalysis: analysis(roomType),
  };
}

function batch(n: number, roomType = "kitchen"): ListingPhoto[] {
  return Array.from({ length: n }, (_, i) => readyPhoto(`p${i}`, roomType));
}

type Hook = ReturnType<typeof renderHook<ReturnType<typeof usePropertyForm>, void>>;

function add(result: Hook["result"], photos: ListingPhoto[]) {
  act(() => {
    for (const p of photos) {
      result.current.dispatch({ type: "ADD_PHOTO", photo: p });
    }
  });
}

const flush = () => act(async () => {});

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  mockDerive.mockResolvedValue({
    property_type: "apartment",
    features: [],
    cpe_class: null,
    thermal_insulation_class: null,
  });
});

describe("usePropertyForm photo-derivation effect", () => {
  it("derives once when MIN_PHOTOS analyzed photos are ready", async () => {
    const { result } = renderHook(() => usePropertyForm());
    add(result, batch(5));
    await waitFor(() => expect(mockDerive).toHaveBeenCalledTimes(1));
    await flush();
    expect(mockDerive).toHaveBeenCalledTimes(1);
    expect(mockDerive.mock.calls[0][0]).toHaveLength(5);
  });

  it("does NOT derive below MIN_PHOTOS", async () => {
    const { result } = renderHook(() => usePropertyForm());
    add(result, batch(4));
    await flush();
    expect(mockDerive).not.toHaveBeenCalled();
  });

  it("re-derives when a new analyzed photo is added after the first batch", async () => {
    const { result } = renderHook(() => usePropertyForm());
    add(result, batch(5));
    await waitFor(() => expect(mockDerive).toHaveBeenCalledTimes(1));
    await flush();

    add(result, [readyPhoto("p5", "garage")]);
    await waitFor(() => expect(mockDerive).toHaveBeenCalledTimes(2));
    // The re-run sees every analyzed photo, not just the new one.
    expect(mockDerive.mock.calls[1][0]).toHaveLength(6);
  });

  it("does NOT re-derive when a photo is removed (set only shrinks)", async () => {
    const { result } = renderHook(() => usePropertyForm());
    add(result, batch(6));
    await waitFor(() => expect(mockDerive).toHaveBeenCalledTimes(1));
    await flush();

    act(() => result.current.handleRemovePhoto("p5"));
    await flush();
    expect(mockDerive).toHaveBeenCalledTimes(1);
  });

  it("resumes derivation after a transient failure instead of stranding the photos", async () => {
    mockDerive.mockRejectedValueOnce(new Error("rate limit"));
    const { result } = renderHook(() => usePropertyForm());
    add(result, batch(5));
    await waitFor(() => expect(mockDerive).toHaveBeenCalledTimes(1));
    await flush();

    // The failed set was never committed, so adding a photo re-runs over the
    // whole set — the originally-failed photos are reprocessed, not stranded.
    add(result, [readyPhoto("p5")]);
    await waitFor(() => expect(mockDerive).toHaveBeenCalledTimes(2));
    expect(mockDerive.mock.calls[1][0]).toHaveLength(6);
  });

  it("does not derive a restored draft, but does once a new photo is added", async () => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        neighborhood: "kirchberg",
        photos: batch(5).map((p) => ({
          id: p.id,
          supabasePath: p.supabasePath,
          publicUrl: p.publicUrl,
          status: "ready",
          aiAnalysis: p.aiAnalysis,
        })),
      }),
    );

    const { result } = renderHook(() => usePropertyForm());
    await flush();
    expect(mockDerive).not.toHaveBeenCalled();

    add(result, [readyPhoto("new-1", "pool")]);
    await waitFor(() => expect(mockDerive).toHaveBeenCalledTimes(1));
    expect(mockDerive.mock.calls[0][0]).toHaveLength(6);
  });
});
