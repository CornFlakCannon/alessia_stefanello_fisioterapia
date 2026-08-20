'use client';

import SDiv from "@/app/widgets/SDiv";
import { easeOutCubic } from "@/app/_scroll/easing";
import type { AnimSpec } from "@/app/widgets/anim";
import { PANEL_BOX } from "./panelBox";
import useIsDesktop from "./useIsDesktop";

/**
 * A service panel with a **"focus a destra"** — the client's own name for the device
 * (CLIENTE_TODO.md §2): the explanation on the left, a full-height coloured slab on the
 * right carrying a sub-beat of that service.
 *
 * ```tsx
 * <FocusPanel ground="bg-white" slab="bg-emphasis text-white"
 *             backdrop={<PhotoSlab … />} focus={<>…text, logo…</>}>
 *   …the text column's SDiv reveals…
 * </FocusPanel>
 * ```
 *
 * ## Desktop and phone tell it differently, on purpose
 * It used to be one story everywhere: the slab arrived from off-stage while the text slid
 * left to make room. The client asked for that arrival to stop on desktop — the slab
 * should already be there when the panel lands, wearing its photos, and it is the
 * CONTENT that comes in from the right (NUOVA_TODO.md §Muscoloscheletrica/1). On phones
 * the slide-in stays, in capitals in the same file: there the slab is full-width, so
 * "the panel splits, then the focus arrives" is the only way to tell two things in one
 * column.
 *
 * So the same window drives one of two arrangements:
 *
 * | | desktop (≥1024) | phone |
 * |---|---|---|
 * | slab | already home, static | slides in, `x: 100% → 0` |
 * | text column | laid out INSIDE the free strip | slides left by `SHIFT` |
 * | slab content | rides in from the right | static inside the sliding slab |
 * | backdrop (photos) | always visible, cycling with scroll | idem |
 *
 * The switch has to be JS (`useIsDesktop`): `SDiv` writes its pose as an inline style
 * every frame, so no `lg:` class can override it. The keyframe arrays are module
 * constants because `SDiv` memoises its compiled anim on the array's IDENTITY — inline
 * literals here would recompile every frame.
 *
 * ## On desktop the text column is LAID OUT, not translated
 * `lg:pr-[58%]` on the wrapper, with the block still `justify-center`ed inside what is
 * left: the column is literally the strip the slab does not cover, so the text is centred
 * in the white half the way the hero's copy is centred in its own.
 *
 * It is not a translate, and that distinction is the bug this shipped with once. A `%`
 * translate resolves against the ELEMENT'S OWN border box, so the same `-25%` means 25%
 * of the viewport on the full-width wrapper and 25% of `max-w-2xl` (168px) on the block
 * inside it — put it on the wrong element and the text stops well short of where it
 * should be and runs under the slab. Worse, even on the right element the shift is a
 * fixed fraction while the block's width is a fixed 42rem, so the two only agree above
 * ~1780px: below that the block's bottom-right corner slid under the slab anyway.
 * Padding has neither problem — the strip and the column are the same measurement.
 *
 * The number: the slab is `w-[55%]` of the panel's padding box and the wrapper sits
 * inside the panel's own `px`, so 58% leaves a visible margin at every width (~24px at
 * 1024, ~50px at 1920) instead of the ~5px an exact 56% would. The slab's diagonal only
 * ever moves its painted edge further right, so the bottom of the panel is the binding
 * case and the top has ~10% of the viewport to spare.
 *
 * ## Two things that will break it if moved
 * - **The flex/gap/padding live on the inner wrapper, not on the slab.** They have to sit
 *   on the element whose children they lay out; leave them on the slab and the wrapper
 *   becomes a single flex item and the focus collapses into one block.
 * - **`backdrop` stays OUTSIDE that wrapper.** It is `absolute inset-0 z-0`, so it
 *   resolves against the slab's padding box and is clipped by the slab's own diagonal
 *   `clip-path` for free — but only while it is a child of the slab itself. Inside the
 *   wrapper it would slide in with the text, which is precisely what the client did not
 *   want.
 *
 * `%` on the wrapper's `x` resolves against the WRAPPER's width (the slab, 55vw on
 * desktop), not the viewport — so `100%` is one slab-width off to the right, and the
 * slab's `overflow-hidden` clips it on the way in.
 *
 * A panel using this needs `end` past `FOCUS_LANDED` plus reading dwell, or the focus
 * never finishes arriving before the section hands off.
 */

/** Scroll position where the focus starts arriving. The text column's staggered reveals
 *  (`rev(0..3)` in page.tsx) finish at ~860, so it arrives once they have been read. */
export const FOCUS_IN = 960;
/** How much scroll the arrival takes end-to-end. */
export const FOCUS_SPAN = 340;
/** Where the focus is home — the earliest a panel can be considered "told", and what a
 *  jump's `land` in HERO_INDEX aims just past. */
export const FOCUS_LANDED = FOCUS_IN + FOCUS_SPAN;
/** PHONE ONLY: how far the text block slides left as the slab arrives. A share of the
 *  viewport, because it is applied to the full-width wrapper and a `%` translate resolves
 *  against the element's own box. On phones the slab is full-width and has covered the
 *  text by the time this finishes, so it reads as "explanation, then focus" rather than
 *  as a shift — it is the motion that matters, not the destination. Desktop does not use
 *  it at all: there the column is laid out inside the strip (see the docblock). */
const SHIFT = "-25%";

/** Nothing to animate — the element keeps whatever CSS gives it (no inline pose). */
const STATIC: AnimSpec = [];
/** Phone: the slab arrives from off-stage right (`x: 100%` on a `right-0` box). */
const SLAB_IN: AnimSpec = [
  { at: 0, x: "100%" },
  { at: 1, x: 0, ease: easeOutCubic },
];
/** Phone: the text makes room as the slab comes. */
const TEXT_OUT: AnimSpec = [
  { at: 0, x: 0 },
  { at: 1, x: SHIFT, ease: easeOutCubic },
];
/** Desktop: the slab is already there and its CONTENT is what arrives. */
const CONTENT_IN: AnimSpec = [
  { at: 0, x: "100%", opacity: 0 },
  { at: 1, x: 0, opacity: 1, ease: easeOutCubic },
];

export default function FocusPanel({
  ground,
  slab,
  backdrop,
  focus,
  children,
}: {
  /** Tailwind background for the panel itself, e.g. `"bg-white"`. */
  ground: string;
  /** Tailwind classes for the slab — background, and text colour when it's a dark one
   *  (e.g. `"bg-primary text-white"`). */
  slab: string;
  /** The slab's photographic ground. Always visible, never animated with the content —
   *  on desktop it is what the slab wears while the focus is still off-stage. */
  backdrop?: React.ReactNode;
  /** The sub-beat itself: the text and whatever signs it off. */
  focus: React.ReactNode;
  /** The service's explanation: the caller's own `SDiv` reveals. */
  children: React.ReactNode;
}) {
  const desktop = useIsDesktop();

  return (
    <div className={`${PANEL_BOX} ${ground}`}>
      <SDiv
        start={FOCUS_IN}
        budget={FOCUS_SPAN}
        anim={desktop ? STATIC : TEXT_OUT}
        className={`relative z-10 flex w-full justify-center${desktop ? " lg:pr-[58%]" : ""}`}
      >
        <div className="w-full max-w-2xl">{children}</div>
      </SDiv>

      <SDiv
        start={FOCUS_IN}
        budget={FOCUS_SPAN}
        anim={desktop ? STATIC : SLAB_IN}
        className={`absolute inset-y-0 right-0 z-20 w-full overflow-hidden shadow-2xl lg:w-[55%] lg:[clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)] ${slab}`}
      >
        {backdrop}
        <SDiv
          start={FOCUS_IN}
          budget={FOCUS_SPAN}
          anim={desktop ? CONTENT_IN : STATIC}
          className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-8 px-8 py-16 text-center short:gap-4 short:py-8 sm:px-12 lg:pl-24 lg:pr-16"
        >
          {focus}
        </SDiv>
      </SDiv>
    </div>
  );
}
