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
 * The phone gets a DIFFERENT PICTURE, not a different crop: a bust, face first (the client's
 * own words). That is art direction — a media-conditioned source — and `next/image` has no
 * way to express it. `<picture>` does, and fetches exactly one of the two. The derivatives
 * are already sized and encoded for their slots by our own script, so the optimiser has
 * nothing left to add here.
 *
 * `width`/`height` sit on BOTH the `<source>` and the `<img>` because the two framings
 * have different ratios (3:4 and 1:1); without them the desktop branch would reserve the
 * phone's box and shift on load.
 *
 * ## The two branches size themselves in OPPOSITE ways, and the classes say so
 * On desktop the box is width-driven and the image keeps its own height (`lg:h-auto`): she
 * is a figure standing in a slab. On phones the box has a FIXED HEIGHT — a 74svh band across
 * the whole viewport — and the image fills it (`max-lg:h-full max-lg:object-cover`), so her
 * shoulders run off both sides. That is what the client asked for and it is why the phone
 * source is a bust.
 *
 * It is also the one thing here that can fail silently. `object-cover` crops whichever axis
 * the container has spare, so a container WIDER than it is tall would crop the HEIGHT — the
 * top of her head. Below `lg` sit tablets and short desktop windows (900x600 is ratio 2.03),
 * so the guarantee cannot be "phones are portrait". It is arithmetic instead, and it takes
 * two halves that must be kept in step: the source is 1:1 (`MOB_RATIO` in
 * `scripts/hero-cutout.mjs`) and the box is capped at `w-[min(100vw,74svh)]` in `page.tsx`,
 * i.e. never wider than it is tall. Container ratio <= source ratio ⇒ cover can only eat
 * WIDTH. Every device therefore sees the vertical composition the script chose — the air
 * over her crown, the cut under the shoulders — and differs only in how much shoulder is
 * left. Change either half alone and she is decapitated somewhere you are not looking.
 *
 * ## She stands on the bottom edge of the screen
 * On desktop the portrait is bottom-anchored, not centred: the source is cut across her
 * thighs, and butting that cut against the fold turns it from a crop into a BASE — she
 * continues past the frame instead of ending in mid-air. Everything about her size follows
 * from that (see the cap in page.tsx), and it is also why the scroll drift moves her DOWN
 * rather than up: lifting a bottom-anchored figure opens a strip of white under her feet,
 * while sinking pushes the cut past the fold where nothing shows.
 *
 * On phones she does not move at all, and for a different reason: there the gold is a CARD
 * that rises over her as you scroll (`SHEET_RISE` in page.tsx), so the motion in that half
 * of the screen is already spoken for. Her bottom edge is the card's berry rule at rest, and
 * by the end of the panel that rule has climbed to about her neck — the card's content is
 * what decides where it stops, not her. Adding a drift on top of that would be two things
 * moving against each other, so `HERO_DRIFT` is desktop-only.
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
    /* `max-lg:h-full` HERE and on the <picture> below, not only on the <img>: on phones the
       height has to stay DEFINITE all the way down from the 74svh band in page.tsx, and a
       percentage height resolves against the nearest block container — one link in the chain
       left at `auto` and every link below it computes to auto too, so the image falls back to
       its intrinsic square and leaves a third of the band empty. The <picture> also needs
       `block`: an inline box in the middle breaks the chain the same way. On desktop every
       ancestor is auto-height, so all of these compute to auto and change nothing. */
    <div className={`relative max-lg:h-full ${className}`}>
      <picture className="block max-lg:h-full">
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
          /* h-auto on desktop, cover inside a fixed-height band on phones — see the
             docblock: the square source and page.tsx's width cap are what make the
             second one safe. */
          className="block w-full max-lg:h-full max-lg:object-cover lg:h-auto"
        />
      </picture>
    </div>
  );
}
