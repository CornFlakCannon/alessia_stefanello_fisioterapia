'use client';

import { useCallback } from "react";
import { sectionScrollTop, smoothLerp, useScrollStore, type ScrollStore } from "../_scroll";
import { driveTo } from "./driveTo";
import { stopsIn } from "./useStops";

/**
 * "Scroll to section N" — the site-side workaround for the engine seam documented in
 * JUMP_TO_FEATURE.md (§1: there is no public jump API, and `app/_scroll` is off limits).
 * Used by the hero's index (forward) and by `BackToTop` (backward, to the hero).
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
 * exact same input it sees from a real wheel. The feeding lives in `./driveTo`, shared
 * with `StepScroller`, and runs as fast as the engine takes input: nothing on the way is
 * seen (below), so there is nothing to pace for.
 *
 * ## Where it lands
 * On one of the target panel's STOPS (`useStops.ts`), the `stop`-th one counted from 1 —
 * or, with `stop` 0, at the panel's very top, which is how `BackToTop` gets the hero back
 * as it was at load. (0 only means that on the hero: a `snap` panel at 0 has not slid in
 * yet.) It used to be a number of units (1350 for the services), and on a page that moves
 * in blocks that lands between two of them: past a photo in one panel, halfway through a
 * dissolve in the next. Landing on a stop leaves the page exactly as N gestures would.
 *
 * ## The page slides straight there — the panels in between are taken out
 * Driving alone plays every panel on the way: the visitor watched the whole site scroll
 * past. Instead, for the length of the trip the panels between the two are COLLAPSED to
 * zero height. The engine reads each panel's `offsetTop` every frame to decide where to
 * glide, so with nothing in between the two panels are neighbours, and the page slides
 * from one to the other directly. The panels in between are still driven through (their
 * state stays consistent), just with no height to be seen in.
 *
 * ## The one rule: whatever is on screen stays where it is
 * Collapsing and restoring panels moves everything after them by their height, `D`. The
 * engine glides from a float of its own that it never reads back from the DOM, so after
 * such a move it would set off on a `D`-long glide to catch up — visibly. So whenever a
 * layout change moves what is on screen, the hook takes `scrollTop` over: it runs a copy
 * of the engine's glide (rebuilt from what it exports, `sectionScrollTop` and
 * `smoothLerp`, plus its constants) started `D` away so the view does not move, and
 * writes it after the engine has written its own. Same targets, same easing — whatever
 * the visitor does meanwhile plays normally — until the engine's own value lands on the
 * same target, and then it lets go.
 *
 * - **Forward** (the index): the panels collapse BELOW the view, nothing on screen moves,
 *   and the engine slides by itself. They are restored ABOVE the view on arrival — that
 *   one needs the take-over.
 * - **Backward** (`BackToTop`): they collapse ABOVE the view, so the take-over starts at
 *   the click. While the drive is on, its target is the destination's top: the engine
 *   itself would only head there once the drive had wound back through every panel in
 *   between, i.e. after the whole trip. They are restored BELOW the view — free.
 * - **When to restore**: only once the drive is over and everything on screen is on one
 *   side of the collapsed panels. With one panel from each side on screen, restoring
 *   would swap the one above.
 *
 * Why a float of our own and not "the engine's value + an offset": that value comes back
 * from the DOM rounded to the pixel, and adding a decaying offset to it wobbled the view
 * by a pixel at the tail.
 *
 * "After the engine has written" is a microtask queued from its frame broadcast:
 * `ScrollShell` calls `notify()` and then writes `scrollTop` in the same rAF callback,
 * and microtasks run between rAF callbacks — so it lands after that write and before the
 * paint. Scroll anchoring is off for the trip, or the browser would ALSO shift the view
 * when panels above it grow back.
 *
 * ## One trip per page
 * The trip is kept per STORE, not per hook: the index and the button each call this
 * hook, and two trips collapsing and writing `scrollTop` at once would fight. A new trip
 * takes the old one over — puts its panels back and collapses its own in one layout
 * change, holding the view in place like any other — so a click is never ignored.
 *
 * Gestures are ignored while a trip's drive is in flight (`StepScroller` checks
 * `isDriving`): stopping it halfway would leave the engine inside a collapsed panel.
 *
 * When the engine ships `useScrollNav().jumpTo()`, this file's body is the only thing
 * that changes; callers keep calling `jumpTo(index, el)`.
 */

/** Feed pace for the trip: as fast as the engine takes input (driveTo caps a frame at
 *  200). Nothing on the way is visible; it only decides how soon the destination's own
 *  reveals play — about half a second for the farthest one at 60fps. */
const TRAVEL_UNITS_PER_SECOND = 1e6;
/** `ScrollShell`'s glide, mirrored for the take-over: its `SCROLL_HALF_LIFE`, the 64ms
 *  cap on a frame's dt, and the last half pixel it snaps. If those change, change these. */
const glide = smoothLerp(200);
const MAX_DT = 64;
const SNAP_PX = 0.5;

type Trip = {
  container: HTMLElement;
  /** The shell's panels, in index order (the overlays are portaled out of it). */
  panels: HTMLElement[];
  /** The collapsed panels, as an index range; null once they are back. */
  gap: { lo: number; hi: number } | null;
  /** What the page shows while we hold `scrollTop`; null while the engine's value is. */
  view: number | null;
  dest: HTMLElement;
  driving: boolean;
  /** Bumped per drive, so a superseded drive's `onDone` cannot end the new one. */
  drive: number;
  lastTime: number;
  end: () => void;
};

const TRIPS = new WeakMap<ScrollStore, Trip>();

/** The shell's scroll container: the nearest ancestor that scrolls. */
function scrollContainerOf(el: Element): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if (o === "scroll" || o === "auto") return p;
  }
  return null;
}

function setGap(trip: Trip, gap: Trip["gap"]) {
  trip.panels.forEach((el, i) => {
    const out = gap !== null && i >= gap.lo && i <= gap.hi;
    Object.assign(el.style, out ? { height: "0px", minHeight: "0px", overflow: "hidden" } : { height: "", minHeight: "", overflow: "" });
  });
  trip.gap = gap;
}

/** Change the collapsed range, keeping panel `anchor` — which is on screen — where it is
 *  on screen. Returns how far the layout moved it. */
function moveGap(trip: Trip, gap: Trip["gap"], anchor: number): number {
  const before = trip.panels[anchor].offsetTop;
  setGap(trip, gap);
  return trip.panels[anchor].offsetTop - before;
}

/** Where the page is heading this frame: the engine's own goal, clamped as it clamps it —
 *  except during a drive, when it is the destination (see «Backward»). */
function goalOf(store: ScrollStore, trip: Trip): number | null {
  const want = trip.driving ? trip.dest.offsetTop : sectionScrollTop(store, store.state.sectionIndex);
  if (want === null) return null;
  const { container } = trip;
  return Math.max(0, Math.min(want, container.scrollHeight - container.clientHeight));
}

/** Runs once per engine frame, right after the engine has written `scrollTop`. */
function afterEngineFrame(store: ScrollStore, trip: Trip) {
  const { container, panels } = trip;
  const s = container.scrollTop; // the engine's value for this frame
  const now = store.state.time;
  const dt = trip.lastTime ? Math.min(MAX_DT, now - trip.lastTime) : 0;
  trip.lastTime = now;

  if (trip.view !== null) {
    const goal = goalOf(store, trip);
    if (goal === null) return trip.end();
    trip.view = glide(trip.view, goal, dt);
    if (Math.abs(goal - trip.view) < SNAP_PX) trip.view = goal;
  }

  // Put the panels back once the drive is over and what is on screen sits on one side.
  const gap = trip.gap;
  if (gap && !trip.driving) {
    const y = trip.view ?? s;
    const top = y + 0.5;
    const bottom = y + container.clientHeight - 0.5;
    const seen = panels.flatMap((el, i) =>
      (i < gap.lo || i > gap.hi) && el.offsetTop < bottom && el.offsetTop + el.offsetHeight > top ? [i] : [],
    );
    if (seen.length && (seen.every((i) => i < gap.lo) || seen.every((i) => i > gap.hi))) {
      const d = moveGap(trip, null, seen[0]);
      if (d !== 0 || trip.view !== null) trip.view = y + d;
    }
  }

  if (trip.view !== null) {
    // The engine snaps exactly onto its goal too, so once both are there the value it
    // wrote is the one we would: let go.
    const goal = goalOf(store, trip);
    if (trip.view === goal && s === goal) trip.view = null;
    else container.scrollTop = trip.view;
  }

  if (!trip.gap && trip.view === null && !trip.driving) trip.end();
}

export default function useSectionJump(): {
  jumpTo: (target: number, from: Element, stop?: number) => void;
} {
  const store = useScrollStore();

  const jumpTo = useCallback(
    (target: number, from: Element, stop = 1) => {
      const origin = store.state.sectionIndex;
      if (origin === target) return;
      // Past the panel's last stop, its last stop; `stop` 0, or a panel with none, its top.
      const stops = stopsIn(store, target);
      const pos = stops[Math.min(stop, stops.length) - 1] ?? 0;

      const container = scrollContainerOf(from);
      const panels = container ? (Array.from(container.children) as HTMLElement[]) : [];
      if (!container || !panels[target]) {
        // A DOM this does not recognise: just drive, and let the way show.
        driveTo(store, from, { index: target, pos }, TRAVEL_UNITS_PER_SECOND);
        return;
      }

      let trip = TRIPS.get(store);
      if (!trip) {
        const created: Trip = {
          container,
          panels,
          gap: null,
          view: null,
          dest: panels[target],
          driving: false,
          drive: 0,
          lastTime: 0,
          end: () => {},
        };
        const unsubscribe = store.onFrame(() => queueMicrotask(() => afterEngineFrame(store, created)));
        created.end = () => {
          unsubscribe();
          setGap(created, null);
          container.style.overflowAnchor = "";
          TRIPS.delete(store);
        };
        container.style.overflowAnchor = "none";
        TRIPS.set(store, created);
        trip = created;
      }

      // Collapse what lies between, holding the panel we are on where it is on screen.
      const lo = Math.min(origin, target) + 1;
      const hi = Math.max(origin, target) - 1;
      const y = trip.view ?? container.scrollTop;
      const d = moveGap(trip, lo <= hi ? { lo, hi } : null, origin);
      if (d !== 0 || trip.view !== null) {
        trip.view = y + d;
        container.scrollTop = trip.view;
      }

      const t = trip;
      const id = ++t.drive;
      t.dest = panels[target];
      t.driving = true;
      driveTo(store, from, { index: target, pos }, TRAVEL_UNITS_PER_SECOND, () => {
        if (t.drive === id) t.driving = false;
      });
    },
    [store],
  );

  return { jumpTo };
}
