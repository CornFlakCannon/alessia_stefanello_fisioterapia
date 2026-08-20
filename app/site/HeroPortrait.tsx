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
 * ## She stands on the bottom edge of the screen
 * On desktop the portrait is bottom-anchored, not centred: the source is cut across her
 * thighs, and butting that cut against the fold turns it from a crop into a BASE — she
 * continues past the frame instead of ending in mid-air. Everything about her size follows
 * from that (see the cap in page.tsx), and it is also why the scroll drift moves her DOWN
 * rather than up: lifting a bottom-anchored figure opens a strip of white under her feet.
 *
 * ## The motion is on load, and it is CSS
 * Panel 0 is on screen at scroll 0, so its entrance can never be a scroll-gated reveal —
 * it would arrive blank. She simply rides in with her slab (`.fisio-slide-in`, owned by
 * the slab in page.tsx); the portrait itself carries no animation of its own, which is
 * also why nothing here fights the scroll layer (a filled `both` CSS animation outranks
 * inline styles permanently, so it would beat whatever `SDiv` writes).
 *
 * There WAS one: `.fisio-lift` grew her to 1.1 and switched on a `drop-shadow`, so she
 * read as sitting ON the page. Both are gone — the shadow because the client asked, and
 * the scale with it. A final overshoot is in direct conflict with a portrait that is
 * bottom-anchored and sized to fill its half: her resting size would have to be 10% under
 * the space she is meant to occupy. Dropping it is what pays for the extra 10%.
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
          className="block h-auto w-full"
        />
      </picture>
    </div>
  );
}
