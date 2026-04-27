import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PhotoThumbnail from "./PhotoThumbnail";
import type { ListingPhoto } from "@/lib/types";

function makeReadyPhoto(roomType = "kitchen"): ListingPhoto {
  return {
    id: "p1",
    localPreviewUrl: "blob:http://localhost/p1",
    supabasePath: "photos/p1.jpg",
    publicUrl: "https://example.com/p1.jpg",
    status: "ready",
    uploadProgress: 100,
    aiAnalysis: {
      room_type: roomType,
      features: ["granite countertops", "hardwood floors"],
      style: "modern",
      condition: "immaculate",
      selling_points: ["open plan"],
      atmosphere: "bright",
    },
  };
}

describe("PhotoThumbnail — editable room-type pill", () => {
  const onRemove = vi.fn();
  const onUpdateRoomType = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the room_type as an editable button", () => {
    render(
      <PhotoThumbnail
        photo={makeReadyPhoto("kitchen")}
        onRemove={onRemove}
        onUpdateRoomType={onUpdateRoomType}
      />,
    );
    const pill = screen.getByRole("button", { name: /edit room type/i });
    expect(pill).toHaveTextContent("kitchen");
  });

  it("switches to input on click and saves on Enter", () => {
    render(
      <PhotoThumbnail
        photo={makeReadyPhoto("bedroom")}
        onRemove={onRemove}
        onUpdateRoomType={onUpdateRoomType}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /edit room type/i }));

    const input = screen.getByRole("textbox", { name: /room type/i });
    fireEvent.change(input, { target: { value: "office" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onUpdateRoomType).toHaveBeenCalledWith("p1", "office");
  });

  it("cancels on Escape without calling onUpdateRoomType", () => {
    render(
      <PhotoThumbnail
        photo={makeReadyPhoto("bedroom")}
        onRemove={onRemove}
        onUpdateRoomType={onUpdateRoomType}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /edit room type/i }));

    const input = screen.getByRole("textbox", { name: /room type/i });
    fireEvent.change(input, { target: { value: "office" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onUpdateRoomType).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /edit room type/i }),
    ).toHaveTextContent("bedroom");
  });

  it("rejects an empty value and keeps the previous room_type", () => {
    render(
      <PhotoThumbnail
        photo={makeReadyPhoto("bedroom")}
        onRemove={onRemove}
        onUpdateRoomType={onUpdateRoomType}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /edit room type/i }));

    const input = screen.getByRole("textbox", { name: /room type/i });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onUpdateRoomType).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /edit room type/i }),
    ).toHaveTextContent("bedroom");
  });

  it("does not call onUpdateRoomType when the value is unchanged", () => {
    render(
      <PhotoThumbnail
        photo={makeReadyPhoto("kitchen")}
        onRemove={onRemove}
        onUpdateRoomType={onUpdateRoomType}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /edit room type/i }));
    const input = screen.getByRole("textbox", { name: /room type/i });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onUpdateRoomType).not.toHaveBeenCalled();
  });
});
