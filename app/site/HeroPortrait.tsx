'use client';

import Image from "next/image";
import { easeInCubic } from "../_scroll/easing";
import SDiv from "../widgets/SDiv";

/**
 * The hero portrait — Alessia's photo inside the "biglietto da visita" line motif:
 * an offset thin frame behind it plus four corner brackets, same grammar as the
 * panel-level `Corners` in page.tsx.
 *
 * ## The arrival
 * The photo swings in as a card in 3D (`.fisio-arrive`, see globals.css: edge-on and
 * far back → turns toward the viewer → settles with decaying overshoots). Three
 * structural details make the depth work:
 *
 * 1. the animation lives HERE, not on the enclosing `<SDiv>` — SDiv writes
 *    `translate`/`opacity` inline every frame, so a CSS animation on that same
 *    element would fight it. Separate elements let the photo turn *and* parallax;
 * 2. `perspective` sits on the outer (still) wrapper, since the property applies to
 *    an element's CHILDREN — it's what makes the rotation read as 3D rather than a
 *    flat squash. Shorter value = more dramatic;
 * 3. the shadow is a sibling OUTSIDE the turning element, so it stays put and just
 *    widens as the card comes forward.
 *
 * The frame line and the brackets sit INSIDE the turning element so they inherit its
 * resting -3° rotation and stay aligned; they're transparent until the photo is flat,
 * then arrive in their own beat (`.fisio-frame-in` / `.fisio-corner-in`).
 *
 * ## The departure
 * On scroll each part leaves on its OWN window (see the constants below): the corners
 * fly out diagonally one after another, the offset frame drifts further out and dims,
 * the photo lifts. Page.tsx keeps a small whole-group drift under all of it — DOM
 * nesting composes the two, so a part's travel ADDS to the group's.
 *
 * Two rules that shape the markup, both learned the hard way:
 *
 * - **one element per animation owner.** The scroll layer (an `<SDiv>` wrapper) and
 *   the entrance layer (a `<span>` with the CSS animation) are always separate
 *   elements. A filled (`both`) CSS animation outranks inline styles in the cascade
 *   permanently, so its `opacity: 1` would beat everything SDiv writes;
 * - **SDiv takes no `style`/`aria-*`.** Its props are the scroll window + `anim` +
 *   `className` and nothing else — anything else is dropped on the floor, silently
 *   (TS doesn't check JSX spreads or hyphenated attributes). So the `animationDelay`
 *   stagger and `aria-hidden` live on the inner span.
 *
 * These SDivs carry no `index`: rendered inside the hero `<Section index={0}>` they
 * inherit it, like PadovaMap's rings inherit the domiciliare panel's.
 */

/** Scroll window (index-0 units) over which the portrait comes apart as the hero
 *  leaves. Must finish well inside the hero's ceiling (PANEL_END[0] = 1100 in
 *  page.tsx) or the beat never completes before the panel hands off. */
const DRIFT_START = 60;
const DRIFT_BUDGET = 420;
/** Scroll units each successive corner waits — the scroll-side twin of the
 *  on-load `animationDelay` stagger. */
const DRIFT_STAGGER = 45;
/** How far a corner flies out on each axis (px). */
const SPREAD = 26;

/** The four brackets: where they sit, which borders they draw, where they fly. */
const CORNERS = [
  { pos: "-left-2 -top-2",     edge: "border-l-2 border-t-2", dx: -SPREAD, dy: -SPREAD },
  { pos: "-right-2 -top-2",    edge: "border-r-2 border-t-2", dx:  SPREAD, dy: -SPREAD },
  { pos: "-bottom-2 -left-2",  edge: "border-b-2 border-l-2", dx: -SPREAD, dy:  SPREAD },
  { pos: "-bottom-2 -right-2", edge: "border-b-2 border-r-2", dx:  SPREAD, dy:  SPREAD },
] as const;

export default function HeroPortrait({ className = "" }: { className?: string }) {
  return (
    <div className={`relative [perspective:700px] ${className}`}>
      {/* ground shadow — never turns with the photo, only widens under it */}
      <span
        aria-hidden="true"
        className="fisio-shadow pointer-events-none absolute inset-x-4 -bottom-2 -z-10 h-5 rounded-[50%] bg-primary/30 blur-lg"
      />

      <div className="fisio-arrive relative">
        {/* offset outline — the "design line". The SDiv drifts it away on scroll; the
            span keeps the CSS slide-out, whose final translate(25px,25px) IS the
            resting offset, so no translate-* utility may go on it. */}
        <SDiv
          start={DRIFT_START}
          budget={DRIFT_BUDGET}
          anim={[
            { at: 0, x: 0, y: 0, opacity: 1 },
            { at: 1, x: 18, y: 18, opacity: 0.2, ease: easeInCubic },
          ]}
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <span
            aria-hidden="true"
            className="fisio-frame-in block h-full w-full border-2 border-primary/35"
          />
        </SDiv>

        {/* the photo still sets the card's box, so this SDiv stays in flow */}
        <SDiv
          start={DRIFT_START}
          budget={DRIFT_BUDGET}
          anim={[
            { at: 0, y: 0, scale: 1 },
            { at: 1, y: -28, scale: 0.98, ease: easeInCubic },
          ]}
        >
          <Image
            src="/fotoalessia.png"
            alt="Alessia Stefanello, fisioterapista"
            width={448}
            height={637}
            priority
            className="h-auto w-full object-cover shadow-xl shadow-primary/20"
          />
        </SDiv>

        {/* corner brackets, just outside the photo's edges: they snap in one after
            another on load, then fly out diagonally in the same order on scroll */}
        {CORNERS.map(({ pos, edge, dx, dy }, i) => (
          <SDiv
            key={pos}
            start={DRIFT_START + i * DRIFT_STAGGER}
            budget={DRIFT_BUDGET}
            anim={[
              { at: 0, x: 0, y: 0, opacity: 1 },
              { at: 1, x: dx, y: dy, opacity: 0, ease: easeInCubic },
            ]}
            className={`pointer-events-none absolute h-8 w-8 ${pos}`}
          >
            <span
              aria-hidden="true"
              className={`fisio-corner-in block h-full w-full border-primary ${edge}`}
              style={{ animationDelay: `${0.88 + i * 0.2}s` }}
            />
          </SDiv>
        ))}
      </div>
    </div>
  );
}
