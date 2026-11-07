'use client';

import { useState } from "react";
import { useScrollFrame } from "../_scroll";
import useSectionJump from "./useSectionJump";

/**
 * "Torna su": back to the hero from anywhere, by the same trip as the hero's index — the
 * page slides straight to the top, the panels in between taken out (`useSectionJump`).
 * It lands at the hero's very top (`stop` 0), i.e. the page as it was at load: on a phone
 * the gold card comes back down too.
 *
 * ## Why it is mounted inside the hero's <Section> and not portaled
 * The jump drives the engine with synthetic wheel events dispatched ON the clicked
 * element, and they only reach the shell if they bubble up through its container — the
 * same reason `StepScroller` renders its anchor in there. `fixed` takes it out of the
 * flow and out of the scroll, so it sits in the corner of every panel all the same
 * (no ancestor up to the container has a transform, which would trap it). The hero is
 * never one of the panels a trip collapses, so it is never caught in one either.
 *
 * Hidden on the hero itself, where it has nothing to do: `invisible` and not just
 * transparent, so it also leaves the tab order and the a11y tree. It looks like the
 * contact badge in the opposite corner — the same white pill, the same chevron.
 */
export default function BackToTop() {
  const { jumpTo } = useSectionJump();
  const [shown, setShown] = useState(false);

  useScrollFrame(({ sectionIndex }) => {
    const next = sectionIndex > 0;
    if (next !== shown) setShown(next);
  });

  return (
    <button
      type="button"
      onClick={(e) => jumpTo(0, e.currentTarget, 0)}
      aria-label="Torna all'inizio"
      className={`fixed bottom-4 right-4 z-[9997] flex size-11 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg shadow-primary/10 ring-1 ring-ink/10 backdrop-blur-md transition-[opacity,translate,visibility,background-color] duration-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${
        shown ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"
      }`}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m3.5 10 4.5-4.5 4.5 4.5" />
      </svg>
    </button>
  );
}
