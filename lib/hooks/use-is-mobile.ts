"use client";

import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Returns true when the viewport is ≤767px wide.
 *
 * SSR-safe: returns `false` on the server and the first client render, then
 * resolves to the real viewport size. Components that swap between
 * desktop/mobile primitives (Popover ↔ Dialog) hydrate to the desktop branch
 * first and switch on mount — there is no SSR flash because consumers
 * (ExportMenu, regenerate popover) are dynamically imported with `ssr: false`
 * or only mount on user interaction.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
