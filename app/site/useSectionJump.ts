'use client';

import { useCallback, useEffect, useRef } from "react";
import { useScrollStore } from "../_scroll";

/**
 * "Scroll to section N" — the site-side workaround for the engine seam documented in
 * JUMP_TO_FEATURE.md (§1: there is no public jump API, and `app/_scroll` is off limits).
 *
 * ## Why it drives the engine from its own input
 * The obvious alternative — writing each section's integrated position directly, as the
 * proposed engine patch does — desynchronises the page: the *global* scroll counter
 * (`globalScroll` in `_scroll/useSequenceProgress.ts`) only ever advances from the wheel
 * accumulator, and it is what every `rawAnim` is measured against — the travelling
 * mascot's whole journey (`JOURNEY` in page.tsx), for one. Setting per-index positions
 * leaves that counter behind, so after a jump the mascot is animating for a panel the
 * page has left.
 *
 * Feeding the accumulator instead keeps *everything* in phase by construction — active
 * section, `snap` glide, per-panel reveals, global counter — because the engine sees the
 * exact same input it sees from a real wheel. We are a very fast, very determined user.
 *
 * ## Mechanics
 * `ScrollShell` listens for `wheel` on the scroll container and clamps each event to
 * ±100 (anti-fling), so one frame's travel is dispatched as `ceil(units / 100)` synthetic
 * events. They are dispatched on the element that was clicked — it lives inside the
 * container, and wheel events bubble, so they land in the shell's handler with no
 * querySelector and no reference to engine internals.
 *
 * `advanceSection` moves at most ONE section per frame, so the loop is frame-paced by
 * nature: it feeds, waits a frame, re-reads `store.state.sectionIndex`, and repeats.
 * Reading that field is the whole coupling to the engine — a public, per-frame value.
 *
 * Two phases:
 *   travel — feed until the active index is the target;
 *   land   — going forward the target arrives at pos 0 (mid `snap` glide, reveals not
 *            started), so keep feeding LAND units to seat it. Going backward it arrives
 *            at its ceiling (already fully revealed, but sitting right on the hand-off
 *            edge), so back off a little instead.
 *
 * A real wheel or touch anywhere aborts the jump (`e.isTrusted` — our own synthetic
 * events don't cancel us), so the user is never fighting an animation they can't stop.
 *
 * When the engine ships `useScrollNav().jumpTo()`, this file's body is the only thing
 * that changes; callers keep calling `jumpTo(index, el)`.
 */

/** Scroll units fed per frame while travelling. THE speed knob: a panel costs ~1100-2200
 *  units, so 70 crosses one in roughly 320ms. Higher = snappier, less legible. */
const UNITS_PER_FRAME = 70;
/** Under `prefers-reduced-motion` the travel itself is the motion — get it over with. */
const REDUCED_UNITS_PER_FRAME = 400;
/** Default units fed into the target after arriving forward: enough to finish the snap
 *  glide (SNAP = 320 in page.tsx) and play the staggered reveals (the last ends at ~860).
 *  A panel whose story is STAGED wants more than this — the three service panels only
 *  start sliding their focus slab in at 960 — so `jumpTo` takes a per-call override and
 *  HERO_INDEX carries one per entry. Whatever the value, it must stay below the target's
 *  own PANEL_END or the landing scrolls straight past the panel it just travelled to. */
const LAND = 900;
/** Units fed back after arriving backward, to sit off the hand-off edge without
 *  unwinding the panel's reveals (which finish ~500 units below its threshold). */
const BACK_OFF = 250;
/** Travel budget per section crossed, in frames. A section costs ~20 frames at the
 *  speed above, so this is 3x headroom — and it's what stops a jump to a section that
 *  can't be reached (an index that doesn't exist, a panel that never hands off) from
 *  scrolling the page to the bottom instead of giving up. */
const FRAMES_PER_SECTION = 60;
/** Hard stop, in frames (~10s at 60fps) — a jump must never become a permanent loop. */
const MAX_FRAMES = 600;
/** ScrollShell's per-event clamp; we split a frame's travel into events this size. */
const WHEEL_CLAMP = 100;

export default function useSectionJump(): {
  jumpTo: (target: number, from: Element, land?: number) => void;
} {
  const store = useScrollStore();
  /** Cancels the jump currently in flight (at most one), so a second click — or an
   *  unmount — never leaves two rAF loops feeding the accumulator against each other. */
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelRef.current?.(), []);

  const jumpTo = useCallback(
    (target: number, from: Element, land = LAND) => {
      cancelRef.current?.();

      const origin = store.state.sectionIndex;
      if (origin === target) return;
      const dir = target > origin ? 1 : -1;
      const landUnits = dir > 0 ? land : BACK_OFF;
      const step = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? REDUCED_UNITS_PER_FRAME
        : UNITS_PER_FRAME;

      let raf = 0;
      let frames = 0;
      let fed = 0; // units fed during the landing phase
      let arrived = false; // travel done, now seating the target panel

      // Declared before `stop` so it can be removed by it; both only ever run after the
      // pair is fully initialised (from a listener or a frame, never during setup).
      function abort(e: Event) {
        if (e.isTrusted) stop();
      }
      function stop() {
        cancelAnimationFrame(raf);
        window.removeEventListener("wheel", abort);
        window.removeEventListener("pointerdown", abort);
        cancelRef.current = null;
      }

      /** One frame's worth of travel, split into events the shell won't clamp away. */
      const feed = (units: number) => {
        const n = Math.ceil(Math.abs(units) / WHEEL_CLAMP);
        const each = units / n;
        for (let i = 0; i < n; i++) {
          from.dispatchEvent(new WheelEvent("wheel", { deltaY: each, bubbles: true, cancelable: true }));
        }
      };

      const tick = () => {
        if (++frames > MAX_FRAMES) return stop();
        const index = store.state.sectionIndex;

        if (!arrived) {
          if (index !== target) {
            // Unreachable target (or a panel that won't hand off): give up rather than
            // keep feeding the page forward forever.
            if (frames > (Math.abs(target - origin) + 1) * FRAMES_PER_SECTION) return stop();
            feed(dir * step);
            raf = requestAnimationFrame(tick);
            return;
          }
          arrived = true;
        }

        // Landing. If the index moved off the target we overshot (LAND too big for this
        // panel's budget) — bail rather than chase it and run away down the page.
        if (index !== target) return stop();
        const units = Math.min(step, landUnits - fed);
        if (units <= 0) return stop();
        feed(dir * units);
        fed += units;
        raf = requestAnimationFrame(tick);
      };

      window.addEventListener("wheel", abort, { passive: true });
      window.addEventListener("pointerdown", abort, { passive: true });
      cancelRef.current = stop;
      raf = requestAnimationFrame(tick);
    },
    [store],
  );

  return { jumpTo };
}
