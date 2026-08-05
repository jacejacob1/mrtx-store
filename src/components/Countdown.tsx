"use client";

import { useSyncExternalStore } from "react";
import { CONFIG } from "@/lib/config";

export type Parts = { d: number; h: number; m: number; s: number };

const target = Date.parse(CONFIG.LAUNCH);
export const LAUNCH_VALID = Number.isFinite(target);

/**
 * Whole seconds remaining. Returning a NUMBER rather than an object is
 * deliberate: useSyncExternalStore calls getSnapshot on every render
 * and compares by identity, so a fresh object each time would loop
 * forever. An integer is stable for the whole second it describes.
 */
function secondsLeft(): number {
  if (!LAUNCH_VALID) return 0;
  return Math.max(0, Math.floor((target - Date.now()) / 1000));
}

/**
 * One tick source for the whole page.
 *
 * The aperture renders a second, pixel-identical copy of the hero (§5).
 * If each copy ran its own interval they could land on different
 * seconds for a frame, and the slit would show a different number from
 * the page underneath. Ticking once here and passing the value down
 * makes that impossible.
 *
 * Polls at 250ms so the display turns over promptly on the second
 * boundary without a 1Hz interval drifting visibly.
 */
function subscribe(onChange: () => void) {
  if (!LAUNCH_VALID) return () => {};
  const id = window.setInterval(onChange, 250);
  return () => window.clearInterval(id);
}

const getServerSnapshot = () => 0;

export function useCountdown(): Parts {
  const total = useSyncExternalStore(subscribe, secondsLeft, getServerSnapshot);
  return {
    d: Math.floor(total / 86_400),
    h: Math.floor(total / 3_600) % 24,
    m: Math.floor(total / 60) % 60,
    s: total % 60,
  };
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/**
 * §3: anything the machine knows goes in mono, and live numerals carry
 * tabular-nums — without it the row twitches sideways every time a
 * digit changes width.
 *
 * A malformed LAUNCH says so rather than silently counting to the wrong
 * moment.
 */
export function CountdownView({
  parts,
  className,
}: {
  parts: Parts;
  className?: string;
}) {
  if (!LAUNCH_VALID) {
    return (
      <p className={`mono text-readout ${className ?? ""}`}>
        SET DATE IN CONFIG
      </p>
    );
  }

  return (
    <p
      className={`mono text-readout tracking-[.16em] ${className ?? ""}`}
      role="timer"
      aria-label="Time until launch"
    >
      {pad(parts.d, 3)}
      <span className="opacity-45">d </span>
      {pad(parts.h)}
      <span className="opacity-45">h </span>
      {pad(parts.m)}
      <span className="opacity-45">m </span>
      {pad(parts.s)}
      <span className="opacity-45">s</span>
    </p>
  );
}
