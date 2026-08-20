'use client';

import { useSyncExternalStore } from "react";

/**
 * "Are we on a desktop-width viewport?" — a render-time boolean, which the rest of this
 * site does not need and deliberately avoids.
 *
 * Every other desktop/phone difference here is pure CSS (`sm:` / `lg:`, plus the custom
 * height variant `short:`), and that is the right default: one responsive page, no
 * per-device coordinate sets. This hook exists for the one case CSS cannot reach —
 * `SDiv` writes its pose as an INLINE style, every frame, so a `lg:` class can never
 * override it. Deciding whether a scroll animation runs at all is therefore a JS
 * decision. `FocusPanel` is the only caller: its slab slides in on phones and is already
 * home on desktop.
 *
 * `1024px` is not a taste value — it is exactly where the slab becomes `lg:w-[55%]`, so
 * the JS branch and the CSS layout flip on the same pixel.
 *
 * `useSyncExternalStore` rather than an effect + state: the server snapshot is `false`,
 * so the markup React renders on the server and the markup it hydrates with agree, and
 * the desktop branch arrives in the first commit after hydration. Panels 1-3 are never on
 * screen at scroll 0 (the shell pins scrollTop to panel 0), so nothing is ever seen in the
 * phone pose on a desktop.
 */
const QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export default function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
