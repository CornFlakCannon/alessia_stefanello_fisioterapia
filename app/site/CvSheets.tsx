'use client';

import SDiv from "@/app/widgets/SDiv";
import { easeOutCubic } from "@/app/_scroll/easing";
import type { AnimSpec } from "@/app/widgets/anim";

/**
 * The CV, dealt out one sheet at a time.
 *
 * ## Why the panel is paged
 * Alessia's CV is sixteen entries under four headings; panel 5 has to fit inside 100svh
 * like every other one. So a longer CV buys PAGES, not height — the client's own image
 * for it was "un foglio che si sovrappone", a sheet sliding in from the right over the
 * one before (NUOVA_TODO.md §Formazione/1).
 *
 * ## Driven by scroll, not by buttons
 * The page is told by scrolling and nothing else on it asks to be clicked, so the sheets
 * deal themselves as you go. That also sidesteps the engine's tap-vs-swipe seam entirely
 * (see CLAUDE.md): there is no control here for a finger to land on. The cost is that the
 * panel needs the scroll to spend — `sheetsEnd()` is exported so `PANEL_END[5]` is
 * DERIVED from the page count instead of being a number someone has to remember to bump.
 *
 * ## The arrival
 * `x: 100% → 0` with `scale: 1.2 → 1`: it comes in large and settles, which is what makes
 * it read as landing ON the stack rather than sliding along it. The shadow does the rest
 * of that work and has to fade OUT as the sheet lands ("arriva a scale 1 senza shadow") —
 * `box-shadow` is not one of `anim.ts`'s channels, so it lives on its own layer whose
 * OPACITY is animated instead. That layer is a sibling painted before the sheet's own
 * white, so it reads as the shadow underneath it.
 *
 * Sheets are `absolute inset-0` in a fixed-height box and only ever fade/slide IN, never
 * out — same rule as `PhotoSlab`: an opaque sheet covers the one beneath, so there is
 * never a frame with two half-transparent layers letting the panel show through.
 *
 * The box's height is sized for the LONGEST page (six entries, three rows of two). Adding
 * a seventh entry to one page is the thing that will overflow it — add a page instead.
 */

/** Scroll where the SECOND sheet starts arriving (the first is there from the start).
 *  The panel's own reveals — `rev(0..3)` in page.tsx — finish at ~860. */
export const PAGE_IN = 900;
/** Scroll between one sheet's arrival and the next. The reading pace: raise it to give
 *  each page longer on screen. */
export const PAGE_STEP = 380;
/** How long a single arrival takes. */
export const PAGE_SPAN = 330;

/** Where the last sheet is home. `PANEL_END[5]` is this plus a dwell — so the panel's
 *  budget follows the CV instead of being a number to keep in sync by hand. */
export const sheetsEnd = (pages: number) => PAGE_IN + Math.max(0, pages - 1) * PAGE_STEP + PAGE_SPAN;

/** The i-th sheet's window (i >= 1; sheet 0 never animates). */
const windowFor = (i: number) => ({ start: PAGE_IN + (i - 1) * PAGE_STEP, budget: PAGE_SPAN });

const DEAL: AnimSpec = [
  { at: 0, x: "100%", scale: 1.2, opacity: 0 },
  { at: 1, x: 0, scale: 1, opacity: 1, ease: easeOutCubic },
];
/** The lift under an arriving sheet, gone by the time it is home. */
const SHADOW_OUT: AnimSpec = [
  { at: 0, opacity: 1 },
  { at: 1, opacity: 0, ease: easeOutCubic },
];
/** The progress pip filling as its sheet lands. */
const PIP_IN: AnimSpec = [
  { at: 0, opacity: 0 },
  { at: 1, opacity: 1, ease: easeOutCubic },
];

export type CvPage = {
  readonly id: string;
  readonly label: string;
  readonly items: readonly { readonly year: string; readonly title: string; readonly place: string }[];
};

function Sheet({ page }: { page: CvPage }) {
  return (
    <div className="relative flex h-full flex-col rounded-2xl bg-white px-7 py-6 ring-1 ring-primary/10 short:px-5 short:py-4">
      <p className="mb-4 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-emphasis short:mb-2.5">
        {page.label}
      </p>
      <ul className="grid gap-x-10 gap-y-4 short:gap-y-2.5 sm:grid-cols-2">
        {page.items.map(({ year, title, place }) => (
          <li key={`${year}-${title}`} className="border-t border-primary/15 pt-2.5 short:pt-2">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-secondary">{year}</p>
            <p className="mt-1 font-display text-base leading-snug text-primary short:text-[0.95rem]">{title}</p>
            <p className="mt-0.5 text-sm text-ink/70 short:text-[0.8rem]">{place}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CvSheets({ pages }: { pages: readonly CvPage[] }) {
  return (
    <div>
      {/* Fixed height: the sheets are stacked absolutely, and the panel owes 100svh. */}
      <div className="relative h-[min(23rem,44svh)] w-full short:h-[min(18rem,50svh)]">
        {pages.map((page, i) =>
          i === 0 ? (
            <div key={page.id} className="absolute inset-0">
              <Sheet page={page} />
            </div>
          ) : (
            <SDiv key={page.id} {...windowFor(i)} anim={DEAL} className="absolute inset-0">
              {/* the lift, on its own layer because box-shadow is not an anim channel */}
              <SDiv
                {...windowFor(i)}
                anim={SHADOW_OUT}
                className="pointer-events-none absolute -inset-px rounded-2xl shadow-2xl shadow-primary/30"
              />
              <Sheet page={page} />
            </SDiv>
          ),
        )}
      </div>

      {/* Quante pagine sono, e a che punto siamo. Non cliccabile: la pagina si racconta
          scorrendo, e un controllo qui dentro riaprirebbe il seam tap-vs-swipe. */}
      <div className="mt-4 flex items-center justify-center gap-2 short:mt-2.5">
        {pages.map((page, i) => (
          <span key={page.id} className="relative h-1 w-8 overflow-hidden rounded-full bg-primary/15">
            {i === 0 ? (
              <span className="absolute inset-0 rounded-full bg-secondary" />
            ) : (
              <SDiv {...windowFor(i)} anim={PIP_IN} className="absolute inset-0 rounded-full bg-secondary" />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
