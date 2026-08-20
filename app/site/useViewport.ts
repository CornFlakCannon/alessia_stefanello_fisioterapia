'use client';

import { useSyncExternalStore } from "react";

/**
 * Viewport questions answered as render-time BOOLEANS — which the rest of this site does
 * not need and deliberately avoids.
 *
 * Every other desktop/phone difference here is pure CSS (`sm:` / `lg:`, plus the custom
 * height variant `short:`), and that is the right default: one responsive page, no
 * per-device coordinate sets. This hook exists for the one case CSS cannot reach —
 * `SDiv` writes its pose as an INLINE style, every frame, so a `lg:` class can never
 * override it. Deciding whether a scroll animation runs at all is therefore a JS
 * decision. `FocusPanel` is the only caller: its slab slides in on phones and is already
 * home on desktop.
 *
 * Neither query is a taste value, and neither is a duplicate of a Tailwind breakpoint for
 * its own sake — each mirrors one exactly, so the JS branch and the CSS layout flip on the
 * same pixel:
 *   `useIsDesktop`  `lg` (1024px), where the focus slab becomes `lg:w-[55%]`;
 *   `useIsShort`    the custom `short` variant (max-height 740px), the site's "this screen
 *                   cannot afford the usual vertical budget" line.
 *
 * `useSyncExternalStore` rather than an effect + state: the server snapshot is `false` for
 * both, so the markup React renders on the server and the markup it hydrates with agree,
 * and the real answer arrives in the first commit after hydration. Nothing that branches on
 * these is on screen at scroll 0 (the shell pins scrollTop to panel 0), so the server pose
 * is never seen.
 */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** ≥ `lg`. Its one job is gating `SDiv` animations, which write inline styles no `lg:`
 *  class can override — never reach for it to do layout CSS can already do. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/** The `short` variant, in JS. Same purpose: a decision CSS cannot express — here how many
 *  CV entries fit on one sheet, which is a question about available HEIGHT. */
export function useIsShort(): boolean {
  return useMediaQuery("(max-height: 740px)");
}
