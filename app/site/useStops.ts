'use client';

import { useEffect } from "react";
import { useScrollStore, useSection, type ScrollStore } from "../_scroll";
import type { Target } from "./driveTo";

/**
 * The page's **stops**: the points where a block of content has finished playing and
 * the stepped scroll (`StepScroller`) comes to rest. One gesture = from here to the next
 * one.
 *
 * A stop is declared where its content is authored, in that `<Section>`'s own scroll
 * units — `useStop(at)` reads the enclosing section's index and offset, exactly as an
 * `SDiv` reads its window. So `page.tsx` writes `<Stop at={…}/>` next to the reveals it
 * waits for, and `CvSheets`, which alone knows how many sheets it deals on this
 * viewport, registers one per sheet itself.
 *
 * A stop must sit BELOW its section's hand-off threshold: at or past it, the next step
 * forward would already be in the following panel.
 */

const REGISTRY = new WeakMap<ScrollStore, Map<symbol, Target>>();

function registry(store: ScrollStore): Map<symbol, Target> {
  let m = REGISTRY.get(store);
  if (!m) REGISTRY.set(store, (m = new Map()));
  return m;
}

/** Register a stop `at` units into the enclosing section, for as long as the caller is
 *  mounted with that value. */
export function useStop(at: number): void {
  const store = useScrollStore();
  const { index, offset } = useSection();
  const pos = offset + at;
  useEffect(() => {
    const key = Symbol();
    const stops = registry(store);
    stops.set(key, { index, pos });
    return () => {
      stops.delete(key);
    };
  }, [store, index, pos]);
}

/** `useStop` as markup, for declaring stops inline in a `<Section>`. Renders nothing. */
export function Stop({ at }: { at: number }) {
  useStop(at);
  return null;
}

/** Order two points on the page: section first, then position inside it. */
function compare(a: Target, b: Target): number {
  return a.index - b.index || a.pos - b.pos;
}

/** Positions this close count as the same place (the engine integrates floats, and a
 *  drive lands within a unit or so). */
const SAME = 20;

/**
 * The stop to go to from `here`, one gesture in direction `dir`. Forward past the last
 * stop there is nowhere to go (`null`); backward past the first, the top of the page.
 */
export function nextStop(store: ScrollStore, here: Target, dir: 1 | -1): Target | null {
  const stops = [...registry(store).values()].sort(compare);
  if (dir > 0) {
    return stops.find((s) => s.index > here.index || (s.index === here.index && s.pos > here.pos + SAME)) ?? null;
  }
  const before = stops.filter((s) => s.index < here.index || (s.index === here.index && s.pos < here.pos - SAME));
  return before.at(-1) ?? (compare(here, { index: 0, pos: 0 }) > 0 ? { index: 0, pos: 0 } : null);
}
