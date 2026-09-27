'use client';

import { useCallback, useEffect, useRef } from "react";
import { readIndexPos, useScrollStore } from "../_scroll";
import { driveTo } from "./driveTo";

/**
 * "Scroll to section N" — the site-side workaround for the engine seam documented in
 * JUMP_TO_FEATURE.md (§1: there is no public jump API, and `app/_scroll` is off limits).
 *
 * ## Why it drives the engine from its own input
 * The obvious alternative — writing each section's integrated position directly, as the
 * proposed engine patch does — desynchronises the page: the *global* scroll counter
 * (`globalScroll` in `_scroll/useSequenceProgress.ts`) only ever advances from the wheel
 * accumulator, and it is what every `rawAnim` is measured against. Setting per-index
 * positions leaves that counter behind, so after a jump anything keyed to global scroll
 * is animating for a panel the page has already left. (Nothing on this site uses
 * `rawAnim` today — the travelling mascot that did was removed — but the argument is
 * about the engine's contract, not about the current cast.)
 *
 * Feeding the accumulator instead keeps *everything* in phase by construction — active
 * section, `snap` glide, per-panel reveals, global counter — because the engine sees the
 * exact same input it sees from a real wheel. We are a very fast, very determined user.
 *
 * ## Mechanics
 * The feeding itself lives in `./driveTo` (shared with `StepScroller` on the
 * `variante/scroll-a-blocchi` branch). A jump is one drive to a `(section, position)`:
 *   forward  — the target section at `land` units in, so its `snap` glide finishes and
 *              its reveals play (it would otherwise arrive at pos 0, mid-glide);
 *   backward — the target section a little below where it was left (it comes back at
 *              its ceiling, fully revealed but sitting right on the hand-off edge).
 *
 * A real wheel or pointerdown anywhere aborts the jump (`e.isTrusted` — our own events
 * don't), so the user is never fighting an animation they can't stop. With the stepper
 * mounted a real wheel never reaches the listener below (it is swallowed in the capture
 * phase), and it is the stepper's own drive that ends the jump instead: one drive per
 * store, and a new one supersedes the old.
 *
 * When the engine ships `useScrollNav().jumpTo()`, this file's body is the only thing
 * that changes; callers keep calling `jumpTo(index, el)`.
 */

/** Scroll units fed per frame while travelling. THE speed knob: a panel costs ~1100-2200
 *  units, so 70 crosses one in roughly 320ms. Higher = snappier, less legible. */
const UNITS_PER_FRAME = 70;
/** Under `prefers-reduced-motion` the travel itself is the motion — get it over with.
 *  200 is the ceiling, not a taste: see `driveTo`'s «Pace». */
const REDUCED_UNITS_PER_FRAME = 200;
/** Default units into the target after arriving forward: enough to finish the snap
 *  glide (SNAP = 320 in page.tsx) and play the staggered reveals (the last ends at ~860).
 *  A panel whose story is STAGED wants more than this — the three service panels only
 *  start sliding their focus slab in at 960 — so `jumpTo` takes a per-call override and
 *  HERO_INDEX carries one per entry. Whatever the value, it must stay below the target's
 *  own PANEL_END or the landing scrolls straight past the panel it just travelled to
 *  (the driver stops on the overshoot rather than chase it). */
const LAND = 900;
/** Units below where a section was left, when arriving backward, to sit off the hand-off
 *  edge without unwinding the panel's reveals (which finish ~500 units below its
 *  threshold). */
const BACK_OFF = 250;

export default function useSectionJump(): {
  jumpTo: (target: number, from: Element, land?: number) => void;
} {
  const store = useScrollStore();
  /** Ends the jump this hook started, if it is still in flight — on unmount. */
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelRef.current?.(), []);

  const jumpTo = useCallback(
    (target: number, from: Element, land = LAND) => {
      const origin = store.state.sectionIndex;
      if (origin === target) return;
      const pos = target > origin ? land : Math.max(0, readIndexPos(store, target) - BACK_OFF);
      const step = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? REDUCED_UNITS_PER_FRAME
        : UNITS_PER_FRAME;

      function abort(e: Event) {
        if (e.isTrusted) cancelRef.current?.();
      }
      window.addEventListener("wheel", abort, { passive: true });
      window.addEventListener("pointerdown", abort, { passive: true });

      cancelRef.current = driveTo(store, from, { index: target, pos }, step, () => {
        window.removeEventListener("wheel", abort);
        window.removeEventListener("pointerdown", abort);
        cancelRef.current = null;
      });
    },
    [store],
  );

  return { jumpTo };
}
