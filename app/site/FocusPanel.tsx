'use client';

import SDiv from "@/app/widgets/SDiv";
import { easeOutCubic } from "@/app/_scroll/easing";
import { PANEL_BOX } from "./panelBox";

/**
 * A service panel with a **"focus a destra"** — the client's own name for the device
 * (CLIENTE_TODO.md §2): the explanation reveals centred, then a full-height coloured
 * slab slides in from the right carrying a sub-beat of that service, and the text
 * slides left to make room for it.
 *
 * It shipped hand-wired inside the old Sport panel; extracting it is what lets all
 * three services use it without three copies of the timing. Callers supply the two
 * halves and the two grounds:
 *
 * ```tsx
 * <FocusPanel ground="bg-white" slab="bg-emphasis" focus={<>…slab…</>}>
 *   …the text column's SDiv reveals…
 * </FocusPanel>
 * ```
 *
 * ## The two motions are one window
 * Text-shift and slab-entry share `FOCUS_IN`/`FOCUS_SPAN`, so they are literally the
 * same gesture seen twice. `SHIFT` is a percentage: CSS resolves a translate `%`
 * against the element's OWN width (see widgets/anim.ts), and the wrapper spans the
 * whole panel — so it reads as a share of the VIEWPORT and needs no per-device
 * coordinates. The slab starts at 45% and its clip-path uncovers to ~51%, so the free
 * strip's centre is ~25% in. `x: "100%"` on a `right-0` box means fully off-screen
 * right, so `100% → 0` is "off-stage → home".
 *
 * On phones the slab is full-width and has covered the text by the time the shift
 * happens, so the shift simply isn't seen — the panel reads as "explanation, then
 * focus", which is the same story in one column.
 *
 * The panel that hosts this must give its `<Section>` an `end` past `FOCUS_LANDED`
 * plus reading dwell (see PANEL_END in page.tsx), or the slab never finishes arriving
 * before the section hands off.
 */

/** Scroll position where the slab starts entering. The text column's staggered reveals
 *  (`rev(0..3)` in page.tsx) finish at ~860, so the focus arrives once it has been read. */
export const FOCUS_IN = 960;
/** How much scroll the entry takes end-to-end. */
export const FOCUS_SPAN = 340;
/** Where the slab is home — the earliest a panel can be considered "told", and what a
 *  jump's `land` in HERO_INDEX aims just past. */
export const FOCUS_LANDED = FOCUS_IN + FOCUS_SPAN;
/** How far the text block slides left when the slab arrives (share of the viewport). */
const SHIFT = "-25%";

export default function FocusPanel({
  ground,
  slab,
  focus,
  children,
}: {
  /** Tailwind background for the panel itself, e.g. `"bg-white"`. */
  ground: string;
  /** Tailwind classes for the slab — background, and text colour when it's a dark one
   *  (e.g. `"bg-primary text-white"`). */
  slab: string;
  /** The sub-beat that rides in on the slab. */
  focus: React.ReactNode;
  /** The service's explanation: the caller's own `SDiv` reveals. */
  children: React.ReactNode;
}) {
  return (
    <div className={`${PANEL_BOX} ${ground}`}>
      <SDiv
        start={FOCUS_IN}
        budget={FOCUS_SPAN}
        anim={[
          { at: 0, x: 0 },
          { at: 1, x: SHIFT, ease: easeOutCubic },
        ]}
        className="relative z-10 flex w-full justify-center"
      >
        <div className="w-full max-w-2xl">{children}</div>
      </SDiv>

      <SDiv
        start={FOCUS_IN}
        budget={FOCUS_SPAN}
        anim={[
          { at: 0, x: "100%" },
          { at: 1, x: 0, ease: easeOutCubic },
        ]}
        className={`absolute inset-y-0 right-0 z-20 flex w-full flex-col items-center justify-center gap-8 overflow-hidden px-8 py-16 text-center shadow-2xl short:gap-4 short:py-8 sm:px-12 lg:w-[55%] lg:pl-24 lg:pr-16 lg:[clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)] ${slab}`}
      >
        {focus}
      </SDiv>
    </div>
  );
}
