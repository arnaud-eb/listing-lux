import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWizardSteps } from "./useWizardSteps";

describe("useWizardSteps", () => {
  it("starts at photos with 2 visible steps", () => {
    const { result } = renderHook(() => useWizardSteps());
    expect(result.current.steps).toEqual(["photos", "languages"]);
    expect(result.current.current).toBe("photos");
    expect(result.current.index).toBe(1);
    expect(result.current.totalSteps).toBe(2);
  });

  it("walks photos → languages via goNext", () => {
    const { result } = renderHook(() => useWizardSteps());
    act(() => result.current.goNext());
    expect(result.current.current).toBe("languages");
    expect(result.current.index).toBe(2);
  });

  it("goNext is a no-op at the last step", () => {
    const { result } = renderHook(() => useWizardSteps());
    act(() => result.current.goTo("languages"));
    act(() => result.current.goNext());
    expect(result.current.current).toBe("languages");
  });

  it("goBack walks languages → photos", () => {
    const { result } = renderHook(() => useWizardSteps());
    act(() => result.current.goTo("languages"));
    act(() => result.current.goBack());
    expect(result.current.current).toBe("photos");
  });

  it("goBack is a no-op at the first step", () => {
    const { result } = renderHook(() => useWizardSteps());
    act(() => result.current.goBack());
    expect(result.current.current).toBe("photos");
  });

  it("goTo('branding') is allowed (off-list sub-flow)", () => {
    const { result } = renderHook(() => useWizardSteps());
    act(() => result.current.goTo("branding"));
    expect(result.current.current).toBe("branding");
    // index falls back to 1 when current is off-list, so the counter
    // doesn't show "Step 0" or NaN.
    expect(result.current.index).toBe(1);
    expect(result.current.totalSteps).toBe(2);
  });

  it("reset returns to the first step", () => {
    const { result } = renderHook(() => useWizardSteps());
    act(() => result.current.goTo("languages"));
    expect(result.current.current).toBe("languages");
    act(() => result.current.reset());
    expect(result.current.current).toBe("photos");
  });
});
