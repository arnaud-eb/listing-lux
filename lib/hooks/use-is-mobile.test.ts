import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-is-mobile";

type Listener = (e: MediaQueryListEvent) => void;

function setupMatchMedia(initialMatches: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initialMatches,
    media: "(max-width: 767px)",
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
    dispatchEvent: () => true,
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue(mql),
  );
  // Also stub on window for jsdom
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue(mql),
  });
  return {
    fire: (matches: boolean) => {
      mql.matches = matches;
      listeners.forEach((l) => l({ matches } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.size,
  };
}

describe("useIsMobile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns false on first render (SSR-safe baseline)", () => {
    setupMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    // After mount, effect runs and reads the matchMedia value (true).
    expect(result.current).toBe(true);
  });

  it("returns false when viewport is desktop (>767px)", () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("updates when viewport crosses the breakpoint", () => {
    const mm = setupMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      mm.fire(true);
    });
    expect(result.current).toBe(true);
  });

  it("removes its listener on unmount", () => {
    const mm = setupMatchMedia(false);
    const { unmount } = renderHook(() => useIsMobile());
    expect(mm.listenerCount()).toBe(1);
    unmount();
    expect(mm.listenerCount()).toBe(0);
  });
});
