'use client';

// import HookedDiv from "./HookedDiv"
import { useEffect, useRef, useState } from "react";
import {
  advanceSection,
  createScrollStore,
  integrateIndexPos,
  ScrollStateProvider,
  sectionScrollTop,
  smoothLerp,
} from "./_scroll";

/** Half-life (ms) of the panel-to-panel scroll glide — the smoothness knob (bigger
 *  = softer/slower). It eases scrollTop toward a target that stays continuous across
 *  hand-offs, so it glides smoothly and still lands exactly, without ever stranding. */
const SCROLL_HALF_LIFE = 200;

/** Touch/pen scrub sensitivity — scroll units per pixel of finger travel. This is
 *  THE knob for how fast a swipe scrubs: 1 = 1:1 (sluggish against the large section
 *  budgets), higher = a swipe covers more ground. Only scales touch/pen; the wheel
 *  is unscaled. */
const TOUCH_SENSITIVITY = 3.5;

/** Most scroll units ONE FRAME may consume.
 *
 *  The ±100 clamps in the handlers below are per EVENT, not per frame, and nothing
 *  bounded the frame: a trackpad or a 120Hz digitizer delivers several events per
 *  frame, and touch is multiplied by TOUCH_SENSITIVITY *after* its clamp — so a fling
 *  frame carried 300-700 units and crossed a 2200-unit panel in ~7 frames (~105ms).
 *  That is far inside the 90ms half-life every animation's progress is smoothed with,
 *  which is why a fast scroll used to teleport past panels instead of playing them.
 *
 *  At 200 the same panel takes ~11 frames (~183ms) and a full-page fling ~1.1s. The
 *  line is drawn ABOVE a normal swipe (~105-175 units/frame at 3.5x) and below a
 *  fling, so ordinary scrolling never meets this clamp at all.
 *
 *  Note what this does NOT do: rate-limiting alone can never *finish* an animation,
 *  because the smoother is chasing a moving target and its lag is proportional to
 *  speed — even an unusable cap of 40 leaves a residual gap of ~0.25. Finishing is
 *  `useSequenceProgress`'s job (it eases to rest off-section). This knob only decides
 *  how much of a panel you SEE play on the way past. */
const MAX_FRAME_DELTA = 200;
/** Ceiling on the carried-over queue. The excess of a frame is CARRIED, not discarded,
 *  so a bursty event stream loses nothing — but a fling must not leave the page
 *  coasting after the finger stops, so the queue holds at most 3 frames (~50ms of
 *  tail). Reversing direction cancels it naturally: new input of the opposite sign
 *  sums against what is queued. */
const MAX_CARRY = MAX_FRAME_DELTA * 3;

export default function ScrollShell ({children} : {children: React.ReactNode[]}) {
  const mainContainer = useRef<HTMLDivElement>(null);

  const animationId = useRef<number>(null);
  const scrollAccumulator = useRef<number>(0);
  const currentSectionIndex = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const scrollPos = useRef<number>(0);

  // One store the core owns and writes; widgets read it via useScrollFrame.
  // useState (lazy init) gives a stable, render-readable handle: created once,
  // never re-set. Its contents mutate inside the store (see notify), not here.
  const store = useState(() => createScrollStore())[0];

  useEffect(() => {
    // Single rAF loop. Defined here as a plain local function so its self-
    // reference — requestAnimationFrame(animate) — is lint-clean (a component
    // -level useCallback that references itself is not).
    const animate = (time: number) => {
      // Consume this frame's accumulated scroll delta, so each frame reports only its
      // own movement. Widgets integrate this into their own scroll budget (see
      // ImageSequence). Bounded at MAX_FRAME_DELTA and the REMAINDER IS CARRIED rather
      // than reset to 0: a fling then reads as a fast scrub through the panels instead
      // of a jump over them, and no unit of the gesture is lost — it is only spread
      // over the next frames, up to MAX_CARRY.
      const pending = Math.max(-MAX_CARRY, Math.min(MAX_CARRY, scrollAccumulator.current));
      const delta = Math.max(-MAX_FRAME_DELTA, Math.min(MAX_FRAME_DELTA, pending));
      scrollAccumulator.current = pending - delta;

      // Advance the active section when its scroll crosses the threshold it
      // declares (and back when it returns to the bottom). Decided from the
      // previous frame's integrated position, so the hand-off lags one frame;
      // see app/_scroll/sections.ts.
      const previous = currentSectionIndex.current;
      const active = advanceSection(store, previous, delta);
      currentSectionIndex.current = active;

      // Integrate the active section's own scroll position this frame (once —
      // widgets on it read the same value below). Doing it here also advances
      // panels that own no widgets, so `snap` slides still progress.
      //
      // On a HAND-OFF frame it integrates nothing. This delta has already done its
      // job — it is what pushed the outgoing panel over its threshold — and `active`
      // is the index AFTER the advance, so spending it again here dropped the incoming
      // panel straight into the middle of its own budget: `snap` part-resolved before
      // it was ever seen, first reveals already past. One zero frame (at most
      // MAX_FRAME_DELTA units, and the rest is still queued) is imperceptible, and it
      // guarantees every panel starts its entrance from 0. The full delta is still
      // broadcast below, so the global counter a `rawAnim` reads is untouched.
      integrateIndexPos(store, active, { time, accumulator: active === previous ? delta : 0 });

      // Publish this frame's gamestate and fan out to widgets. Values go through
      // notify() (not store.state.x = ...) so the mutation stays inside the store.
      store.notify({ time, accumulator: delta, sectionIndex: active });

      // Glide the container toward the active section's panel, easing scrollTop over
      // time for a smooth transition. Safe now because the target stays continuous
      // across a hand-off (sectionScrollTop never goes null between panels) — the old
      // strand was the target vanishing, not the easing. Clamp to the reachable range
      // and snap the last sub-pixel so a panel still lands exactly flush.
      const dt = lastFrameTime.current ? Math.min(64, time - lastFrameTime.current) : 0;
      lastFrameTime.current = time;
      const container = mainContainer.current;
      if (container) {
        const want = sectionScrollTop(store, active);
        if (want !== null) {
          const target = Math.max(0, Math.min(want, container.scrollHeight - container.clientHeight));
          // Ease our OWN float — not container.scrollTop, which the browser rounds to
          // a whole pixel. Reading that rounded value back each frame makes the tiny
          // sub-pixel steps near the end vanish, stalling the glide a few px short of
          // the top/bottom. Keeping the float here (and snapping the last sub-pixel)
          // lands it exactly; we only ever *write* scrollTop, never read it back.
          let next = smoothLerp(SCROLL_HALF_LIFE)(scrollPos.current, target, dt);
          // console.log( next );
          if (Math.abs(target - next) < 0.5) next = target;
          scrollPos.current = next;
          container.scrollTop = next;
        }
      }

      animationId.current = requestAnimationFrame(animate);
    };

    animationId.current = requestAnimationFrame(animate);

    const handleWheel = (e: WheelEvent) => {
      // Accumulate scroll delta across events; the loop consumes it each frame.
      // Clamp per-event so a single fling can't jump the animation.
      scrollAccumulator.current += Math.max(-100, Math.min(100, e.deltaY));
      e.preventDefault();
    };

    // Touch/pen drag is the phone's wheel: feed the SAME accumulator so the rAF loop
    // stays input-agnostic. Pointer Events (not raw touch) give one reliable path with
    // `clientY` straight on the event — no fragile `touches[0]` — and, together with
    // `touch-action: none` on the container (see className) plus setPointerCapture,
    // the browser delivers every move to us instead of scrolling. The mouse keeps using
    // the wheel above. Swiping up (finger toward the top, smaller Y) scrolls the content
    // down like native — hence delta = last − current, under the same per-move clamp.
    let dragging = false;
    let lastPointerY = 0;
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return; // desktop stays wheel-driven
      if (!e.isPrimary) return; // a second finger must not restart the drag
      dragging = true;
      lastPointerY = e.clientY;
      // ── UPSTREAM FIX (the ONE edit this site makes to the engine) ──────────────
      // `setPointerCapture` throws NotFoundError when `pointerId` matches no ACTIVE
      // pointer — a very short tap can be released before this handler runs, and the
      // uncaught throw surfaced in the console on every tap of the hero's index.
      // Capture is an optimisation here, not a requirement: the container already has
      // `touch-action: none` and owns the pointermove/up listeners, so it only matters
      // if the finger leaves the container mid-drag. Failing is therefore harmless.
      // The real fix is the SLOP deferral specced in JUMP_TO_FEATURE.md (capture on the
      // first committed move, when the pointer is provably active) — this guard holds
      // until that lands in the library's own repo.
      try {
        mainContainer.current?.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released — drag still works, just uncaptured */
      }
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      // Clamp raw finger travel per event (anti-jump, like the wheel), THEN scale by
      // the sensitivity knob so a swipe covers a useful slice of the section budget.
      const travel = Math.max(-100, Math.min(100, lastPointerY - e.clientY));
      scrollAccumulator.current += travel * TOUCH_SENSITIVITY;
      lastPointerY = e.clientY;
    };
    const endDrag = () => {
      dragging = false;
    };

    if (mainContainer.current) {
      mainContainer.current.addEventListener('wheel', handleWheel, { passive: false });
      mainContainer.current.addEventListener('pointerdown', handlePointerDown);
      mainContainer.current.addEventListener('pointermove', handlePointerMove);
      mainContainer.current.addEventListener('pointerup', endDrag);
      mainContainer.current.addEventListener('pointercancel', endDrag);
      // Each direct child is a full-viewport section wrapper.
      for (const el of mainContainer.current.children) {
        el.classList.add("min-h-[100svh]");
      }
    }

    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
      if (mainContainer.current) {
        mainContainer.current.removeEventListener('wheel', handleWheel);
        mainContainer.current.removeEventListener('pointerdown', handlePointerDown);
        mainContainer.current.removeEventListener('pointermove', handlePointerMove);
        mainContainer.current.removeEventListener('pointerup', endDrag);
        mainContainer.current.removeEventListener('pointercancel', endDrag);
      }
    };
  }, [store]);

  // touch-none = `touch-action: none`: tell the browser up front NOT to treat touch
  // as native scroll/zoom on this container. Without it a phone starts the scroll on
  // the compositor and ignores our touchmove preventDefault, so the page scrolls
  // natively and the accumulator never sees the gesture. With it, every touch is
  // delivered to our handler and drives the animation instead. (overscroll-none also
  // kills pull-to-refresh.) Wheel/desktop is unaffected — touch-action is touch-only.
  return (
    <div
      ref={mainContainer}
      className="relative flex flex-col bg-black w-full max-h-[100svh] overflow-y-scroll no-scrollbar touch-none overscroll-none"
    >
      <ScrollStateProvider store={store}>
        {children}
      </ScrollStateProvider>
    </div>
  );
}
