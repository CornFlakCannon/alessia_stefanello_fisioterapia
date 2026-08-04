'use client';

import Image from "next/image";
import { easeInCubic } from "../_scroll/easing";
import SDiv from "../widgets/SDiv";

/**
 * The hero portrait — Alessia rising out of a single horizontal line.
 *
 * ## The idea
 * One rule (`.fisio-line`) is drawn across the panel, and the photo slides UP from
 * behind it: the line is not decoration but the *edge of a mask*. Mechanically that
 * mask is an `overflow-hidden` box whose BOTTOM edge is exactly where the line sits,
 * so everything below the line is clipped and the photo appears to surface through it.
 *
 * The photo stops with its last `--emerge-rest` still submerged (a deliberate choice:
 * she reads as *emerging*, not as standing on a shelf). Consequence to know before
 * tuning it: the reserved box stays as tall as the photo, so that same fraction shows
 * up as a transparent strip ABOVE the image. It's invisible, it just adds a little
 * breathing room over the portrait — and `--emerge-rest` is the single knob for both.
 *
 * ## The beats
 *   0.10s  the line draws itself out from the centre  (.fisio-line, scaleX 0 → 1)
 *   0.50s  the photo starts surfacing                 (.fisio-emerge, translateY 100% → rest)
 * On-load like the rest of the hero — NOT scroll-gated: the hero is on screen at
 * scroll 0, so an `at: 0, opacity: 0` reveal would leave it blank on arrival.
 *
 * ## The departure
 * On scroll the photo sinks back down and is re-swallowed by the same mask, while the
 * line stays put and dims. page.tsx keeps a small whole-group drift under both — DOM
 * nesting composes the two, so a part's travel ADDS to the group's.
 *
 * Two rules that shape the markup, both learned the hard way:
 *
 * - **one element per animation owner.** The scroll layer (an `<SDiv>` wrapper) and
 *   the entrance layer (a `<span>` with the CSS animation) are always separate
 *   elements. A filled (`both`) CSS animation outranks inline styles in the cascade
 *   permanently, so its `transform` would beat everything SDiv writes;
 * - **SDiv takes no `style`/`aria-*`.** Its props are the scroll window + `anim` +
 *   `className` and nothing else — anything else is dropped on the floor, silently
 *   (TS doesn't check JSX spreads or hyphenated attributes). So `aria-hidden` and any
 *   custom-property override live on the inner span.
 *
 * These SDivs carry no `index`: rendered inside the hero `<Section index={0}>` they
 * inherit it, like PadovaMap's rings inherit the domiciliare panel's.
 */

/** Scroll window (index-0 units) over which the portrait sinks back as the hero
 *  leaves. Must finish well inside the hero's ceiling (PANEL_END[0] = 1100 in
 *  page.tsx) or the beat never completes before the panel hands off. */
const DRIFT_START = 60;
const DRIFT_BUDGET = 420;
/** How far the photo sinks (px) — enough to read as "going back under", not so far
 *  that it clears the mask and leaves an empty box. */
const SINK = 70;

export default function HeroPortrait({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* THE MASK. Its bottom edge is the line: everything below is clipped, both on
          the way up (the entrance) and on the way back down (the scroll departure). */}
      <div className="overflow-hidden">
        <SDiv
          start={DRIFT_START}
          budget={DRIFT_BUDGET}
          anim={[
            { at: 0, y: 0, opacity: 1 },
            { at: 1, y: SINK, opacity: 0.5, ease: easeInCubic },
          ]}
        >
          {/* the span owns the entrance transform; no translate-* utility may go on it */}
          <span className="fisio-emerge block">
            <Image
              src="/fotoalessia.png"
              alt="Alessia Stefanello, fisioterapista"
              width={448}
              height={637}
              priority
              className="h-auto w-full object-cover"
            />
          </span>
        </SDiv>
      </div>

      {/* THE LINE — after the mask in the DOM so it paints over the clipped edge, and
          wider than the photo (`inset-x-[-6%]`) so it bleeds past it and reads as a
          drawn rule rather than the bottom border of a box. */}
      <SDiv
        start={DRIFT_START}
        budget={DRIFT_BUDGET}
        anim={[
          { at: 0, y: 0, opacity: 1 },
          { at: 1, y: 8, opacity: 0.25, ease: easeInCubic },
        ]}
        className="pointer-events-none absolute inset-x-[-6%] bottom-0"
      >
        <span
          aria-hidden="true"
          className="fisio-line block h-[2px] w-full origin-center bg-primary/70"
        />
      </SDiv>
    </div>
  );
}
