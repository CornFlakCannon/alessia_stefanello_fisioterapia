'use client';

import { HERO_INDEX, HERO_INDEX_EXTRAS, HERO_INDEX_TITLE } from "./data";
import useSectionJump from "./useSectionJump";

/**
 * The hero's index — the page's table of contents, and the thing that gives the hero a
 * bottom edge to sit on (the panel used to end in dead space under the CTA).
 *
 * ## Two groups, on purpose
 * The three services answer one question ("lavoro in ambito…") and are numbered; the
 * contact panel and the CV are not services and were reading as a fourth one, so they sit
 * apart, under their own rule. The split lives in `data.ts` (`HERO_INDEX` vs
 * `HERO_INDEX_EXTRAS`) rather than as a flag on one list, so this component still has no
 * per-entry branching — it renders two lists the same way.
 *
 * ## Clicking an entry scrolls there
 * The engine has no jump API and is off limits, so `useSectionJump` drives it from its own
 * input — see that file for why. `e.currentTarget` is load-bearing: the hook dispatches
 * its synthetic wheel events ON the clicked element so they bubble to the shell's
 * container listener. The travel is visible (the page fast-scrolls through the panels in
 * between) rather than a cut: on a scroll-told page a teleport reads as a bug, and it
 * keeps every scroll-driven animation on the way in phase.
 *
 * ## One column on desktop, two on phones
 * On desktop the services are a LIST: one per row, the ordinal in a fixed-width column so
 * the labels line up, rows separated by rules — a menu, not a scatter. It used to be the
 * phone's 2-column grid at every width, and with three entries that is 2+1: an orphan row
 * and ordinals landing at a different x on each line ("buttato lì"). The rows are
 * left-aligned INSIDE a block that is itself centred (the caller's `mx-auto`), which is
 * how it stays centred under the name without the ragged look.
 *
 * On phones the grid stays: full-width rows would cost the panel too much of the 100svh it
 * must fit inside — and the hero's rising card is sized against this block's height
 * (`SHEET_DY` in page.tsx), so its phone height must not change. The extras row is two
 * columns for the same reason: adding "Contattami" cost zero rows. The type steps down to
 * `0.8rem` below `sm` because at `text-sm` the longest label ("Fisioterapia Domiciliare")
 * wrapped to a second line in a half-width column, which made that one row 18px taller than
 * the others AND ragged.
 *
 * If it ever still doesn't fit, `max-lg:short:hidden` on the <nav> is the valve — the index
 * is the least load-bearing block in the panel.
 *
 * ## Why it is all `ink` and no accent colour
 * It sits on the hero's GOLD half, and gold is a ground that eats the palette: measured
 * against `--brand-secondary`, `text-secondary` is invisible by definition, `text-emphasis`
 * comes out at 2.88:1 and even full `text-primary` at 3.75:1 — enough for large text, not
 * for an 11px ordinal. So the hierarchy here is carried by WEIGHT of ink rather than by
 * hue: the number at `/75` (4.53:1) under the label at full ink (7.26:1). The blue is
 * spent where it can be: the headline, which is large, and the rules beside the role,
 * which are non-text and only owe 3:1.
 */

/** One row: the shared hit target, hover/focus lift and underline.
 *  `jumpTo` is passed in rather than pulled from the hook here — the hook keeps "at most
 *  one jump in flight" in a ref, and one instance per row would let two rAF loops feed
 *  the accumulator against each other when a second entry is clicked mid-travel.
 *  `align="start"` is the desktop list row: left-aligned from `lg`, with the ordinal in a
 *  fixed column so every label starts on the same x. Below `lg` it is centred like the
 *  rest (the phone grid cells are half-width and a left edge there reads as a mistake). */
function Entry({
  jumpTo,
  n,
  label,
  section,
  land,
  align = "center",
}: {
  jumpTo: (target: number, from: Element, land?: number) => void;
  n?: string;
  label: string;
  section: number;
  land?: number;
  align?: "start" | "center";
}) {
  const start = align === "start";
  return (
    <button
      type="button"
      onClick={(e) => jumpTo(section, e.currentTarget, land)}
      aria-label={`Vai alla sezione ${label}`}
      className={`group flex w-full items-baseline justify-center gap-2 py-1.5 transition-transform hover:translate-x-0.5 focus-visible:translate-x-0.5 focus-visible:outline-none${
        start ? " lg:justify-start lg:gap-3 lg:py-2" : ""
      }`}
    >
      {n && (
        <span
          className={`font-mono text-[0.7rem] text-ink/75 transition-colors group-hover:text-ink group-focus-visible:text-ink${
            start ? " lg:w-7 lg:shrink-0 lg:text-left" : ""
          }`}
        >
          {n}
        </span>
      )}
      <span className="font-sans text-[0.8rem] text-ink underline-offset-4 group-hover:underline group-focus-visible:underline sm:text-[0.95rem]">
        {label}
      </span>
    </button>
  );
}

export default function ServiceIndex({ className = "" }: { className?: string }) {
  const { jumpTo } = useSectionJump();
  const odd = HERO_INDEX.length % 2 === 1;

  return (
    <nav aria-label="Sezioni del sito" className={className}>
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink/80 lg:text-left">
        {HERO_INDEX_TITLE}
      </p>
      <ul className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 short:mt-1 short:gap-y-0.5 lg:grid-cols-1 lg:gap-y-0">
        {HERO_INDEX.map(({ n, label, section, land }, i) => (
          <li
            key={n}
            /* Phone grid only: an ODD count leaves the last entry alone on its row, and
               half a column is not enough for the longest label plus its ordinal — it
               wrapped to two lines, which made the row taller than the others and left the
               number stranded at the left of a two-line block. Spanning the row it has the
               width to stay on one line. On desktop every row already spans. */
            className={`border-t border-ink/25${
              odd && i === HERO_INDEX.length - 1 ? " max-lg:col-span-2" : ""
            }`}
          >
            <Entry jumpTo={jumpTo} n={n} label={label} section={section} land={land} align="start" />
          </li>
        ))}
      </ul>
      {/* staccati: non sono servizi. Il margine è il separatore — nessun filetto in più,
          il pannello deve stare in 100svh. Due colonne su OGNI viewport: sul telefono è
          la stessa riga di prima (l'altezza della card che sale dipende da questo blocco),
          su desktop è la riga di chiusura sotto la lista. Il filetto verticale fra i due
          è il divisore, al posto di un secondo ordinale che non hanno. */}
      <ul className="mt-4 grid grid-cols-2 border-t border-ink/40 short:mt-2.5">
        {HERO_INDEX_EXTRAS.map(({ label, section }, i) => (
          <li key={label} className={i > 0 ? "border-l border-ink/25" : undefined}>
            <Entry jumpTo={jumpTo} label={label} section={section} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
