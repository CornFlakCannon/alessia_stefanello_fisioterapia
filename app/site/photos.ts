/**
 * The studio photos, as the site sees them.
 *
 * Every entry points at a WebP derivative in `public/foto/`, built once by
 * `scripts/crop-photos.mjs` from the camera originals in `FOTO_ORIGINALI/` (untracked —
 * they are 6000x4000 landscape files, ~35 MB, and the slabs are tall and narrow, so the
 * crop is chosen by hand there rather than left to `object-cover`).
 *
 * Re-casting a section is a one-line change HERE: every photo is built, not just the
 * ones currently placed. `position` feeds `object-position` for the cases where cover
 * still has to choose — a phone-width slab is much taller than 3:4.
 *
 * The hero is the exception and lives at the bottom of this file: it is a CUT-OUT with an
 * alpha channel, built by its own script (`scripts/hero-cutout.mjs`), and it ships in two
 * framings because the phone wants her face and the desktop wants her whole.
 *
 * `alt` is real alternative text, in Italian, describing the therapy — not the file.
 * The two textures are decorative and carry `alt: ""` on purpose.
 */

export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** `object-position`; omit for the default `50% 50%`. */
  position?: string;
};

export const PHOTOS = {
  /** Hand on the shoulder blade, patient from behind. No faces — the safest opener. */
  spalla: {
    src: "/foto/spalla.webp",
    width: 1200,
    height: 1600,
    alt: "Alessia guida un esercizio per la spalla, una mano sulla scapola della paziente",
    position: "55% 50%",
  },
  /** Manual therapy, lumbar, patient prone on the table. */
  manuale: {
    src: "/foto/manuale.webp",
    width: 1200,
    height: 1600,
    alt: "Terapia manuale sulla zona lombare, paziente prono sul lettino",
    position: "60% 50%",
  },
  /** Thoracic mobilisation, closer in. */
  manualeDorsale: {
    src: "/foto/manuale-dorsale.webp",
    width: 1200,
    height: 1600,
    alt: "Mobilizzazione della colonna dorsale",
  },
  /** Single-leg balance correction at the rack — the sportiest frame of the set. */
  equilibrio: {
    src: "/foto/equilibrio.webp",
    width: 1200,
    height: 1600,
    alt: "Correzione di un esercizio di equilibrio in appoggio monopodalico, in palestra",
  },
  /** Cervical manual therapy, side view. */
  cervicale: {
    src: "/foto/cervicale.webp",
    width: 1200,
    height: 1600,
    alt: "Trattamento manuale del tratto cervicale",
  },
  cervicaleLargo: {
    src: "/foto/cervicale-largo.webp",
    width: 1200,
    height: 1600,
    alt: "Trattamento manuale del tratto cervicale, inquadratura ampia dello studio",
  },
  /** The only natively portrait original. */
  spallaVerticale: {
    src: "/foto/spalla-verticale.webp",
    width: 1200,
    height: 1600,
    alt: "Mobilizzazione della spalla su un paziente disteso",
  },

  /** Explaining, crouched in front of the seated lady. */
  anzianiSpiega: {
    src: "/foto/anziani-spiega.webp",
    width: 1200,
    height: 1600,
    alt: "Alessia spiega un esercizio a una signora anziana seduta",
  },
  /** Both pairs of hands on the ball — the warmest of the three. */
  palla: {
    src: "/foto/palla.webp",
    width: 1200,
    height: 1600,
    alt: "Esercizio con la palla insieme a una signora anziana",
    position: "55% 50%",
  },
  /** Stepping onto the step, guided from the floor. The most dynamic. */
  step: {
    src: "/foto/step.webp",
    width: 1200,
    height: 1600,
    alt: "Alessia guida da terra una signora anziana che sale sullo step",
  },

  /** Manual therapy on the couch, she is standing and fully in frame. The pavimento
   *  pelvico slab had NO photo at all and still wore the drawn bridge exercise. */
  pelvico: {
    src: "/foto/pelvico.webp",
    width: 1200,
    height: 1600,
    alt: "Alessia Stefanello durante un trattamento di terapia manuale",
  },
  /** The couch and stool, empty: no patient, no consent to collect, and it reads as the
   *  second beat after the photo above — the gesture, then the place. */
  lettino: {
    src: "/foto/lettino.webp",
    width: 1200,
    height: 1600,
    alt: "Il lettino dello studio di fisioterapia a Padova",
  },

  /** Shot #4 of FOTO_BRIEF.md: she looks at the lens. Head and torso. */
  ritratto: {
    src: "/foto/ritratto.webp",
    width: 1200,
    height: 1600,
    alt: "Alessia Stefanello, fisioterapista",
  },
  /** Same frame, square, for the round crop in the formazione panel. */
  ritrattoTondo: {
    src: "/foto/ritratto-tondo.webp",
    width: 800,
    height: 800,
    alt: "Alessia Stefanello, fisioterapista",
  },

  /** The empty studio — a texture, never a subject. */
  studio: {
    src: "/foto/studio.webp",
    width: 1600,
    height: 1000,
    alt: "",
  },
} as const satisfies Record<string, Photo>;

/**
 * The hero portrait — a CUT-OUT, in two framings.
 *
 * Built by `scripts/hero-cutout.mjs`, which is where the interesting part is written up:
 * the source `HERO_PHOTO.png` only *looks* like a background-removal export (it is 100%
 * opaque, with the transparency checkerboard painted in), so the alpha is keyed back out
 * of it — safely, because that plate is perfectly neutral and brighter than anything she
 * is wearing, which the studio's grey-green wall was not.
 *
 * ## Why two files rather than one plus `object-position`
 * She is tall and narrow, and the phone hero is a different PICTURE, not a different crop
 * of the same one: the client asked for head and half torso, face first (NUOVA_TODO.md
 * §MOBILE/1), and then for that bust to carry three quarters of the screen. Getting there
 * from the 3:4 frame means throwing away ~75% of its height — art direction, which
 * `next/image` cannot express. Hence a `<picture>` with two sources in `HeroPortrait`, and
 * exactly one of them is ever fetched.
 *
 * ## Why the phone one is SQUARE, and why that is not a style choice
 * It is not laid out at its own ratio any more: the phone box has a fixed height and the
 * image fills it with `object-cover`. Cover crops whichever axis the container has to spare,
 * so a container WIDER than it is tall would crop the HEIGHT — her skull. Below `lg` that
 * includes tablets and any short desktop window. The source is therefore 1:1 and the box is
 * capped at `w-[min(100vw,74svh)]`, never wider than tall: container ratio <= source ratio,
 * so cover can only ever eat WIDTH (the shoulders, which is the point). Break either half of
 * that pair and she loses the top of her head on some device, silently.
 *
 * ## What replaced what
 * This used to be a `<video>` that played once on load (and before that a 27-frame
 * `ImageSequence`). Both existed to solve a problem that has now gone away: the source was
 * a clip on a wall that could not be keyed, so the background had to be composited at
 * build time and the whole thing shipped as opaque pixels. With a real alpha channel the
 * gold behind her is just the slab's own CSS colour — nothing to match, no seam to
 * measure, and the entrance is a plain CSS animation.
 *
 * ## She stands on WHITE, and the gold moved to the text half
 * The cut-out first shipped on the gold slab and wore a pale halo around the hair. It is
 * not an edge artefact and no matte tuning removes it: the pale pixels are the ~11k the
 * flood fill deliberately keeps INSIDE her (trouser and hair highlights), and eroding
 * three times over barely touches the count. What decides whether they read as a halo is
 * the ground — composited on gold the palest of them lands 83 levels ABOVE it, on white 29
 * below. So the hero's gold is now the text half and she stands on white, where the
 * leftovers are invisible by construction. See `scripts/hero-cutout.mjs`.
 *
 * `width`/`height` are the encodes' real pixels here (unlike the video's, which were only
 * the ratio): they reserve the box and feed `next/image`-style sizing. They drift by a
 * pixel when a framing is retuned, so the script PRINTS these two lines ready to paste.
 */
export const HERO_PHOTO = {
  /** Desktop: 3:4, cropped tight top and bottom so she is as large as the slab allows. */
  desktop: { src: "/foto/hero.webp", width: 1100, height: 1466 },
  /** Phone: 1:1, a BUST — crown to just under the shoulder line, shoulders running off both
   *  sides. Square because the box crops it in width; see above. */
  mobile: { src: "/foto/hero-mobile.webp", width: 960, height: 960 },
  alt: "Alessia Stefanello, fisioterapista",
} as const;
