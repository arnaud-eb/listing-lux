import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBeforeUnload } from "./use-before-unload";

describe("useBeforeUnload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does NOT add a listener when disabled", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useBeforeUnload(false));
    const beforeUnloadCalls = addSpy.mock.calls.filter(
      ([type]) => type === "beforeunload",
    );
    expect(beforeUnloadCalls).toHaveLength(0);
  });

  it("adds a listener when enabled", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useBeforeUnload(true));
    const beforeUnloadCalls = addSpy.mock.calls.filter(
      ([type]) => type === "beforeunload",
    );
    expect(beforeUnloadCalls).toHaveLength(1);
  });

  it("removes the listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useBeforeUnload(true));
    unmount();
    const beforeUnloadCalls = removeSpy.mock.calls.filter(
      ([type]) => type === "beforeunload",
    );
    expect(beforeUnloadCalls).toHaveLength(1);
  });

  it("toggles the listener when enabled flips", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useBeforeUnload(enabled),
      { initialProps: { enabled: false } },
    );
    expect(
      addSpy.mock.calls.filter(([type]) => type === "beforeunload"),
    ).toHaveLength(0);

    rerender({ enabled: true });
    expect(
      addSpy.mock.calls.filter(([type]) => type === "beforeunload"),
    ).toHaveLength(1);

    rerender({ enabled: false });
    expect(
      removeSpy.mock.calls.filter(([type]) => type === "beforeunload"),
    ).toHaveLength(1);
  });

  it("the handler sets returnValue and calls preventDefault", () => {
    let captured: ((e: BeforeUnloadEvent) => void) | undefined;
    vi.spyOn(window, "addEventListener").mockImplementation(
      (type, listener) => {
        if (type === "beforeunload") {
          captured = listener as (e: BeforeUnloadEvent) => void;
        }
      },
    );
    renderHook(() => useBeforeUnload(true));

    expect(captured).toBeDefined();
    const event = {
      preventDefault: vi.fn(),
      returnValue: undefined as unknown,
    } as unknown as BeforeUnloadEvent;
    captured!(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe("");
  });
});
