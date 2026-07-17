'use client';

import { useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useScrollFrame } from "@/app/_scroll";
import { useCopyOnClick } from "./useCopyOnClick";

/** A store that never emits: its client snapshot is `true`, its server snapshot
 *  `false`, so `useSyncExternalStore` yields "have we hydrated on the client yet?". */
const NEVER = () => () => {};

/**
 * Dev-only heads-up overlay: the scroll loop's rAF frames-per-second; the live
 * per-section scroll level (`scroll` — the integral a section's `anim`
 * `budget`/`start`/`end` are measured against; resets each section); the live
 * GLOBAL scroll level (`global` — the never-resetting cumulative integral a
 * `rawAnim`'s `at` is measured against, so scroll to a moment and read the number
 * straight off as the `at`); and the active section index. Pinned to the top-right
 * and always on top.
 *
 * Gate its *usage* behind `process.env.NODE_ENV === "development"` (see
 * page.tsx) so it never ships to production. It reads the shared store via
 * `useScrollFrame` and writes the DOM imperatively — like every other widget it
 * never re-renders per frame. Rendered through a portal to <body> so it stays
 * viewport-fixed (clear of the widgets' transformed ancestors) and is never
 * collected as a ScrollShell widget.
 */
export default function DevHud() {
  const fpsRef = useRef<HTMLSpanElement>(null);
  const scrollRef = useRef<HTMLSpanElement>(null);
  const globalRef = useRef<HTMLSpanElement>(null);
  const sectionRef = useRef<HTMLSpanElement>(null);

  const frames = useRef(0);
  const windowStart = useRef(0);
  const lastSection = useRef(-1);
  const scrollLevel = useRef(0); // per-section scroll integral, mirrors useSequenceProgress
  const globalLevel = useRef(0); // never-resetting cumulative integral, mirrors globalScroll (rawAnim `at`)

  // Click to copy the point's `x`/`y`; Alt-click to copy the element's size.
  useCopyOnClick();

  // Portal into <body> only after hydration, so the server render and the first
  // client render agree (both null). Guarding on `typeof document` instead renders
  // null on the server but the portal on the first client render — a mismatch.
  const mounted = useSyncExternalStore(NEVER, () => true, () => false);

  useScrollFrame((s) => {
    frames.current++;

    // Reset the scroll integral when the active section changes — each section
    // measures its position from 0 (see useSequenceProgress).
    if (s.sectionIndex !== lastSection.current) {
      lastSection.current = s.sectionIndex;
      scrollLevel.current = 0;
      if (sectionRef.current) sectionRef.current.textContent = `s${s.sectionIndex}`;
    }

    // Integrate this tick's delta, floored at 0. `scrollLevel` is the per-section
    // integral (reset above); `globalLevel` never resets — the cumulative value a
    // rawAnim's `at` is measured against (mirrors globalScroll across the whole page).
    scrollLevel.current = Math.max(0, scrollLevel.current + s.accumulator);
    globalLevel.current = Math.max(0, globalLevel.current + s.accumulator);

    // Recompute FPS ~4×/sec over the elapsed window so the readouts are legible.
    if (!windowStart.current) windowStart.current = s.time;
    const elapsed = s.time - windowStart.current;
    if (elapsed >= 250) {
      const fps = Math.round((frames.current * 1000) / elapsed);
      if (fpsRef.current) fpsRef.current.textContent = `${fps} fps`;
      if (scrollRef.current) scrollRef.current.textContent = `scroll ${Math.round(scrollLevel.current)}`;
      if (globalRef.current) globalRef.current.textContent = `global ${Math.round(globalLevel.current)}`;
      frames.current = 0;
      windowStart.current = s.time;
    }
  });

  if (!mounted) return null; // no portal target during SSR / first client render

  return createPortal(
    <div
      className="pointer-events-none fixed top-2 right-2 z-[9999] select-none rounded bg-black/70 px-2 py-1 text-xs leading-tight tabular-nums text-white/90"
      style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
    >
      <span ref={fpsRef} className="block">— fps</span>
      <span ref={scrollRef} className="block">scroll 0</span>
      <span ref={globalRef} className="block">global 0</span>
      <span ref={sectionRef} className="block">s0</span>
    </div>,
    document.body,
  );
}
