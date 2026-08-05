"use client";

import { useSyncExternalStore } from "react";

/**
 * `prefers-reduced-motion` — CLAUDE.md §7.
 *
 * Not an afterthought. When set: no auto-cuts, no drift, no rain, no
 * grain animation, no parallax. The page stays fully functional and
 * completely legible.
 *
 * A media query is an external store, so this subscribes to it rather
 * than mirroring it into state inside an effect — which would cause a
 * cascading render on mount and is what React 19's linter objects to.
 * The server snapshot is `false`: motion is assumed until the client
 * says otherwise, and the `@media (prefers-reduced-motion)` block in
 * globals.css covers the gap before hydration.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

let mq: MediaQueryList | null = null;
const media = () => (mq ??= window.matchMedia(QUERY));

function subscribe(onChange: () => void) {
  const m = media();
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

const getSnapshot = () => media().matches;
const getServerSnapshot = () => false;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
