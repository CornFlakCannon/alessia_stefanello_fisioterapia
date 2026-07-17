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

## Appendix — related seam: native-interaction opt-out (`[data-native]`)

Same category of problem (the engine needs to expose a hook the site can't otherwise
reach), surfaced by the contact **form**: `ScrollShell` sets `touch-action: none`,
pointer-captures touch, and `preventDefault`s the wheel — so on mobile a form region
can't be scrolled and its inputs are hard to focus.

This repo works around it **site-side** (the form region attaches its own native
`wheel`/`pointerdown` listeners that `stopPropagation` before the event bubbles to the
container, plus `touch-action: pan-y`), so **no engine change is required** to ship.
But if you'd rather formalize it in the library, the clean version is a `[data-native]`
opt-out in `ScrollShell`'s handlers:

```ts
const isNative = (e: Event) =>
  e.target instanceof Element && !!e.target.closest("[data-native]");

const handleWheel = (e: WheelEvent) => {
  if (isNative(e)) return;                 // let the inner region scroll natively
  scrollAccumulator.current += Math.max(-100, Math.min(100, e.deltaY));
  e.preventDefault();
};

const handlePointerDown = (e: PointerEvent) => {
  if (e.pointerType === "mouse") return;
  if (isNative(e)) return;                 // let inputs focus / the region pan
  /* …existing drag/capture… */
};
```

Then any element marked `data-native` (e.g. the form's scroll container) keeps native
scroll and focus. If you add this, the site's local workaround can be removed.
