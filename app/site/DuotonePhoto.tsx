import Image from "next/image";
import type { Photo } from "./photos";

/**
 * A studio photo, filtered with a section colour.
 *
 * `FOTO_BRIEF.md` puts the photos INSIDE the coloured slabs, with the brand colour as a
 * passe-partout: the colour is what makes shots taken in different light, at different
 * distances, read as one family. This is that filter.
 *
 * ## How the duotone is made
 * Two layers over a desaturated photo, no SVG filters:
 *   1. a `mix-blend` layer of the section colour — multiply maps white to the colour and
 *      black to black, which IS a duotone: a true one-colour image, not a wash.
 *   2. a flat layer of the same colour, whose opacity is `intensity` — the dose. High
 *      intensity = mostly slab, the photo a texture under it; low = the photo carries it.
 *
 * `isolate` is load-bearing: without a stacking context the blend mixes with whatever is
 * painted behind the component, not just with its own photo.
 *
 * ## `blend` is a CONTRAST decision, not a taste one
 * Pick it from the colour of the text that will sit on top:
 *
 *   light text (white on fuchsia/blue) -> `multiply`. Multiply only ever DARKENS, so the
 *     composite can never be lighter than the flat slab colour: white text keeps at least
 *     the contrast it had against the bare slab, whatever the photo does. Measured on
 *     these photos: 6.49:1 floor on `bg-emphasis`, identical to the flat colour.
 *
 *   dark text (text-primary on gold) -> `screen`. The mirror argument: screen only ever
 *     LIGHTENS, so dark text keeps its floor. This one is not optional — gold multiplied
 *     by a photo goes brown, and dark blue on brown measured as low as 1.0:1, i.e.
 *     invisible. Screened, the same photos floor at 4.25:1 against the flat gold's 4.22:1.
 *
 * Get this backwards and the page still looks fine in a screenshot of the light frames
 * and becomes unreadable in the dark ones — which is exactly the bug a photo slideshow
 * hides, because the bad frame is only on screen for part of the scroll.
 *
 * ## Positioning
 * The root is `absolute inset-0`, and an abspos child resolves against its containing
 * block's PADDING box — so dropped into a `FocusPanel` slab it bleeds under the slab's
 * `px-8 py-16` and is clipped by the slab's own diagonal `clip-path`. Nothing to align.
 *
 * Always decorative from the page's point of view when used as a slab ground or a panel
 * texture: pass `alt: ""` in the manifest for those, real alt text for the ones that are
 * content (the portrait).
 */

const TINT = {
  emphasis: "bg-emphasis",
  primary: "bg-primary",
  secondary: "bg-secondary",
} as const;

export default function DuotonePhoto({
  photo,
  tint,
  intensity,
  blend = "multiply",
  sizes,
  priority = false,
  className = "",
}: {
  photo: Photo;
  /** Which brand colour filters the photo — the section's own. */
  tint: keyof typeof TINT;
  /** Opacity of the flat colour on top: 0 = photo only, 1 = flat slab. */
  intensity: number;
  /** `multiply` under light text, `screen` under dark text — see above. */
  blend?: "multiply" | "screen";
  /** `next/image` `sizes` — required, the image is `fill`. */
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const colour = TINT[tint];
  const mode = blend === "screen" ? "mix-blend-screen" : "mix-blend-multiply";
  return (
    <div className={`isolate overflow-hidden ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover [filter:grayscale(1)_contrast(1.05)]"
        style={photo.position ? { objectPosition: photo.position } : undefined}
      />
      <span aria-hidden="true" className={`absolute inset-0 ${mode} ${colour}`} />
      <span aria-hidden="true" className={`absolute inset-0 ${colour}`} style={{ opacity: intensity }} />
    </div>
  );
}
