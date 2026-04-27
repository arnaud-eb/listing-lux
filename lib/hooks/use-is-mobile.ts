"use client";

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Returns true when the viewport is ≤767px wide.
 *
 * SSR-safe: returns `false` on first render, then resolves to the real
 * viewport size after mount. Components that swap between desktop/mobile
 * primitives (Popover ↔ Dialog) should hydrate to the desktop branch first
 * and switch on mount — there is no SSR flash because consumers (ExportMenu,
 * regenerate popover) are dynamically imported with `ssr: false` or only
 * mount on user interaction.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
