'use client';

import { useEffect, useRef } from "react";
import { useScrollStore } from "../_scroll";
import { currentPoint, driveTo } from "./driveTo";
import { nextStop } from "./useStops";

/**
 * **Scroll a blocchi** — the page moves in blocks, not continuously. A small gesture
 * plays the next block of content by itself and stops at the next stop (`useStops.ts`);
 * the scroll wheel is a "next" button, not a scrubber.
 *
 * ## Why it lives in the site and not in the engine
 * `app/_scroll` and `ScrollShell` are off limits (CLAUDE.md). So, like the hero's index
 * (`useSectionJump`), this drives the engine **from its own input**: it takes the real
 * input away from the shell and replaces it with synthetic wheel events (`driveTo`). The
 * engine is none the wiser — it sees a user scrolling very evenly to exactly the right
 * spot. The proper engine version is written up as seam 5 in JUMP_TO_FEATURE.md.
 *
 * ## How the real input is taken away
 * Both listeners are on `window` in the CAPTURE phase, i.e. before anything else on the
 * page, and only touch *trusted* events — our own synthetic wheel events are untrusted,
 * so they pass straight through to the shell.
 *
 * - **Wheel**: `preventDefault` + `stopPropagation`, always. The first event of a gesture
 *   starts one step; the rest of the gesture is swallowed. A gesture is over once the
 *   wheel has been quiet for `QUIET_MS` AND the step has finished playing — so one
 *   trackpad flick, with its long inertia tail, is exactly one step, and so is a mouse
 *   wheel spun without a pause.
 * - **Touch/pen**: `pointerdown` is left alone (the shell still starts its drag, and
 *   `ContactForm`'s tap-vs-swipe still sees it). Every `pointermove` is
 *   `stopPropagation`ed, so the shell never scrubs; the finger's travel since
 *   `pointerdown` is summed here, and past `SWIPE_PX` it triggers one step per gesture.
 *
 *   `stopPropagation` and NOT `stopImmediatePropagation`, and that is load-bearing:
 *   `useTapVsSwipe` also listens for `pointermove` on `window` in the capture phase, and
 *   plain `stopPropagation` does not stop other listeners on the SAME node. So the form
 *   still learns that a finger travelled, and a swipe that starts on a field still does
 *   not focus it.
 *
 * Wheel events over the quick-contact badge (portaled outside the shell) now step the
 * page too; before, they did nothing at all.
 *
 * Renders a hidden span: synthetic wheel events have to be dispatched on an element
 * INSIDE the scroll container to bubble into the shell's listener, so this component
 * must be mounted inside a `<Section>`.
 */

/** Scroll units fed per frame while a block plays — THE pace knob. The longest block
 *  (a service panel's focus + photos, ~1300 units) takes ~0.7s at 30. */
const STEP_UNITS_PER_FRAME = 30;
/** Under `prefers-reduced-motion`: get the motion over with. */
const REDUCED_UNITS_PER_FRAME = 200;
/** A wheel gesture ends after this much silence (ms). Raise it if a trackpad flick takes
 *  two steps; lower it if deliberate notches feel ignored. */
const QUIET_MS = 220;
/** Wheel deltas below this are noise (a resting finger on a trackpad), not a gesture. */
const MIN_WHEEL = 4;
/** Finger travel (px) that turns a touch into a step. Below it, it is still a tap. */
const SWIPE_PX = 30;

export default function StepScroller() {
  const store = useScrollStore();
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stepping = false; // our own step is still playing
    let lastWheel = -Infinity;

    const step = (dir: 1 | -1) => {
      const from = anchor.current;
      const target = nextStop(store, currentPoint(store), dir);
      if (!from || !target) return;
      stepping = true;
      driveTo(store, from, target, reduced.matches ? REDUCED_UNITS_PER_FRAME : STEP_UNITS_PER_FRAME, () => {
        stepping = false;
      });
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.isTrusted) return;
      e.preventDefault();
      e.stopPropagation();
      // Noise neither starts a gesture nor keeps one open — an inertia tail fades out
      // through exactly these values.
      if (Math.abs(e.deltaY) < MIN_WHEEL) return;
      const quiet = e.timeStamp - lastWheel > QUIET_MS;
      lastWheel = e.timeStamp;
      if (stepping || !quiet) return;
      step(e.deltaY > 0 ? 1 : -1);
    };

    let touchY: number | null = null; // start of the current touch; null once it stepped
    const onPointerDown = (e: PointerEvent) => {
      if (e.isTrusted && e.pointerType !== "mouse" && e.isPrimary) touchY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!e.isTrusted || e.pointerType === "mouse") return;
      e.stopPropagation();
      if (touchY === null || stepping) return;
      const travel = touchY - e.clientY; // finger up = content forward, like native
      if (Math.abs(travel) < SWIPE_PX) return;
      touchY = null;
      step(travel > 0 ? 1 : -1);
    };
    const onPointerEnd = () => {
      touchY = null;
    };

    const capture = { capture: true } as const;
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    window.addEventListener("pointerdown", onPointerDown, capture);
    window.addEventListener("pointermove", onPointerMove, capture);
    window.addEventListener("pointerup", onPointerEnd, capture);
    window.addEventListener("pointercancel", onPointerEnd, capture);
    return () => {
      window.removeEventListener("wheel", onWheel, capture);
      window.removeEventListener("pointerdown", onPointerDown, capture);
      window.removeEventListener("pointermove", onPointerMove, capture);
      window.removeEventListener("pointerup", onPointerEnd, capture);
      window.removeEventListener("pointercancel", onPointerEnd, capture);
    };
  }, [store]);

  return <span ref={anchor} hidden aria-hidden />;
}
