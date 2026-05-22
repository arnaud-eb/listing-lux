import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PhotoThumbnail from "./PhotoThumbnail";
import type { ListingPhoto } from "@/lib/types";
import type { PhotoAnalysis } from "@/lib/schemas/photo-analysis";

function makeReadyPhoto(roomType = "kitchen"): ListingPhoto {
  return {
    id: "p1",
    localPreviewUrl: "blob:http://localhost/p1",
    supabasePath: "photos/p1.jpg",
    publicUrl: "https://example.com/p1.jpg",
    status: "ready",
    uploadProgress: 100,
    aiAnalysis: {
      // Cast so the tests can also exercise legacy free-text values that the
      // component must tolerate (the live schema now emits canonical ids).
      room_type: roomType as PhotoAnalysis["room_type"],
      features: ["granite countertops", "hardwood floors"],
      style: "modern",
      condition: "immaculate",
      selling_points: ["open plan"],
      atmosphere: "bright",
      cpe_class: null,
      thermal_insulation_class: null,
    },
  };
}

describe("PhotoThumbnail — room-type select", () => {
  const onRemove = vi.fn();
  const onUpdateRoomType = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the room type as a select with the canonical value selected", () => {
    render(
      <PhotoThumbnail
        photo={makeReadyPhoto("bedroom")}
        onRemove={onRemove}
        onUpdateRoomType={onUpdateRoomType}
      />,
    );
    expect(screen.getByRole("combobox", { name: /room type/i })).toHaveValue(
      "bedroom",
    );
  });

  it("calls onUpdateRoomType with the chosen canonical id on change", () => {
    render(
      <PhotoThumbnail
        photo={makeReadyPhoto("bedroom")}
        onRemove={onRemove}
        onUpdateRoomType={onUpdateRoomType}
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: /room type/i }), {
      target: { value: "office" },
    });
    expect(onUpdateRoomType).toHaveBeenCalledWith("p1", "office");
  });

  it("normalizes a legacy spaced room_type to its canonical id", () => {
    render(
      <PhotoThumbnail
        photo={makeReadyPhoto("Living Room")}
        onRemove={onRemove}
        onUpdateRoomType={onUpdateRoomType}
      />,
    );
    expect(screen.getByRole("combobox", { name: /room type/i })).toHaveValue(
      "living-room",
    );
  });

  it("falls back to 'other' for an unrecognized legacy room_type", () => {
    render(
      <PhotoThumbnail
        photo={makeReadyPhoto("Penthouse Sky Lounge")}
        onRemove={onRemove}
        onUpdateRoomType={onUpdateRoomType}
      />,
    );
    expect(screen.getByRole("combobox", { name: /room type/i })).toHaveValue(
      "other",
    );
  });
});
