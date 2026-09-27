'use client';

import SDiv from "@/app/widgets/SDiv";
import { easeOutCubic } from "@/app/_scroll/easing";
import type { AnimSpec } from "@/app/widgets/anim";
import { useIsDesktop, useIsShort } from "./useViewport";

/**
 * The CV, dealt out one sheet at a time.
 *
 * ## Why the panel is paged
 * Alessia's CV is sixteen entries under four headings; panel 5 has to fit inside 100svh
 * like every other one. So a longer CV buys PAGES, not height — the client's own image for
 * it was "un foglio che si sovrappone", a sheet sliding in from the right over the one
 * before (NUOVA_TODO.md §Formazione/1).
 *
 * ## A sheet holds a NUMBER of entries, not a CV heading
 * It first shipped as one sheet per heading, and on a phone that overflowed the panel and
 * spilled down the page: "Esperienza" alone is five entries, and below `sm` the list is a
 * single column, so five entries is roughly twice the height four are on desktop. A CV
 * heading is not a unit of layout.
 *
 * So the headings are CHUNKED to what a sheet can hold — `PER_SHEET_DESKTOP` in two
 * columns, `PER_SHEET_PHONE` in one — and a heading that does not fit becomes two sheets
 * carrying "Esperienza · 1/2", "Esperienza · 2/2". Desktop is unchanged (six per sheet
 * still gives one sheet per heading); the phone gets six shorter sheets instead of four
 * that do not fit.
 *
 * ## The box has no height
 * The sheets are stacked with GRID, every one in `row-start-1 col-start-1`, rather than
 * absolutely inside a fixed-height box. Grid rows size to their tallest item and stretch
 * the rest to match, so the box is exactly as tall as the fullest sheet and every sheet is
 * that tall — no `h-[min(23rem,44svh)]` to guess at, and nothing to re-guess when the CV
 * changes or the type reflows on a narrow phone. (That was the other half of the overflow:
 * the height was a number chosen against desktop.)
 *
 * The remaining risk is the honest one: a sheet is only as safe as its entry count, so
 * `PER_SHEET_PHONE` is the knob if the panel ever gets tight again.
 *
 * ## Driven by scroll, not by buttons
 * The page is told by scrolling and nothing else on it asks to be clicked, so the sheets
 * deal themselves as you go. That also sidesteps the engine's tap-vs-swipe seam entirely
 * (see CLAUDE.md): there is no control here for a finger to land on.
 *
 * The pacing follows from that: the panel gives the sheets a FIXED span (`SHEETS_SPAN`,
 * which is what `PANEL_END[5]` is built from) and the step between them is divided out of
 * it. So the phone's six sheets simply deal faster than the desktop's four instead of
 * needing a different panel budget — which they could not have, since a `<Section>`'s
 * `end` is authored once for both.
 *
 * ## The arrival
 * `x: 100% → 0` with `scale: 1.2 → 1`: it comes in large and settles, which is what makes
 * it read as landing ON the stack rather than sliding along it. The shadow does the rest
 * of that work and has to fade OUT as the sheet lands ("arriva a scale 1 senza shadow") —
 * `box-shadow` is not one of `anim.ts`'s channels, so it lives on its own layer whose
 * OPACITY is animated instead. That layer is a sibling painted before the sheet's own
 * white, so it reads as the shadow underneath it.
 *
 * Sheets only ever fade/slide IN, never out — same rule as `PhotoSlab`: an opaque sheet
 * covers the one beneath, so there is never a frame with two half-transparent layers
 * letting the panel show through.
 */

/** Scroll where the SECOND sheet starts arriving (the first is there from the start).
 *  The panel's own reveals — `rev(0..3)` in page.tsx — finish at ~860. */
export const PAGE_IN = 900;
/** How long a single arrival takes. */
export const PAGE_SPAN = 330;
/** Total scroll from `PAGE_IN` to the last sheet being home. Fixed on purpose: the step
 *  between sheets is divided out of it, so the number of sheets can differ between phone
 *  and desktop while the panel's budget stays one authored value. Raised from 1600 when a
 *  short phone started dealing nine sheets — the step is this divided by the count, so the
 *  most crowded case is what sets how fast the fastest deal feels. */
export const SHEETS_SPAN = 1900;
/** Where the last sheet is home. `PANEL_END[5]` is this plus a dwell. */
export const sheetsEnd = () => PAGE_IN + SHEETS_SPAN;

/** Entries per sheet — a question about available HEIGHT, which is why there are three of
 *  them and not one "how many look nice".
 *
 *  Desktop lays entries out in two columns, so six is three rows. A phone gets one column,
 *  so the same six would be six rows. And a SHORT phone (iPhone SE and friends) does not
 *  even have room for three: measured there, the third entry's second line ran past the
 *  fold and the panel was sheared — the failure `100svh` panels always have. */
const PER_SHEET_DESKTOP = 6;
const PER_SHEET_PHONE = 3;
const PER_SHEET_SHORT = 2;

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

export type CvItem = { readonly year: string; readonly title: string; readonly place: string };
export type CvPage = { readonly id: string; readonly label: string; readonly items: readonly CvItem[] };

/** Split each heading into sheets of at most `perSheet` entries, numbering the parts only
 *  when there is more than one ("Esperienza · 1/2"). */
function deal(pages: readonly CvPage[], perSheet: number): CvPage[] {
  const out: CvPage[] = [];
  for (const page of pages) {
    const parts = Math.max(1, Math.ceil(page.items.length / perSheet));
    for (let k = 0; k < parts; k++) {
      out.push({
        id: parts === 1 ? page.id : `${page.id}-${k + 1}`,
        label: parts === 1 ? page.label : `${page.label} · ${k + 1}/${parts}`,
        items: page.items.slice(k * perSheet, (k + 1) * perSheet),
      });
    }
  }
  return out;
}

/** The i-th sheet's window (i >= 1; sheet 0 never animates), pacing `n` sheets across
 *  `SHEETS_SPAN`. */
const windowFor = (i: number, n: number) => ({
  start: PAGE_IN + (i - 1) * (n > 1 ? (SHEETS_SPAN - PAGE_SPAN) / (n - 1) : 0),
  budget: PAGE_SPAN,
});

function Sheet({ page }: { page: CvPage }) {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white px-7 py-6 ring-1 ring-primary/10 short:px-5 short:py-3">
      <p className="mb-4 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-emphasis short:mb-2">
        {page.label}
      </p>
      <ul className="grid gap-x-10 gap-y-4 short:gap-y-2 sm:grid-cols-2">
        {page.items.map(({ year, title, place }) => (
          <li key={`${year}-${title}`} className="border-t border-primary/15 pt-2.5 short:pt-1.5">
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
  const desktop = useIsDesktop();
  const short = useIsShort();
  // `desktop` first: a short DESKTOP window still has two columns and the room for six.
  const sheets = deal(pages, desktop ? PER_SHEET_DESKTOP : short ? PER_SHEET_SHORT : PER_SHEET_PHONE);
  const n = sheets.length;

  return (
    <div>
      {/* Stacked with grid, not absolutely: the row is as tall as the fullest sheet and
          stretches the others to match, so there is no height to guess. */}
      <div className="grid w-full">
        {sheets.map((page, i) =>
          i === 0 ? (
            <div key={page.id} className="col-start-1 row-start-1">
              <Sheet page={page} />
            </div>
          ) : (
            <SDiv
              key={page.id}
              {...windowFor(i, n)}
              anim={DEAL}
              className="relative col-start-1 row-start-1"
            >
              {/* the lift, on its own layer because box-shadow is not an anim channel */}
              <SDiv
                {...windowFor(i, n)}
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
        {sheets.map((page, i) => (
          <span key={page.id} className="relative h-1 w-5 overflow-hidden rounded-full bg-primary/15 sm:w-8">
            {i === 0 ? (
              <span className="absolute inset-0 rounded-full bg-secondary" />
            ) : (
              <SDiv {...windowFor(i, n)} anim={PIP_IN} className="absolute inset-0 rounded-full bg-secondary" />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
