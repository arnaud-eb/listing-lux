import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoSelector from "./PhotoSelector";

// next/image needs a minimal stub for JSDOM
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

const PHOTOS = [
  "https://cdn.example.com/photo-1.jpg",
  "https://cdn.example.com/photo-2.jpg",
  "https://cdn.example.com/photo-3.jpg",
  "https://cdn.example.com/photo-4.jpg",
  "https://cdn.example.com/photo-5.jpg",
  "https://cdn.example.com/photo-6.jpg",
];

describe("PhotoSelector", () => {
  it("renders one button per photo", () => {
    render(
      <PhotoSelector photoUrls={PHOTOS} selected={[]} onToggle={vi.fn()} />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(PHOTOS.length);
  });

  it("shows the order number badge on selected photos", () => {
    render(
      <PhotoSelector
        photoUrls={PHOTOS}
        selected={[PHOTOS[2], PHOTOS[0]]}
        onToggle={vi.fn()}
      />,
    );
    // photo-3 is first in selection → badge "1"
    // photo-1 is second in selection → badge "2"
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("marks selected photos with aria-pressed=true", () => {
    render(
      <PhotoSelector
        photoUrls={PHOTOS}
        selected={[PHOTOS[0]]}
        onToggle={vi.fn()}
      />,
    );
    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(second).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onToggle with the clicked URL", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <PhotoSelector photoUrls={PHOTOS} selected={[]} onToggle={onToggle} />,
    );
    const [first] = screen.getAllByRole("button");
    await user.click(first);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(PHOTOS[0]);
  });

  it("disables unselected photos when max is reached", () => {
    render(
      <PhotoSelector
        photoUrls={PHOTOS}
        selected={PHOTOS.slice(0, 5)}
        onToggle={vi.fn()}
        max={5}
      />,
    );
    const buttons = screen.getAllByRole("button");
    // First 5 are selected — not disabled
    for (let i = 0; i < 5; i++) {
      expect(buttons[i]).not.toBeDisabled();
    }
    // Last (6th) is unselected and max is reached → disabled
    expect(buttons[5]).toBeDisabled();
  });

  it("does not call onToggle when clicking a disabled photo at max", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <PhotoSelector
        photoUrls={PHOTOS}
        selected={PHOTOS.slice(0, 5)}
        onToggle={onToggle}
        max={5}
      />,
    );
    const lastButton = screen.getAllByRole("button")[5];
    await user.click(lastButton);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("re-numbers the remaining selections when one is removed (mid-selection)", async () => {
    // Simulate the real flow: the parent owns state, toggling updates it.
    function Harness() {
      const [selected, setSelected] = useState<string[]>([
        PHOTOS[0],
        PHOTOS[2],
        PHOTOS[4],
      ]);
      // After initial: photo-1=1, photo-3=2, photo-5=3

      return (
        <PhotoSelector
          photoUrls={PHOTOS}
          selected={selected}
          onToggle={(url) =>
            setSelected((prev) =>
              prev.includes(url)
                ? prev.filter((u) => u !== url)
                : [...prev, url],
            )
          }
        />
      );
    }

    const user = userEvent.setup();
    render(<Harness />);

    // Initial: badges 1, 2, 3 visible
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Click the middle selection (photo-3, currently badge "2") to deselect it.
    const photo3Button = screen.getAllByRole("button")[2];
    await user.click(photo3Button);

    // photo-3 should now be unselected (no badge), photo-5 should re-number from 3 → 2.
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();

    // photo-1 should still have badge "1"
    expect(screen.getAllByRole("button")[0]).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // photo-3 should now NOT be pressed
    expect(screen.getAllByRole("button")[2]).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    // photo-5 should still be pressed (now with badge "2")
    expect(screen.getAllByRole("button")[4]).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows the selection counter", () => {
    render(
      <PhotoSelector
        photoUrls={PHOTOS}
        selected={[PHOTOS[0], PHOTOS[1]]}
        onToggle={vi.fn()}
        max={5}
      />,
    );
    expect(screen.getByText(/2 \/ 5 selected/)).toBeInTheDocument();
  });

  it("shows a helpful hint when nothing is selected yet", () => {
    render(
      <PhotoSelector photoUrls={PHOTOS} selected={[]} onToggle={vi.fn()} />,
    );
    expect(
      screen.getByText(/click photos in the order you want/i),
    ).toBeInTheDocument();
  });

  describe("Clear button", () => {
    it("does not render the Clear button when nothing is selected", () => {
      render(
        <PhotoSelector
          photoUrls={PHOTOS}
          selected={[]}
          onToggle={vi.fn()}
          onClear={vi.fn()}
        />,
      );
      expect(
        screen.queryByRole("button", { name: /^clear$/i }),
      ).not.toBeInTheDocument();
    });

    it("does not render the Clear button when onClear is not provided", () => {
      render(
        <PhotoSelector
          photoUrls={PHOTOS}
          selected={[PHOTOS[0]]}
          onToggle={vi.fn()}
        />,
      );
      expect(
        screen.queryByRole("button", { name: /^clear$/i }),
      ).not.toBeInTheDocument();
    });

    it("renders the Clear button when selections exist and onClear is provided", () => {
      render(
        <PhotoSelector
          photoUrls={PHOTOS}
          selected={[PHOTOS[0]]}
          onToggle={vi.fn()}
          onClear={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("button", { name: /^clear$/i }),
      ).toBeInTheDocument();
    });

    it("calls onClear when the Clear button is clicked", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <PhotoSelector
          photoUrls={PHOTOS}
          selected={[PHOTOS[0], PHOTOS[1]]}
          onToggle={vi.fn()}
          onClear={onClear}
        />,
      );
      await user.click(screen.getByRole("button", { name: /^clear$/i }));
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });
});
