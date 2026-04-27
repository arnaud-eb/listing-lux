"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * The wizard's visible steps. Branding is in the type because it's
 * reachable via `goTo("branding")` (the Languages step's Add/Edit card),
 * but it's NOT a numbered step in the linear flow — it's a sub-flow,
 * accessed only on demand. The numbered flow is always Photos → Languages.
 */
export type WizardStep = "branding" | "photos" | "languages";

const STEPS: readonly WizardStep[] = ["photos", "languages"];

interface WizardController {
  /** Ordered list of numbered steps (for the step indicator). */
  steps: readonly WizardStep[];
  /** Currently visible step. */
  current: WizardStep;
  /** 1-based index of `current` in `steps`. Falls back to 1 if `current` is
   *  off-list (e.g. branding sub-flow) so the step counter stays sane. */
  index: number;
  /** Total number of numbered steps. */
  totalSteps: number;
  /** Move to the next numbered step (no-op at the end). */
  goNext: () => void;
  /** Move to the previous numbered step (no-op at the start). */
  goBack: () => void;
  /** Jump to a specific step (including the off-list "branding" sub-flow). */
  goTo: (step: WizardStep) => void;
  /** Reset to the first numbered step. */
  reset: () => void;
}

/**
 * Drives the PDF export wizard's step machine. Always 2 numbered steps:
 * Photos → Languages. Branding is reached only from the Languages step's
 * Add/Edit card (a sub-flow), so it doesn't appear in the step counter.
 *
 * The previous "first-timer (3 steps with Branding) vs returning (2 steps)"
 * fork was removed — both flows now produce the same 2-step linear journey.
 * The empty-profile state is handled in-place by the Languages step's
 * "Add your branding" card. Single consistent UX, less code complexity.
 */
export function useWizardSteps(): WizardController {
  const [current, setCurrent] = useState<WizardStep>(STEPS[0]);

  const index = useMemo(() => {
    const i = STEPS.indexOf(current);
    return i === -1 ? 1 : i + 1;
  }, [current]);

  const goNext = useCallback(() => {
    setCurrent((c) => {
      const i = STEPS.indexOf(c);
      return i < STEPS.length - 1 ? STEPS[i + 1] : c;
    });
  }, []);

  const goBack = useCallback(() => {
    setCurrent((c) => {
      const i = STEPS.indexOf(c);
      return i > 0 ? STEPS[i - 1] : c;
    });
  }, []);

  const goTo = useCallback((step: WizardStep) => {
    setCurrent(step);
  }, []);

  const reset = useCallback(() => {
    setCurrent(STEPS[0]);
  }, []);

  return {
    steps: STEPS,
    current,
    index,
    totalSteps: STEPS.length,
    goNext,
    goBack,
    goTo,
    reset,
  };
}
