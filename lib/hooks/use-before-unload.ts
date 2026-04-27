"use client";

import { useEffect } from "react";

/**
 * Installs a `beforeunload` listener while `enabled` is true so the browser
 * shows its native "Leave site?" prompt when the user closes the tab,
 * refreshes, or navigates to an external URL with unsaved work.
 *
 * Modern browsers ignore custom messages — the prompt is generic — but
 * setting `returnValue` is what triggers the dialog at all. This guard does
 * NOT cover internal Next.js Link navigation (App Router has no first-party
 * API for that — see plan notes).
 */
export function useBeforeUnload(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);
}
