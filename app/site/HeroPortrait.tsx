'use client';

import { useEffect, useRef } from "react";
import { easeInCubic } from "../_scroll/easing";
import SDiv from "../widgets/SDiv";
import { HERO_VIDEO } from "./photos";

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
 * ## The photo is a video, and it plays itself
 * Alessia crosses her arms once, on a clock, `PLAY_DELAY` after the page lands — NOT
 * scrubbed by scroll. That is the same rule the rest of the hero already follows: this
 * panel is on screen at scroll 0, so its motion is authored on load.
 *
 * The delay is not arbitrary — it is where `.fisio-emerge` finishes (0.5s delay + 0.9s
 * duration), so the three beats run in sequence rather than on top of each other:
 * the line draws itself, the photo surfaces, then she moves.
 *
 * Why not the `autoplay` attribute: it would fire the moment the element is ready, which
 * is mid-entrance. Calling `play()` from an effect puts the timing under our control, and
 * a MUTED video is allowed to play from script by every browser's autoplay policy — the
 * `muted` attribute below is load-bearing, not decoration (the encodes also carry no
 * audio track at all).
 *
 * No `loop`: the video stops on its last frame and stays there, which is the composed
 * arms-crossed pose. That pose is the hero's resting state.
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
 *  that it clears the mask and leaves an empty box. Authored in px against the DESKTOP
 *  size, so it tracks the `lg:w-[min(...)]` cap in page.tsx: at ~723px tall that is ~15%
 *  of the photo, the same fraction the original 70 was against the old 448. */
const SINK = 110;
/** ms after mount before the video starts.
 *
 *  Not "when the entrance ends" — that left a dead beat. The clip's own first 400ms is
 *  her standing still (measured: the arms start at frame 10 of 25fps), and `.fisio-emerge`
 *  runs 500→1400ms. Starting at 1400 therefore meant she surfaced, held motionless for
 *  400ms, and only then moved.
 *
 *  1000 aligns the two: the video starts mid-rise, its still opening covers the tail of
 *  the emerge, and her arms begin at 1000+400 = 1400 — the exact instant she is fully up.
 *  Lower it to overlap the two motions, raise it to reintroduce the pause. */
const PLAY_DELAY = 1000;

/** Live check (not cached) so a mid-session OS toggle is honored — same shape as the one
 *  in ScrollLottie.tsx. Nothing in app/_scroll or app/widgets looks at this media query,
 *  so anything that moves on its own has to ask here. */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function HeroPortrait({ className = "" }: { className?: string }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    if (!el) return;

    // Belt and braces: React does not reliably reflect the `muted` JSX prop onto the DOM
    // property, and an unmuted video has its play() rejected by autoplay policy.
    el.muted = true;

    // Reduced motion: never play. Park on the LAST frame rather than the first, so what
    // is shown is the composed arms-crossed pose the animation was heading for — the
    // still portrait, not an interrupted one.
    if (prefersReducedMotion()) {
      const settle = () => {
        // a hair off the end: seeking exactly to duration can land past the last frame
        el.currentTime = Math.max(0, (el.duration || 0) - 0.05);
      };
      if (el.readyState >= 1) settle();
      else el.addEventListener("loadedmetadata", settle, { once: true });
      return;
    }

    const id = window.setTimeout(() => {
      // muted ⇒ allowed by autoplay policy; the rejection can still happen (e.g. the tab
      // was never foregrounded) and is not worth surfacing — the poster stands in.
      void el.play().catch(() => {});
    }, PLAY_DELAY);
    return () => window.clearTimeout(id);
  }, []);

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
            {/* `width`/`height` are the encode's real pixels, so the box reserves its own
                3:4 space before a byte of video arrives — no layout shift, and no wrapper
                imposing an aspect. `role="img"` because this is a silent, controlless
                portrait that happens to move: it should be announced once, as her photo. */}
            <video
              ref={video}
              width={HERO_VIDEO.width}
              height={HERO_VIDEO.height}
              poster={HERO_VIDEO.poster}
              muted
              playsInline
              preload="auto"
              role="img"
              aria-label={HERO_VIDEO.alt}
              className="block h-auto w-full"
            >
              <source src={HERO_VIDEO.webm} type="video/webm" />
              <source src={HERO_VIDEO.mp4} type="video/mp4" />
            </video>
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
