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
 * it must fit inside. If it ever doesn't fit on an iPhone SE, `max-lg:short:hidden` on the
 * <nav> is the valve — the index is the least load-bearing block in the panel.
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
      className="group flex w-full items-baseline justify-center gap-2 py-2 transition-transform hover:translate-x-0.5 focus-visible:translate-x-0.5 focus-visible:outline-none short:py-1.5"
    >
      {n && (
        <span className="font-mono text-[0.7rem] text-secondary transition-colors group-hover:text-emphasis group-focus-visible:text-emphasis">
          {n}
        </span>
      )}
      <span className="font-sans text-sm text-primary/85 underline-offset-4 group-hover:underline group-focus-visible:underline sm:text-[0.95rem]">
        {label}
      </span>
    </button>
  );
}

export default function ServiceIndex({ className = "" }: { className?: string }) {
  const { jumpTo } = useSectionJump();

  return (
    <nav aria-label="Sezioni del sito" className={className}>
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-primary/60">
        {HERO_INDEX_TITLE}
      </p>
      <ul className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 short:mt-1 short:gap-y-0.5">
        {HERO_INDEX.map(({ n, label, section, land }) => (
          <li key={n} className="border-t border-primary/15">
            <Entry jumpTo={jumpTo} n={n} label={label} section={section} land={land} />
          </li>
        ))}
      </ul>
      {/* staccata: non è un servizio. Il margine è il separatore — nessun filetto in più,
          il pannello deve stare in 100svh. */}
      <div className="mt-4 border-t border-primary/25 short:mt-2.5">
        <Entry jumpTo={jumpTo} label={HERO_INDEX_EXTRA.label} section={HERO_INDEX_EXTRA.section} />
      </div>
    </nav>
  );
}
