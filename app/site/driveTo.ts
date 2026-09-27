import { readIndexPos, type ScrollStore } from "../_scroll";

/**
 * Drive the engine to a point on the page — section `index`, integrated position `pos`
 * inside it — by feeding it synthetic wheel input, one frame at a time. The one
 * mechanism behind both `useSectionJump` (the hero's index) and `StepScroller` (this
 * branch's block-by-block scroll).
 *
 * ## Why input and not state
 * `app/_scroll` has no "go to" API and is off limits (CLAUDE.md), and writing per-index
 * positions directly would leave the engine's global scroll counter behind — see
 * `useSectionJump`'s docblock. Feeding the accumulator keeps active section, `snap`
 * glide, reveals and global counter in phase by construction: the engine sees exactly
 * what it sees from a real wheel. The only things read back are public: the per-frame
 * `store.state.sectionIndex` and `readIndexPos`.
 *
 * ## Mechanics
 * Each frame: compare where the page is to the target (section first, then position),
 * and feed at most `unitsPerFrame` toward it — never more than what is left inside the
 * target section, so it lands on the number rather than past it. `ScrollShell` clamps
 * every wheel event to ±100, so a frame's feed is split into events that size,
 * dispatched on `from` (any element inside the scroll container — wheel bubbles to the
 * shell's listener). Hand-offs cost nothing special: going forward, feeding past a
 * panel's threshold advances the engine to the next one; going back, feeding below 0
 * returns it to the previous one at the position it was left at.
 *
 * ## Pace
 * `unitsPerFrame` must stay at or under `ScrollShell`'s `MAX_FRAME_DELTA` (200). Past
 * it the shell queues the excess for later frames, while this loop measures where the
 * page IS — so it would feed the same remainder twice and overshoot the target.
 *
 * ## It always stops
 * - **Arrived**: within `ARRIVED` units of `pos` on the right section.
 * - **Overshot**: the direction it needs to feed flips. A target past its own section's
 *   threshold would otherwise ping-pong across the hand-off forever.
 * - **Stalled**: nothing moved for `STALL_FRAMES` frames — a target beyond the page's
 *   last panel, or a position above a section's ceiling.
 * - **Hard cap**: `MAX_FRAMES`, whatever happens.
 * - **Superseded**: at most ONE drive is in flight per store; starting another cancels
 *   it, so a jump and a step (or two clicks) never feed against each other.
 */

export type Target = { index: number; pos: number };

/** ScrollShell's per-event clamp; a frame's travel is split into events this size. */
const WHEEL_CLAMP = 100;
/** Close enough, in scroll units. The engine integrates floats, so exact is not a thing. */
const ARRIVED = 1;
/** Frames with no movement before a drive gives up. */
const STALL_FRAMES = 20;
/** Hard stop, in frames (~10s at 60fps) — a drive must never become a permanent loop. */
const MAX_FRAMES = 600;

/** The drive currently in flight, per store (see «Superseded»). */
const IN_FLIGHT = new WeakMap<ScrollStore, () => void>();

/** Where the page is right now, as a target would name it. */
export function currentPoint(store: ScrollStore): Target {
  const index = store.state.sectionIndex;
  return { index, pos: readIndexPos(store, index) };
}

/** Is a drive in flight on this store? */
export function isDriving(store: ScrollStore): boolean {
  return IN_FLIGHT.has(store);
}

/** Cancel the drive in flight on this store, if any. */
export function cancelDrive(store: ScrollStore): void {
  IN_FLIGHT.get(store)?.();
}

/**
 * Start driving toward `target`. Returns a cancel function; `onDone` runs once when the
 * drive ends for ANY reason (arrived, gave up, cancelled or superseded).
 */
export function driveTo(
  store: ScrollStore,
  from: Element,
  target: Target,
  unitsPerFrame: number,
  onDone?: () => void,
): () => void {
  cancelDrive(store);

  let raf = 0;
  let frames = 0;
  let still = 0;
  let dir = 0; // the direction of the first feed; a flip means we overshot
  let last = currentPoint(store);

  const stop = () => {
    cancelAnimationFrame(raf);
    if (IN_FLIGHT.get(store) === stop) IN_FLIGHT.delete(store);
    onDone?.();
    onDone = undefined; // once, even if stop is reached twice
  };

  const feed = (units: number) => {
    const n = Math.ceil(Math.abs(units) / WHEEL_CLAMP);
    const each = units / n;
    for (let i = 0; i < n; i++) {
      from.dispatchEvent(new WheelEvent("wheel", { deltaY: each, bubbles: true, cancelable: true }));
    }
  };

  const tick = () => {
    if (++frames > MAX_FRAMES) return stop();
    const now = currentPoint(store);

    still = now.index === last.index && Math.abs(now.pos - last.pos) < 0.01 ? still + 1 : 0;
    last = now;
    // Only counts once something was fed — the first frame has not moved yet by design.
    if (dir !== 0 && still > STALL_FRAMES) return stop();

    let units: number;
    if (now.index !== target.index) {
      units = Math.sign(target.index - now.index) * unitsPerFrame;
    } else {
      const left = target.pos - now.pos;
      if (Math.abs(left) < ARRIVED) return stop();
      units = Math.sign(left) * Math.min(unitsPerFrame, Math.abs(left));
    }

    const d = Math.sign(units);
    if (dir === 0) dir = d;
    else if (d !== dir) return stop();

    feed(units);
    raf = requestAnimationFrame(tick);
  };

  IN_FLIGHT.set(store, stop);
  raf = requestAnimationFrame(tick);
  return stop;
}
