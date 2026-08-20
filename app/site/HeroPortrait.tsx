/**
 * The hero portrait — Alessia, cut out, standing on the gold slab.
 *
 * ## What it is
 * A single still with a real alpha channel (see `HERO_PHOTO` in photos.ts and the script
 * that keys it). There is no background in the file, so what sits behind her IS the
 * slab's own CSS gold: nothing to colour-match, no seam to measure. That is the whole
 * reason this stopped being a `<video>` — the old source was a clip on a wall that could
 * not be keyed, so its background had to be composited in at build time and then made to
 * agree with `--brand-secondary` to within a level or two.
 *
 * ## `<picture>`, and why not `next/image`
 * The phone gets a DIFFERENT PICTURE, not a different crop: head and half torso, face
 * first (the client's own words). That is art direction — a media-conditioned source —
 * and `next/image` has no way to express it. `<picture>` does, and fetches exactly one of
 * the two. The derivatives are already sized and encoded for their slots by our own
 * script, so the optimiser has nothing left to add here.
 *
 * `width`/`height` sit on BOTH the `<source>` and the `<img>` because the two framings
 * have different ratios (3:4 and 4:5); without them the desktop branch would reserve the
 * phone's box and shift on load.
 *
 * ## The motion is on load, and it is CSS
 * Panel 0 is on screen at scroll 0, so its entrance can never be a scroll-gated reveal —
 * it would arrive blank. The photo rides in with the gold slab (`.fisio-slide-in`, owned
 * by the slab in page.tsx) and then lifts off it: `.fisio-lift` grows her to 1.1 and
 * turns on a `drop-shadow`. `drop-shadow` and not `box-shadow` — a cut-out's box is
 * mostly transparent, so a box shadow would draw a rectangle in mid-air around her.
 *
 * `origin-bottom` under `lg` is load-bearing: on phones the slab's bottom edge IS this
 * photo's bottom edge (the gold/white boundary), and a centred scale would push her hard
 * cut-off 5% past it, onto the white. Growing upward keeps her planted on the band.
 *
 * The animation lives on the `<img>` itself, which is never an `SDiv` — a filled (`both`)
 * CSS animation outranks inline styles permanently, so it would beat anything the scroll
 * layer writes. The scroll layer's drift is on the wrapper in page.tsx; DOM nesting
 * composes the two.
 */
import { HERO_PHOTO } from "./photos";

export default function HeroPortrait({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <picture>
        <source
          media="(min-width: 1024px)"
          srcSet={HERO_PHOTO.desktop.src}
          width={HERO_PHOTO.desktop.width}
          height={HERO_PHOTO.desktop.height}
        />
        {/* A bare <img>, and lint is fine with it: `no-img-element` exempts one inside
            a <picture>, which is exactly the art-direction case next/image cannot cover. */}
        <img
          src={HERO_PHOTO.mobile.src}
          alt={HERO_PHOTO.alt}
          width={HERO_PHOTO.mobile.width}
          height={HERO_PHOTO.mobile.height}
          fetchPriority="high"
          decoding="async"
          className="fisio-lift block h-auto w-full origin-bottom lg:origin-center"
        />
      </picture>
    </div>
  );
}
