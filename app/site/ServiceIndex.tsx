'use client';

import { HERO_INDEX } from "./data";
import useSectionJump from "./useSectionJump";

/**
 * The hero's index of services — the page's table of contents, and the thing that
 * gives the hero a bottom edge to sit on (the panel used to end in dead space under
 * the CTA). Entries come from `HERO_INDEX` in data.ts, including which panel each one
 * scrolls to.
 *
 * Clicking an entry scrolls there. The engine has no jump API and is off limits, so
 * `useSectionJump` drives it from its own input — see that file for why. The travel is
 * visible (the page fast-scrolls through the panels in between) rather than a cut: on a
 * scroll-told page a teleport reads as a bug, and it also keeps every scroll-driven
 * animation on the way in phase.
 *
 * Two columns even on phones: four full-width rows would cost the panel ~140px of the
 * 100svh it must fit inside. If it ever doesn't fit on an iPhone SE, `max-lg:short:hidden`
 * on the <nav> is the valve — the index is the least load-bearing block in the panel.
 */
export default function ServiceIndex({ className = "" }: { className?: string }) {
  const { jumpTo } = useSectionJump();

  return (
    <nav aria-label="Sezioni del sito" className={className}>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-1 short:gap-y-0.5">
        {HERO_INDEX.map(({ n, label, section }) => (
          <li key={n} className="border-t border-primary/15">
            <button
              type="button"
              onClick={(e) => jumpTo(section, e.currentTarget)}
              aria-label={`Vai alla sezione ${label}`}
              className="group flex w-full items-baseline gap-2 py-2 text-left transition-transform hover:translate-x-0.5 focus-visible:translate-x-0.5 focus-visible:outline-none short:py-1.5"
            >
              <span className="font-mono text-[0.7rem] text-secondary transition-colors group-hover:text-emphasis group-focus-visible:text-emphasis">
                {n}
              </span>
              <span className="font-sans text-sm text-primary/85 underline-offset-4 group-hover:underline group-focus-visible:underline sm:text-[0.95rem]">
                {label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
