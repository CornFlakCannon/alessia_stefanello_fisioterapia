# Proposed engine feature — `jumpTo(section)` (imperative scroll-to)

> Status: **not applied to this repo's `app/_scroll`.** This is a spec + ready-to-paste
> patch so it can land in the scroll library's canonical repo and flow back here.
> Nothing in `app/_scroll` or `app/ScrollShell.tsx` has been modified for it.

## Why

The engine advances **one section at a time** from accumulated wheel/touch delta
(`advanceSection` in `sections.ts`, driven by `ScrollShell`). There is no public
"go to section N". Any UI affordance that should *scroll to* a specific panel — a
"Contattami" CTA, a section menu, a "back to top" — currently has no supported hook.

`jumpTo` adds exactly that, in the engine's existing idiom (a per-store
`WeakMap` request bus, like the section registry), leaving one-directional ownership
intact: **widgets request, the core applies.** No widget ever writes scroll state.

## Design

- A new `nav.ts` module holds a per-`ScrollStore` "pending jump" slot and a
  `useScrollNav()` hook returning `jumpTo(index)`.
- The core (`ScrollShell`) reads-and-clears the slot once per rAF tick and **lands
  every panel** around the target:
  - sections **before** the target → their `pos` set to `max` ("fully scrolled"),
  - the **target** → `pos` set to its snap span, so `sectionScrollTop` reports the
    target's own panel (`t = 1`, i.e. flush),
  - sections **after** the target → `pos` set to `0`.
  Then the existing glide eases `container.scrollTop` to that panel — a smooth,
  reversible "scroll-to" that reuses all the existing easing/continuity machinery.
- Two tiny read/write helpers are exported so the core can enumerate sections and
  set positions: `sectionIndices`, `snapDurationOf`, `setIndexPos`.

Usage from any widget under `<ScrollShell>` (portaled overlays qualify — context
flows through portals, same as `DevHud`):

```tsx
import { useScrollNav } from "@/app/_scroll";
const { jumpTo } = useScrollNav();
<button onClick={() => jumpTo(CONTACT_INDEX)}>Contattami</button>
```

---

## Patch

### 1. New file — `app/_scroll/nav.ts`

```ts
'use client';

import { useScrollStore } from './context';
import type { ScrollStore } from './store';

/**
 * Imperative "scroll to a section" bus.
 *
 * The engine advances one section at a time from accumulated wheel/touch delta —
 * there is no way to *jump*. A UI affordance ("Contattami", a section menu) needs
 * exactly that, so this is a tiny per-store request channel in the same style as the
 * section registry (`sections.ts`): a widget calls `requestJump(store, index)` (via
 * the `useScrollNav` hook), and the core (`ScrollShell`) consumes it once per frame
 * with `consumeJump(store)` and lands on that panel (see the loop there).
 *
 * It's a request, not a direct write, because only the core owns the scroll state:
 * keeping the hand-off one-directional (widget requests → core applies) matches how
 * the rest of the system already works (widgets never mutate the store's scroll).
 */
const PENDING = new WeakMap<ScrollStore, number | null>();

/** Ask the core to land on section `index` on the next frame. */
export function requestJump(store: ScrollStore, index: number): void {
  PENDING.set(store, index);
}

/** Read-and-clear the pending jump target (null when none). The core calls this
 *  once per rAF tick; clearing on read makes a jump a single-shot event. */
export function consumeJump(store: ScrollStore): number | null {
  const target = PENDING.get(store) ?? null;
  if (target !== null) PENDING.set(store, null);
  return target;
}

/**
 * Widget-side handle: `jumpTo(index)` smooth-scrolls to that top-level section.
 * Must be used under a `<ScrollStateProvider>` (i.e. inside `<ScrollShell>`), the
 * same as every other scroll hook — a portaled overlay still qualifies, since React
 * context flows through portals.
 */
export function useScrollNav(): { jumpTo: (index: number) => void } {
  const store = useScrollStore();
  return { jumpTo: (index: number) => requestJump(store, index) };
}
```

### 2. `app/_scroll/sections.ts` — add two accessors

Add near `sectionScrollTop` (both read the existing `registry(store)`):

```ts
/** Every registered (top-level, advancing) section index, ascending. The core
 *  walks these to land positions across all panels for an imperative jump. */
export function sectionIndices(store: ScrollStore): number[] {
  return [...registry(store).keys()].sort((a, b) => a - b);
}

/** A section's snap-glide span in its index-pos space (0 = not a snap panel).
 *  A jump lands the target at this position so `sectionScrollTop` reports its own
 *  panel (t = 1), i.e. flush. */
export function snapDurationOf(store: ScrollStore, index: number): number {
  return registry(store).get(index)?.snapDuration ?? 0;
}
```

### 3. `app/_scroll/useSequenceProgress.ts` — add a position setter

Add next to `growIndexCeiling` (reuses the existing `getIndexScroll`):

```ts
/** Force an index's integrated scroll position, clamped to its current ceiling.
 *  An imperative override the core uses to land every panel when jumping to a
 *  section: pass `Infinity` for "scrolled to the end", `0` for "not yet reached".
 *  Ordinary per-frame integration is untouched. */
export function setIndexPos(store: ScrollStore, index: number, pos: number): void {
  const sh = getIndexScroll(store, index);
  sh.pos = Math.min(sh.max, Math.max(0, pos));
}
```

### 4. `app/_scroll/index.ts` — re-export

```ts
export { useSequenceProgress, integrateIndexPos, setIndexPos } from './useSequenceProgress';
export { Section, advanceSection, sectionScrollTop, sectionIndices, snapDurationOf } from './sections';
export { requestJump, consumeJump, useScrollNav } from './nav';
```

### 5. `app/ScrollShell.tsx` — consume the jump in the rAF loop

Add the imports:

```ts
import {
  advanceSection, consumeJump, createScrollStore, integrateIndexPos,
  ScrollStateProvider, sectionIndices, sectionScrollTop, setIndexPos,
  smoothLerp, snapDurationOf,
} from "./_scroll";
```

Change `const delta = …` to `let delta = …`, then, immediately after resetting
`scrollAccumulator.current`, before `advanceSection`:

```ts
// Imperative jump ("Contattami" / a section menu — see _scroll/nav.ts). Land
// every panel around the target: sections before it are fully scrolled (pos = ∞ →
// clamped to their max), the target sits flush (pos = its snap span → the glide
// reports its own panel), sections after it are reset to 0. Drop this frame's delta
// so the fresh position isn't immediately re-advanced; the glide below then eases
// scrollTop to the target panel — a smooth, reversible "scroll-to".
const jump = consumeJump(store);
if (jump !== null) {
  for (const i of sectionIndices(store)) {
    setIndexPos(store, i, i < jump ? Infinity : i === jump ? snapDurationOf(store, jump) : 0);
  }
  currentSectionIndex.current = jump;
  delta = 0;
}
```

That's the whole feature. It composes with `snap`, works up and down, and needs no
change to `SDiv`/`SMask`/`anim.ts`.

---

## Appendix — related seam: touch drags commit before they're understood

Same category of problem (the engine needs to expose a hook the site can't otherwise
reach), surfaced by the contact **form** on panel 5.

### The seam

`handlePointerDown` sets `dragging = true` and calls `setPointerCapture` on the **first**
`pointerdown` — the instant the finger lands, before any travel has happened. At that
moment a touch on a form field is genuinely ambiguous: it could be a tap that should focus
the field, or the first pixel of a swipe that should scroll the page. The engine commits to
"scroll" immediately, and site code gets no say.

The tempting workaround is the trap. If the site `stopPropagation`s the `pointerdown`
whenever it lands on a control (to protect taps), the swipe that starts there reaches
**nothing**: not the shell (no drag ever starts, so every `pointermove` early-returns on
`!dragging`), and not the browser either (`touch-action: none` on the container is
inherited by every control). Meanwhile `stopPropagation` doesn't stop the browser's *own*
touch defaults on that control — caret placement, selection drag + magnifier, focus and its
scroll-into-view. That last one writes `container.scrollTop`, which the rAF loop overwrites
the next frame. The result is a panel that won't scroll and visibly jitters. This repo
shipped that bug and removed it.

### What the site does now (no engine change required)

`ContactForm`'s `useTapVsSwipe` resolves the ambiguity **after the fact** instead of at
`pointerdown`: it never blocks the pointerdown (so the shell drags and the page scrolls
exactly as it does anywhere else), and on `pointerup` — only if the finger never travelled
past an 8px slop — it focuses the tapped field with `focus({ preventScroll: true })`.
Note it must listen on `window`, since `setPointerCapture` retargets every later event for
that pointer to the container.

### The library-side version

Give the engine the same deferral, once, for everything inside it:

```ts
const SLOP = 8; // px of travel before a touch is committed to being a scroll

const handlePointerDown = (e: PointerEvent) => {
  if (e.pointerType === "mouse") return;
  pending = { id: e.pointerId, y: e.clientY };   // armed, NOT yet dragging
  // no setPointerCapture here — the gesture hasn't earned it
};

const handlePointerMove = (e: PointerEvent) => {
  if (pending && Math.abs(e.clientY - pending.y) > SLOP) {
    dragging = true;                              // now it's a scroll
    lastPointerY = pending.y;                     // measure from the touch-down point
    mainContainer.current?.setPointerCapture(e.pointerId);
    pending = null;
  }
  if (!dragging) return;
  /* …existing accumulate… */
};
```

A touch that lifts before `SLOP` never becomes a drag, never captures the pointer, and is
left entirely to the browser — so buttons, links and inputs behave natively everywhere,
with no per-component hook. A `[data-native]` attribute opt-out (skip the handlers for
anything under `e.target.closest("[data-native]")`) is still worth having for genuinely
scrollable inner regions, but it solves a *different* problem from this one and is not a
substitute. `ContactForm` already carries the `data-native` marker for that day.

If the slop deferral lands, delete `useTapVsSwipe` from `ContactForm.tsx`.

---

## Seam 3 — `setPointerCapture` throws on a short tap (APPLIED here, as a guard)

> Status: **the only edit this repo makes to `app/ScrollShell.tsx`.** It is a guard, not
> the fix; the fix is the slop deferral above.

`handlePointerDown` captures the pointer unconditionally:

```ts
mainContainer.current?.setPointerCapture(e.pointerId);
```

Per spec, `setPointerCapture` throws `NotFoundError` when `pointerId` matches no **active**
pointer. A touch that is released before the handler runs — a quick tap, which is exactly
what the hero's section index invites — leaves nothing to capture, and the throw surfaces
as an uncaught console error on a perfectly ordinary interaction:

```
Uncaught NotFoundError: Element.setPointerCapture: Invalid pointer id
    at handlePointerDown (app/ScrollShell.tsx:116)
```

Two things make this safe to simply guard rather than restructure:

- capture is an **optimisation** here. The container already sets `touch-action: none` and
  owns the `pointermove`/`pointerup` listeners, so a drag works uncaptured; capture only
  matters if the finger leaves the container mid-gesture.
- a non-primary pointer (a second finger landing on the panel) should never restart the
  drag anyway, and `e.isPrimary` is the documented way to say so.

Applied:

```ts
const handlePointerDown = (e: PointerEvent) => {
  if (e.pointerType === "mouse") return;
  if (!e.isPrimary) return;
  dragging = true;
  lastPointerY = e.clientY;
  try { mainContainer.current?.setPointerCapture(e.pointerId); } catch {}
};
```

**The slop deferral above supersedes this.** Capturing on the first committed move means
the pointer is provably active at capture time, so the throw cannot happen and the guard
becomes redundant — delete it if that patch lands.

---

## Seam 4 — a panel's animations are abandoned mid-flight at the hand-off (APPLIED here)

> Status: **the second edit this repo makes to the engine** — `app/ScrollShell.tsx` and
> `app/_scroll/useSequenceProgress.ts`, plus one additive line in `app/_scroll/index.ts`
> (re-export `readIndexPos`, so the DevHud can show the engine's real per-section position
> instead of a mirror that disagreed with it). Unlike seam 3 this is the fix, not a guard:
> there is no site-side version of it, because the freeze happens inside the widget hook.

Scroll fast, then scroll back up: the panels you flew past are sitting in half-played
poses that never complete. Three separate mechanisms produce it, and they need three
separate answers.

### 1. The hand-off is decided on a different quantity than the one that is drawn

`useSequenceProgress` derives `target` from the raw integrated position, then eases a
`displayed` value toward it with `defaultSmoother = smoothLerp(90)`. What reaches the
element is `displayed` — **`onProgress` never receives `target`**:

```ts
let next = defaultSmoother(displayed.current, target, dt);
if (Math.abs(target - next) < 1e-4) next = target;
displayed.current = next;
onProgress(next, s);
```

`advanceSection`, meanwhile, tests the **raw** position:

```ts
if (threshold > 0 && readIndexPos(store, current) >= threshold && hasSection(store, current + 1)) {
```

A 90ms half-life needs ~390ms to close 95% of a gap. At speed the two quantities are
nowhere near each other, so the page is free to leave a panel whose poses are still 50-60%
behind.

### 2. Leaving a section freezes the pose *permanently*

```ts
if (!raw && s.sectionIndex !== idx) return;
```

That short-circuits before `displayed` is eased and before `lastTime` is updated. The last
inline style written stays on the element for good — **there is no "settle on deactivate"
step anywhere in the engine.** This is the artefact the user actually sees.

### 3. Nothing bounds a frame's scroll delta

The `±100` clamps are per EVENT; the frame drain is unconditional. Several wheel or
pointer events land per frame, and touch is multiplied by `TOUCH_SENSITIVITY` *after* its
clamp, so a fling frame carries 300-700 units — a 2200-unit panel crossed in ~7 frames
(~105ms). And `integrateIndexPos(store, active, …)` is called with the **post**-advance
index, so the hand-off frame's delta is spent a second time on the incoming panel, which
therefore arrives with its `snap` glide part-resolved and its first reveals already past.

### The tempting workaround is the trap

The obvious site-side answer is "give each panel more dwell, so its windows finish well
before the threshold". Measured, that is not a fix. Simulating the real smoother against a
real panel (`rev(0..3)`, a focus landing at 1300, three cross-fading photos over 320→2050,
hand-off at 2200), the worst residual gap at the hand-off is:

| frame cap | ms to cross the panel | `rev0` displayed | worst gap |
|---|---|---|---|
| 350 (unbounded, today) | 105ms | 0.54 | 0.74 |
| 200 | 183ms | 0.68 | 0.49 |
| 150 | 244ms | 0.79 | 0.51 |
| 40 (unusably slow) | 917ms | 1.00 | **0.25** |

**Rate-limiting alone never finishes an animation**, at any speed a person would accept:
the smoother is chasing a *moving* target, so its lag is proportional to scroll speed and
a residual gap survives however much dwell or however low a cap you choose. Dwell only
buys frames, and at fling speed the existing `DWELL = 500` is worth one or two of them.

The animation has to be *finished*, not *outrun*. That is mechanism 2's answer, and it is
the only one that is a guarantee rather than a tuning.

### Applied — 1. `app/_scroll/useSequenceProgress.ts`, ease to rest off-section

A widget leaving its section may not simply stop; it must settle first, then go quiet. A
`settled` ref (initialised `true`, so an unvisited section costs nothing) gates it:

```ts
const settled = useRef(true);

useScrollFrame((s) => {
  const onSection = raw || s.sectionIndex === idx;
  if (!onSection && (settled.current || loop?.by === "auto")) return;
```

with `settled.current = next === target;` recorded after the existing `1e-4` snap, in both
the loop branch and the ordinary one.

Two constraints shape it:

- **An `auto` loop is excluded.** `LoopSpec` documents it as pausing off-section and
  resuming on return; letting it tick off-section would break that contract.
- **Off-section must READ the position, never integrate it.** `sharedScroll` folds
  `s.accumulator` into its index under a per-frame time guard, so an inactive section
  calling it would integrate the frame's delta — and with every panel doing so, the whole
  page would advance at once. Hence a small helper:

```ts
function readPos(store, index, end, onSection, s) {
  return onSection ? sharedScroll(store, index, end, s) : readIndexPos(store, index);
}
```

Off-section the index's position is frozen, so `target` is constant, the ease converges in
~400ms and stops. Cost: one panel's widgets ticking for a beat after you leave it.

**It also removes a pop nobody had named.** `lastTime` used to go stale while a section was
away, so the first frame back ran with `dt` clamped to 64ms and jumped ~39% of the gap in
one frame. A widget that settled before going quiet has no gap left to jump.

### Applied — 2. `app/ScrollShell.tsx`, bound the frame and carry the remainder

```ts
const MAX_FRAME_DELTA = 200;
const MAX_CARRY = MAX_FRAME_DELTA * 3;
...
const pending = Math.max(-MAX_CARRY, Math.min(MAX_CARRY, scrollAccumulator.current));
const delta = Math.max(-MAX_FRAME_DELTA, Math.min(MAX_FRAME_DELTA, pending));
scrollAccumulator.current = pending - delta;
```

The excess is **carried, not discarded**, so no unit of the gesture is lost — it is spread
over the following frames, and the queue is capped at three of them so the page cannot
coast on after the finger stops. Reversing direction cancels the queue naturally, since
new input of the opposite sign sums against what is pending.

`200` is drawn above a normal swipe (~105-175 units/frame at `TOUCH_SENSITIVITY = 3.5`)
and below a fling, so ordinary scrolling never meets the clamp. Per the table above this
does not *finish* anything — that is the settle's job. It decides how much of a panel you
SEE play on the way past.

### Applied — 3. `app/ScrollShell.tsx`, don't spend the hand-off frame twice

```ts
const previous = currentSectionIndex.current;
const active = advanceSection(store, previous, delta);
currentSectionIndex.current = active;
integrateIndexPos(store, active, { time, accumulator: active === previous ? delta : 0 });
```

On a hand-off frame the delta has already done its job — it is what pushed the outgoing
panel over its threshold — so spending it again on the incoming one is a double count. One
zero frame (and the rest is still queued) is imperceptible and guarantees every panel
starts its entrance from 0. `store.notify` still broadcasts the true `delta`, so the global
counter a `rawAnim` reads is untouched.

### For the library's own repo

Parts 1 and 3 are unconditional bug fixes and should land as-is. Part 2 introduces two
constants that belong next to `TOUCH_SENSITIVITY` as documented knobs — a library might
prefer to expose them as props on `ScrollShell` rather than module constants, since the
right cap depends on how long the host's panels are.

One knock-on to note for a consumer: a site that drives the engine by dispatching
synthetic wheel events (this one does — `app/site/useSectionJump.ts`) is subject to the
same cap. `UNITS_PER_FRAME = 70` is well under it; `REDUCED_UNITS_PER_FRAME` was 400 and
is now 200 — the cap is also a correctness bound for any driver that MEASURES where the
page is each frame (`app/site/driveTo.ts`, on the `variante/scroll-a-blocchi` branch):
units the shell queues for later are units such a driver will feed a second time.


## Seam 5 — a stepped ("a blocchi") scroll mode (site-side on `variante/scroll-a-blocchi`)

The engine only knows continuous scroll: every unit of input becomes progress. The variant
branch wants the page to move in **blocks** — one gesture plays the next block by itself
and stops — and builds it outside the engine, like the jump:

- `app/site/useStops.ts` — a registry of stops, `(section, position)`, declared with
  `<Stop at>` / `useStop(at)` in the section's own units (via the public `useSection()`).
- `app/site/driveTo.ts` — the jump's feed loop, generalised: drive to a `(section,
  position)` by dispatching synthetic wheel events, one drive in flight per store.
- `app/site/StepScroller.tsx` — takes TRUSTED wheel and pointermove events away from the
  shell (window, capture phase, `stopPropagation`) and turns one gesture into one drive.

### What it costs, and what the library version would remove
The shell's own input handling is bypassed rather than configured, which is why the site
has to know the shell's per-event clamp (±100) and per-frame cap (200) — both copied into
`driveTo`. A library version would put it where the input already arrives:

```tsx
<ScrollShell mode="step" stops={…} stepPace={30} quietMs={220} swipePx={30}>
```

— in the rAF loop, replace "accumulate and consume" with "on a new gesture, set a target
stop and feed toward it at `stepPace`", using the same `advanceSection`/`integrateIndexPos`
path so hand-offs, snap glides and the global counter behave exactly as they do now. Stops
could keep the site's shape (registered from inside sections) or be derived from `Section`
props (`<Section stops={[860, 2050]}>`). With that in the engine, `driveTo` shrinks back to
the `jumpTo` of the main proposal and `StepScroller` disappears.
