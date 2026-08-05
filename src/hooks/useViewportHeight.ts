"use client";

import { useEffect } from "react";

/**
 * Writes the real visible viewport height into the `--vh` custom
 * property — CLAUDE.md §9.
 *
 * iOS Safari's collapsing toolbar makes `100vh` taller than the screen,
 * which pushes fixed bottom elements off-screen. `visualViewport.height`
 * never lies. Everything sizes off `--vh` instead.
 *
 * Re-measured on resize, orientationchange and visualViewport.resize
 * (the last one is what fires when the toolbar collapses), debounced
 * 60ms so a drag-resize doesn't thrash layout.
 */
export function useViewportHeight() {
  useEffect(() => {
    let timer: number | undefined;

    const measure = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${h}px`);
    };

    const debounced = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 60);
    };

    measure();

    window.addEventListener("resize", debounced);
    window.addEventListener("orientationchange", debounced);
    window.visualViewport?.addEventListener("resize", debounced);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", debounced);
      window.removeEventListener("orientationchange", debounced);
      window.visualViewport?.removeEventListener("resize", debounced);
    };
  }, []);
}
