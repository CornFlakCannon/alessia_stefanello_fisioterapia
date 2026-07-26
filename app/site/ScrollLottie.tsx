'use client';

import { useRef } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { DotLottie } from "@lottiefiles/dotlottie-web";
import { useSequenceProgress, type SequenceSpec } from "@/app/_scroll";

/** Live check (not cached) so a mid-session OS toggle is honored on the next tick. */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A scroll-scrubbed `.lottie` from /public.
 *
 * Mirrors {@link ImageSequence}: it maps this widget's normalized scroll progress
 * onto the animation's frame via `setFrame` (which seeks *and* renders), so scrolling
 * scrubs it forward and reversing rewinds it. Inherits its gating section / scroll
 * origin from the enclosing `<Section>` (see `useSection`), so `start`/`end` are
 * section-local scroll units. Decorative → `aria-hidden` + no pointer events; under
 * `prefers-reduced-motion` it holds the settled (final) frame instead of scrubbing.
 *
 * `white` renders it as a flat WHITE silhouette (the player's canvas is colour-nuked
 * with `brightness(0) invert(1)` — alpha is preserved, so anti-aliased edges stay
 * clean regardless of the animation's own colours). Use it on dark grounds (the
 * Olimpiadi berry slab); leave it off to keep the animation's native colours.
 */
export default function ScrollLottie({
  src,
  white = false,
  index,
  start,
  end,
  budget,
  className,
}: SequenceSpec & { src: string; white?: boolean; className?: string }) {
  const dl = useRef<DotLottie | null>(null);
  const lastFrame = useRef(-1);

  useSequenceProgress({ index, start, end, budget }, (p) => {
    const inst = dl.current;
    if (!inst || !inst.isLoaded) return; // not loaded yet → nothing to scrub
    const t = prefersReducedMotion() ? 1 : p; // reduced motion → hold the end pose
    const frame = t * (inst.totalFrames - 1);
    if (Math.abs(frame - lastFrame.current) < 0.5) return; // skip sub-frame churn
    inst.setFrame(frame);
    lastFrame.current = frame;
  });

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${white ? "[filter:brightness(0)_invert(1)]" : ""} ${className ?? ""}`}
    >
      <DotLottieReact
        src={src}
        autoplay={false}
        loop={false}
        className="h-full w-full"
        dotLottieRefCallback={(inst) => {
          dl.current = inst ?? null;
        }}
      />
    </div>
  );
}
