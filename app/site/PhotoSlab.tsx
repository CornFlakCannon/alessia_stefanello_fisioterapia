'use client';

import { useMemo } from "react";
import { easeOutCubic } from "@/app/_scroll/easing";
import SDiv from "@/app/widgets/SDiv";
import DuotonePhoto from "./DuotonePhoto";
import type { Photo } from "./photos";
import { Stop } from "./useStops";

/**
 * The photographic ground of a `FocusPanel` slab: N studio photos, filtered with the
 * section colour, that dissolve one into the next with a slow ken-burns as you scroll.
 *
 * ## Why it stacks rather than cross-fades
 * Every photo is `absolute inset-0`, later ones later in the DOM, and each one only
 * fades IN — none fades out. A photo at full opacity completely covers the one beneath,
 * so there is never a frame where two half-transparent layers let the slab colour show
 * through as a dip in brightness. The cost is that all N stay in the tree; they are
 * 100-200 KB WebP, which is cheaper than the flicker.
 *
 * ## One photo, one block
 * The page moves in blocks (`StepScroller`), and every photo after the first IS one: a
 * gesture fades it in, and the scroll stops on it fully in. So this component registers
 * those stops itself — like `CvSheets` with its sheets, it is the only one that knows
 * when each photo has landed.
 *
 * That is the fix for the bug this shipped with: the panel had ONE stop at the end of
 * the run, so the gesture that brought the focus in also played every dissolve, and the
 * middle photo of three was on screen for a fraction of a second.
 *
 * The first photo is opaque at `at: 0` — the slab is on screen (desktop) or riding in
 * (phone) before the run starts, and must never be empty. It is what the slab wears
 * through the panel's earlier blocks, so the run (`start`) should begin once those have
 * played — on a service panel, when the focus is home.
 *
 * ## The windows
 * `start` → `end` is split into one block per photo AFTER the first. Photo i fades in
 * over exactly its block and is opaque at that block's end, where its stop is. Its scale
 * (the ken-burns) runs `KEN_SPAN` blocks, so it is still easing while the next one
 * arrives: two layers in motion at once is what keeps it from reading as a slideshow.
 * The first photo's ken-burns runs with the second's arrival.
 *
 * ## Placement
 * `absolute inset-0 z-0`, which resolves against the slab's PADDING box: it bleeds under
 * the slab's `px-8 py-16` and is clipped by the slab's own diagonal `clip-path`, for
 * free. The slab's text children need `relative z-10` to stay on top of it.
 */

/** Start scale of the ken-burns — small enough that the crop stays as framed. */
const KEN = 1.08;
/** A photo's ken-burns, in blocks: >1 keeps it moving under the next. */
const KEN_SPAN = 1.8;

export default function PhotoSlab({
  photos,
  tint,
  intensity,
  blend,
  start,
  end,
  sizes = "(min-width: 1024px) 55vw, 100vw",
}: {
  /** In story order; the first one is what the slab wears as it arrives. */
  photos: readonly Photo[];
  tint: "emphasis" | "primary" | "secondary";
  /** Dose of section colour over the photo — see DuotonePhoto. */
  intensity: number;
  /** Must match the slab's text colour: `multiply` under light text, `screen` under
   *  dark. DuotonePhoto explains why this is a contrast decision, not a taste one. */
  blend?: "multiply" | "screen";
  /** Section-local scroll window of the run: from where the second photo starts
   *  arriving to where the last is fully in. */
  start: number;
  end: number;
  sizes?: string;
}) {
  // Compiled once per anim identity inside SDiv, so keep these arrays stable.
  const layers = useMemo(() => {
    const block = (end - start) / Math.max(1, photos.length - 1);
    return photos.map((photo, i) => ({
      photo,
      // Photo i arrives during block i-1; the first one zooms alongside the second.
      start: start + Math.max(0, i - 1) * block,
      budget: block * KEN_SPAN,
      /** Where this photo is fully in — its stop. None for the first: it always is. */
      landed: i === 0 ? null : start + i * block,
      anim:
        i === 0
          ? [
              { at: 0, opacity: 1, scale: KEN },
              { at: 1, scale: 1, ease: easeOutCubic },
            ]
          : [
              { at: 0, opacity: 0, scale: KEN },
              { at: 1 / KEN_SPAN, opacity: 1, ease: easeOutCubic },
              { at: 1, scale: 1, ease: easeOutCubic },
            ],
    }));
  }, [photos, start, end]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      {layers.map((layer) => layer.landed !== null && <Stop key={layer.photo.src} at={layer.landed} />)}
      {layers.map((layer) => (
        <SDiv
          key={layer.photo.src}
          start={layer.start}
          budget={layer.budget}
          anim={layer.anim}
          className="absolute inset-0"
        >
          <DuotonePhoto
            photo={layer.photo}
            tint={tint}
            intensity={intensity}
            blend={blend}
            sizes={sizes}
            className="absolute inset-0"
          />
        </SDiv>
      ))}
    </div>
  );
}
