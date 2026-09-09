'use client';

import SDiv from "@/app/widgets/SDiv";
import { easeOutCubic } from "@/app/_scroll/easing";
import type { AnimSpec } from "@/app/widgets/anim";
import { PANEL_BOX } from "./panelBox";
import { useIsDesktop } from "./useViewport";

/**
 * A service panel with a **"focus a destra"** — the client's own name for the device
 * (CLIENTE_TODO.md §2): the explanation on the left, a full-height coloured slab on the
 * right carrying a sub-beat of that service.
 *
 * ```tsx
 * <FocusPanel ground="bg-white" slab="bg-emphasis text-white" side="left"
 *             backdrop={<PhotoSlab … />} focus={<>…text, logo…</>}>
 *   …the text column's SDiv reveals…
 * </FocusPanel>
 * ```
 *
 * ## `side` — the mirror, for the alternated layout
 * "A destra" is the default. `side="left"` is the same device flipped (branch
 * `alt-focus-alternati`, terzo giro): the slab and its diagonal sit on the LEFT edge, the
 * text column is laid out in the strip on the right, and every arrival — slab on phones,
 * content on desktop — comes from the slab's own side, with the text making room the
 * other way. On phones the slab is full-width, so there `side` only decides which edge it
 * slides in from. Everything that depends on it lives in the `SIDE` table below; a panel
 * says one word and nothing else changes.
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
 * `lg:pr-[58%]` on the wrapper (`pl` for a left slab), with the block still
 * `justify-center`ed inside what is left: the column is literally the strip the slab does
 * not cover, so the text is centred in the white half the way the hero's copy is centred
 * in its own.
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
 * desktop), not the viewport — so `±100%` is one slab-width off to the slab's own side,
 * and the slab's `overflow-hidden` clips it on the way in.
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
/** PHONE ONLY: how far the text block slides AWAY from the incoming slab. A share of the
 *  viewport, because it is applied to the full-width wrapper and a `%` translate resolves
 *  against the element's own box. On phones the slab is full-width and has covered the
 *  text by the time this finishes, so it reads as "explanation, then focus" rather than
 *  as a shift — it is the motion that matters, not the destination. Desktop does not use
 *  it at all: there the column is laid out inside the strip (see the docblock). */
const SHIFT = "25%";

/** Nothing to animate — the element keeps whatever CSS gives it (no inline pose). */
const STATIC: AnimSpec = [];

export type Side = "right" | "left";

/**
 * Everything that depends on which side the slab lives on, side by side so the two can
 * never drift apart. Class strings stay literals (Tailwind scans source for them) and
 * the keyframe arrays are module constants (`SDiv` memoises its compiled anim on the
 * array's identity — a literal in the render would recompile every frame).
 *
 * - `column`: the strip the text is laid out in — the side the slab does NOT cover.
 * - `slab`: which edge the slab hugs, and the diagonal on its inner edge (the polygon is
 *   the right one mirrored, x → 100% − x).
 * - `content`: the slab's inner padding, the bigger value on the diagonal side.
 * - `slabIn` (phone): the slab arrives from off-stage on its own side.
 * - `textOut` (phone): the text makes room, moving the other way.
 * - `contentIn` (desktop): the slab is already there and its CONTENT arrives, from its side.
 */
const SIDE: Record<
  Side,
  { column: string; slab: string; content: string; slabIn: AnimSpec; textOut: AnimSpec; contentIn: AnimSpec }
> = {
  right: {
    column: "lg:pr-[58%]",
    slab: "right-0 lg:[clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)]",
    content: "lg:pl-24 lg:pr-16",
    slabIn: [
      { at: 0, x: "100%" },
      { at: 1, x: 0, ease: easeOutCubic },
    ],
    textOut: [
      { at: 0, x: 0 },
      { at: 1, x: `-${SHIFT}`, ease: easeOutCubic },
    ],
    contentIn: [
      { at: 0, x: "100%", opacity: 0 },
      { at: 1, x: 0, opacity: 1, ease: easeOutCubic },
    ],
  },
  left: {
    column: "lg:pl-[58%]",
    slab: "left-0 lg:[clip-path:polygon(0_0,88%_0,100%_100%,0_100%)]",
    content: "lg:pr-24 lg:pl-16",
    slabIn: [
      { at: 0, x: "-100%" },
      { at: 1, x: 0, ease: easeOutCubic },
    ],
    textOut: [
      { at: 0, x: 0 },
      { at: 1, x: SHIFT, ease: easeOutCubic },
    ],
    contentIn: [
      { at: 0, x: "-100%", opacity: 0 },
      { at: 1, x: 0, opacity: 1, ease: easeOutCubic },
    ],
  },
};

export default function FocusPanel({
  ground,
  slab,
  backdrop,
  focus,
  side = "right",
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
  /** Which edge the slab lives on. "right" is the client's "focus a destra"; "left" is
   *  its mirror for the alternated layout — see the docblock. */
  side?: Side;
  /** The service's explanation: the caller's own `SDiv` reveals. */
  children: React.ReactNode;
}) {
  const desktop = useIsDesktop();
  const s = SIDE[side];

  return (
    <div className={`${PANEL_BOX} ${ground}`}>
      <SDiv
        start={FOCUS_IN}
        budget={FOCUS_SPAN}
        anim={desktop ? STATIC : s.textOut}
        className={`relative z-10 flex w-full justify-center${desktop ? ` ${s.column}` : ""}`}
      >
        <div className="w-full max-w-2xl">{children}</div>
      </SDiv>

      <SDiv
        start={FOCUS_IN}
        budget={FOCUS_SPAN}
        anim={desktop ? STATIC : s.slabIn}
        className={`absolute inset-y-0 z-20 w-full overflow-hidden shadow-2xl lg:w-[55%] ${s.slab} ${slab}`}
      >
        {backdrop}
        <SDiv
          start={FOCUS_IN}
          budget={FOCUS_SPAN}
          anim={desktop ? s.contentIn : STATIC}
          className={`relative z-10 flex h-full w-full flex-col items-center justify-center gap-8 px-8 py-16 text-center short:gap-4 short:py-8 sm:px-12 ${s.content}`}
        >
          {focus}
        </SDiv>
      </SDiv>
    </div>
  );
}
