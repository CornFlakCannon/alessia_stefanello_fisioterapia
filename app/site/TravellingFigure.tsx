'use client';

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import SDiv from "@/app/widgets/SDiv";
import type { Keyframe } from "@/app/widgets/anim";
import HeroFigure from "./HeroFigure";

/** Hydration gate (same trick as ContactBar/DevHud): render the portal only on the
 *  client so the server render and first client render agree (both null). */
const NEVER = () => () => {};

/**
 * A viewport-fixed stickman that follows the scroll down the whole page.
 *
 * Its only animation is a `rawAnim` (SDiv's global-scroll layer, ungated by section),
 * so one figure animates continuously across every panel. Portaled to <body> (like
 * ContactBar) so it's pinned to the viewport yet still reads the scroll store through
 * React context. Decorative → `aria-hidden` (already on HeroFigure) + no pointer
 * events, so it never blocks the UI beneath it. Desktop only (`lg+`); hidden under
 * `prefers-reduced-motion` via the `.fisio-travel` rule in globals.css.
 */
export default function TravellingFigure({ journey }: { journey: Keyframe[] }) {
  const mounted = useSyncExternalStore(NEVER, () => true, () => false);
  if (!mounted) return null;

  return createPortal(
    <SDiv
      rawAnim={journey}
      className="fisio-travel pointer-events-none fixed bottom-10 left-6 z-40 hidden w-24 lg:block lg:w-28"
    >
      <HeroFigure className="h-auto w-full" stroke="var(--brand-primary)" />
    </SDiv>,
    document.body,
  );
}
