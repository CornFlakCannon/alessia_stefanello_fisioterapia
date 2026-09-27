'use client';

import { useMemo } from "react";
import { easeOutCubic } from "@/app/_scroll/easing";
import SDiv from "@/app/widgets/SDiv";
import DuotonePhoto from "./DuotonePhoto";
import type { Photo } from "./photos";

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
 * ## The windows
 * The caller passes ONE window (`start`/`end`) — normally the window the panel already
 * had spare. Each photo gets `span / n` of it, but a `KEN_SPAN` multiplier stretches its
 * own budget past that share, so its scale is still easing while the next one arrives:
 * two layers in motion at once is what keeps it from reading as a slideshow.
 *
 * The first photo is opaque at `at: 0` — the slab is riding in from the right at that
 * moment and must never arrive empty.
 *
 * ## Placement
 * `absolute inset-0 z-0`, which resolves against the slab's PADDING box: it bleeds under
 * the slab's `px-8 py-16` and is clipped by the slab's own diagonal `clip-path`, for
 * free. The slab's text children need `relative z-10` to stay on top of it.
 */

/** Start scale of the ken-burns — small enough that the crop stays as framed. */
const KEN = 1.08;
/** Each photo's window, as a multiple of its share: >1 keeps it moving under the next. */
const KEN_SPAN = 1.8;
/** Share of a photo's own window spent fading in. */
const FADE = 0.32;

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
  /** Section-local scroll window the whole run occupies. */
  start: number;
  end: number;
  sizes?: string;
}) {
  // Compiled once per anim identity inside SDiv, so keep these arrays stable.
  const layers = useMemo(() => {
    const hold = (end - start) / photos.length;
    return photos.map((photo, i) => ({
      photo,
      start: start + i * hold,
      budget: hold * KEN_SPAN,
      anim:
        i === 0
          ? [
              { at: 0, opacity: 1, scale: KEN },
              { at: 1, scale: 1, ease: easeOutCubic },
            ]
          : [
              { at: 0, opacity: 0, scale: KEN },
              { at: FADE, opacity: 1, ease: easeOutCubic },
              { at: 1, scale: 1, ease: easeOutCubic },
            ],
    }));
  }, [photos, start, end]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
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
