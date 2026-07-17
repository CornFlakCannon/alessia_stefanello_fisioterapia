'use client';

import { createElement, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { SectionContext, useSection, useScrollStore } from './context';
import type { ScrollStore } from './store';
import { growIndexCeiling, readIndexMax, readIndexPos, type SequenceSpec } from './useSequenceProgress';

/**
 * Sections replace the old dormant "widget index": a run of animations grouped
 * under one gating index that the scroll advances through, one at a time.
 *
 * A top-level `<Section index={n} start end budget>` owns index `n` and a hand-off
 * threshold. While it is active it integrates its own scroll position (0-based,
 * isolated per index — see `useSequenceProgress`); once that position reaches the
 * threshold and the user is still scrolling forward, the active index advances to
 * `n+1`; once it is back at the bottom and scrolling back, it returns to `n-1`.
 *
 * A nested `<Section>` is coordinate-only: it inherits the enclosing index and
 * simply subtracts its own `start` from the scroll origin its descendants see, so
 * `start`/`end` inside it compose locally. Only top-level sections advance.
 */

/**
 * Registry of advancing (top-level) sections per store: index → its threshold, the
 * scroll position (in that index's space) at which it hands off. A `null` threshold
 * means "fall back to the furthest child end", discovered at runtime.
 */
type SectionInfo = {
  /** Hand-off position in index-pos space; null = fall back to the furthest child end. */
  threshold: number | null;
  /** Scroll span (this index's units) over which the panel glides into view;
   *  0 = not a snap panel (the scroll stays put). Widgets stagger past it via `start`. */
  snapDuration: number;
  /** The section's wrapper element — the panel the glide scrolls to. */
  el: HTMLElement | null;
};
const REGISTRY = new WeakMap<ScrollStore, Map<number, SectionInfo>>();

function registry(store: ScrollStore): Map<number, SectionInfo> {
  let m = REGISTRY.get(store);
  if (!m) REGISTRY.set(store, (m = new Map()));
  return m;
}

function registerSection(store: ScrollStore, index: number, info: SectionInfo): void {
  registry(store).set(index, info);
}

function unregisterSection(store: ScrollStore, index: number): void {
  registry(store).delete(index);
}

function hasSection(store: ScrollStore, index: number): boolean {
  return registry(store).has(index);
}

/** A section's threshold in index-pos space: its declared value, else furthest child end. */
function thresholdOf(store: ScrollStore, index: number): number {
  const declared = registry(store).get(index)?.threshold ?? null;
  return declared ?? readIndexMax(store, index);
}

/**
 * Decide the active section index for the next frame given this frame's scroll
 * `delta`. Hand off forward once the active section's position reaches its
 * threshold (and a next section exists); hand back once it is at the bottom.
 * Positions persist per index, so a section resumes where it left off. Called by
 * the core (`ScrollShell`) once per frame — see the note there.
 */
export function advanceSection(store: ScrollStore, current: number, delta: number): number {
  if (delta > 0) {
    const threshold = thresholdOf(store, current);
    if (threshold > 0 && readIndexPos(store, current) >= threshold && hasSection(store, current + 1)) {
      return current + 1;
    }
  } else if (delta < 0 && current > 0 && readIndexPos(store, current) <= 0) {
    return current - 1;
  }
  return current;
}

/** Default snap span (scroll units) when `snap` is just `true`. */
const DEFAULT_SNAP_DURATION = 600;

/**
 * The container scrollTop the active section wants right now — a CONTINUOUS target
 * (never null between panels), which is what lets ScrollShell ease scrollTop toward
 * it over time without ever stranding: the old strand was the target vanishing at a
 * hand-off, not the easing. A `snap` section (after the first) slides in from the
 * previous panel across its `snapDuration` of scroll — a linear lerp of the panel
 * top over `t = pos / snapDuration`; past that span it sits at its own panel, so
 * widgets with `start >= snapDuration` play only after it lands. Every other active
 * section just targets its own panel top. Only an unregistered section (no `el` yet)
 * yields null. Assumes the scroll container is the `offsetParent` (ScrollShell marks
 * it `relative`), so `el.offsetTop` is the scrollTop that puts a panel at the top.
 */
export function sectionScrollTop(store: ScrollStore, active: number): number | null {
  const info = registry(store).get(active);
  if (!info?.el) return null;
  const thisTop = info.el.offsetTop;
  if (info.snapDuration > 0 && active > 0) {
    const prevTop = registry(store).get(active - 1)?.el?.offsetTop ?? 0;
    const t = Math.min(1, Math.max(0, readIndexPos(store, active) / info.snapDuration));
    return prevTop + (thisTop - prevTop) * t;
  }
  return thisTop;
}

/**
 * Group scroll widgets under one advancing index (top level) or refine their
 * scroll origin (nested). Shares the `SequenceSpec` vocabulary: `start` sets the
 * local origin (subtracted for descendants), `end`/`budget` set the hand-off
 * threshold. `index` names the slot for a top-level section; nested sections
 * inherit the enclosing index and ignore their own.
 */
export function Section({
  index,
  start = 0,
  budget,
  end,
  snap = false,
  children,
}: SequenceSpec & {
  /** Make this section a panel that glides into view when it becomes active:
   *  `true` for the default span, or a number = the scroll span the glide takes.
   *  Widgets inside stagger past it with `start` (>= the span plays after it lands). */
  snap?: boolean | number;
  children?: ReactNode;
}) {
  const parent = useSection();
  const store = useScrollStore();
  const elRef = useRef<HTMLDivElement>(null);

  const isTop = parent.depth === 0;
  const gatingIndex = isTop ? (index ?? 0) : parent.index;
  const offset = parent.offset + start;

  // Threshold lives in the index's 0-based scroll space. Only top-level sections
  // advance, and their parent offset is 0, so this equals the local end. Nested
  // sections don't register, so their (unused) threshold is harmless.
  const localEnd = end ?? (budget !== undefined ? start + budget : undefined);
  const threshold = localEnd !== undefined ? parent.offset + localEnd : null;

  const snapDuration = snap === false ? 0 : typeof snap === "number" ? snap : DEFAULT_SNAP_DURATION;

  useEffect(() => {
    if (!isTop) return;
    registerSection(store, gatingIndex, { threshold, snapDuration, el: elRef.current });
    // Grow the ceiling so `pos` can reach an explicit threshold (and the snap span,
    // so the glide can complete) even if no child window extends that far.
    const ceiling = Math.max(threshold ?? 0, snapDuration);
    if (ceiling > 0) growIndexCeiling(store, gatingIndex, ceiling);
    return () => unregisterSection(store, gatingIndex);
  }, [store, isTop, gatingIndex, threshold, snapDuration]);

  const value = useMemo(
    () => ({ index: gatingIndex, offset, depth: parent.depth + 1 }),
    [gatingIndex, offset, parent.depth],
  );

  // Only a top-level section is a panel — a registered snap/scroll target that must
  // be a full-viewport box (min-h here, not a runtime class, so flex can't compress
  // it a hair under 100vh and strand the last panel's top). A nested section is
  // coordinate-only: it exists purely to shift its descendants' scroll origin, so it
  // emits NO layout box, only the context, and its children lay out exactly as if it
  // weren't there. (A min-h box here would inject a stray 100vh into the middle of an
  // absolutely-composed scene — inflating the container and dislocating the layout.)
  const provider = createElement(SectionContext.Provider, { value }, children);
  if (!isTop) return provider;
  // eslint-disable-next-line react-hooks/refs -- forwarding the ref to the DOM node, not reading it in render
  return createElement("div", { ref: elRef, className: "min-h-[100svh] shrink-0" }, provider);
}
