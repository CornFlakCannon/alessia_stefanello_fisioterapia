'use client';

import { HERO_INDEX, HERO_INDEX_EXTRA, HERO_INDEX_TITLE } from "./data";
import useSectionJump from "./useSectionJump";

/**
 * The hero's index — the page's table of contents, and the thing that gives the hero a
 * bottom edge to sit on (the panel used to end in dead space under the CTA).
 *
 * ## Two groups, on purpose
 * The three services answer one question ("lavoro in ambito…") and are numbered; the CV
 * is not a service and was reading as a fourth one, so it sits apart, under its own rule
 * and in the first person. The split lives in `data.ts` (`HERO_INDEX` vs
 * `HERO_INDEX_EXTRA`) rather than as a flag on one list, so this component still has no
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
 * Two columns even on phones: full-width rows would cost the panel too much of the 100svh
 * it must fit inside. The type steps down to `0.8rem` below `sm` for the same reason and it
 * is not cosmetic — at `text-sm` the longest label ("Fisioterapia Domiciliare") wrapped to a
 * second line in a half-width column, which made that one row 18px taller than the others
 * AND ragged. Shrinking it buys the height twice.
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
 *  the accumulator against each other when a second entry is clicked mid-travel. */
function Entry({
  jumpTo,
  n,
  label,
  section,
  land,
}: {
  jumpTo: (target: number, from: Element, land?: number) => void;
  n?: string;
  label: string;
  section: number;
  land?: number;
}) {
  return (
    <button
      type="button"
      onClick={(e) => jumpTo(section, e.currentTarget, land)}
      aria-label={`Vai alla sezione ${label}`}
      className="group flex w-full items-baseline justify-center gap-2 py-1.5 transition-transform hover:translate-x-0.5 focus-visible:translate-x-0.5 focus-visible:outline-none"
    >
      {n && (
        <span className="font-mono text-[0.7rem] text-ink/75 transition-colors group-hover:text-ink group-focus-visible:text-ink">
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

  return (
    <nav aria-label="Sezioni del sito" className={className}>
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink/80">
        {HERO_INDEX_TITLE}
      </p>
      <ul className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 short:mt-1 short:gap-y-0.5">
        {HERO_INDEX.map(({ n, label, section, land }) => (
          <li key={n} className="border-t border-ink/25">
            <Entry jumpTo={jumpTo} n={n} label={label} section={section} land={land} />
          </li>
        ))}
      </ul>
      {/* staccata: non è un servizio. Il margine è il separatore — nessun filetto in più,
          il pannello deve stare in 100svh. */}
      <div className="mt-4 border-t border-ink/40 short:mt-2.5">
        <Entry jumpTo={jumpTo} label={HERO_INDEX_EXTRA.label} section={HERO_INDEX_EXTRA.section} />
      </div>
    </nav>
  );
}
