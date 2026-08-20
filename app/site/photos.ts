/**
 * The studio photos, as the site sees them.
 *
 * Every entry points at a WebP derivative in `public/foto/`, built once by
 * `scripts/crop-photos.mjs` from the camera originals in `FOTO_ORIGINALI/` (untracked —
 * they are 6000x4000 landscape files, ~35 MB, and the slabs are tall and narrow, so the
 * crop is chosen by hand there rather than left to `object-cover`).
 *
 * Re-casting a section is a one-line change HERE: all thirteen photos are built, not
 * just the seven currently placed. `position` feeds `object-position` for the cases
 * where cover still has to choose — a phone-width slab is much taller than 3:4.
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
 * The hero video: Alessia crosses her arms, once, when the page lands.
 *
 * Built by `scripts/hero-video.sh` from `FOTO_ORIGINALI/V1.mp4`. Two encodes of the same
 * 1080x1440 crop — the browser downloads whichever `<source>` it can play first, never
 * both. WebM/VP9 is 361 KB, the MP4/H.264 fallback 573 KB.
 *
 * This replaced a 27-frame `ImageSequence`, and the reason is worth keeping: that widget
 * needs a hand-written `frames` count to stay in step with the files on disk, with no
 * runtime check — and when it drifts, assigning a 404 URL to the live `<img>` throws away
 * the good frame that was showing and renders the broken-image icon. That is exactly how
 * this hero broke once. A video has no such number.
 *
 * `poster` is the first frame, so the gold slab is never briefly empty on a cold load.
 *
 * `width`/`height` express the **3:4 aspect**, not the encode's pixel size. They feed
 * `<video width height>`, whose only job is to reserve the right box before a byte of
 * video arrives (no layout shift) — and the ratio is invariant while the encode's real
 * resolution follows whatever the source was: 1080x1440 from the 4K original, 810x1080
 * from a 1080p one. Reading them as a claim about the file turns them into a maintenance
 * trap that needs editing every time the source changes; they are not that.
 */
export const HERO_VIDEO = {
  webm: "/hero/alessia.webm",
  mp4: "/hero/alessia.mp4",
  poster: "/hero/poster.webp",
  width: 1080,
  height: 1440,
  alt: "Alessia Stefanello, fisioterapista",
} as const;
