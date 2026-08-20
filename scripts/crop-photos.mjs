/**
 * One-shot derivative builder for the studio photos (the camera JPEGs).
 *
 * The hero is NOT here — it is an alpha cut-out with its own script and its own reasons,
 * scripts/hero-cutout.mjs. `npm run photos` runs both.
 *
 * The originals are 6000x4000 landscape camera files (~35 MB total) living OUTSIDE the
 * repo, in FOTO_ORIGINALI/. The site needs small, already-cropped WebP: the slabs are
 * tall and narrow, so `object-cover` on a landscape source would crop blind and cut
 * heads off. Every frame is therefore chosen here, once, by hand.
 *
 *   node scripts/crop-photos.mjs          # or: npm run photos
 *
 * `crop` is in ORIGINAL pixels, {left, top, width, height}. It is the only knob: if a
 * framing looks wrong on the page, move the numbers on that one line and re-run. The
 * ratio of the crop is what the output ratio will be — keep 3:4 (e.g. 3000x4000) for
 * anything that goes in a slab, 16:10 for the background textures.
 *
 * All of them are built, not just the ones currently placed: re-casting a section is
 * then one line in app/site/photos.ts rather than a re-run of this script.
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "FOTO_ORIGINALI");
const OUT = join(ROOT, "public", "foto");

/** Slab photos: 3:4 vertical, 1200x1600 out. Textures: 16:10, WIDE px across.
 *  WIDE is 2200 because a texture is a FULL-PANEL background: at 1600 it would be
 *  upscaled 1.2x on a 1900px screen and 1.6x on a 2560px one. */
const TALL = 1200;
const WIDE = 2200;

/** Default WebP quality. A photo can override it with `q` — see `lettino`. */
const Q = 82;

const PHOTOS = [
  // --- muscoloscheletrico / sport -------------------------------------------------
  // Hand on the shoulder blade, patient seen from behind at the rack. No faces at all,
  // which is why it opens the fuchsia slab: zero privacy friction.
  { id: "spalla", src: "DIS4523.jpg", crop: { left: 600, top: 0, width: 3000, height: 4000 }, w: TALL },
  // Manual therapy, lumbar, patient prone.
  { id: "manuale", src: "DIS4563.jpg", crop: { left: 1125, top: 0, width: 3000, height: 4000 }, w: TALL },
  // Thoracic mobilisation, closer in.
  { id: "manuale-dorsale", src: "DIS4572.jpg", crop: { left: 900, top: 0, width: 3000, height: 4000 }, w: TALL },
  // Single-leg balance correction in the gym — the sportiest frame of the set.
  { id: "equilibrio", src: "DIS4500.jpg", crop: { left: 2400, top: 300, width: 2400, height: 3200 }, w: TALL },
  // Cervical manual therapy, side view.
  { id: "cervicale", src: "DIS4641.jpg", crop: { left: 600, top: 0, width: 3000, height: 4000 }, w: TALL },
  // Same gesture, wider frame (5232x3488 original — note the different height).
  { id: "cervicale-largo", src: "DIS4646.jpg", crop: { left: 400, top: 0, width: 2616, height: 3488 }, w: TALL },
  // The only natively PORTRAIT shot (4000x6000): shoulder mobilisation, she is smiling.
  { id: "spalla-verticale", src: "DIS4659.jpg", crop: { left: 0, top: 400, width: 4000, height: 5333 }, w: TALL },

  // --- anziani / domiciliare ------------------------------------------------------
  // Explaining, crouched in front of the seated lady.
  { id: "anziani-spiega", src: "DIS4577.jpg", crop: { left: 1530, top: 0, width: 3000, height: 4000 }, w: TALL },
  // Both pairs of hands on the ball — the warmest of the three.
  { id: "palla", src: "DIS4583.jpg", crop: { left: 1470, top: 0, width: 3000, height: 4000 }, w: TALL },
  // Stepping onto the step, guided from the floor. The most dynamic.
  { id: "step", src: "DIS4599.jpg", crop: { left: 1815, top: 0, width: 3000, height: 4000 }, w: TALL },

  // --- pavimento pelvico ----------------------------------------------------------
  // Terapia manuale sul lettino, lei in piedi e in campo per intero: la fascia blu del
  // pavimento pelvico non aveva NESSUNA foto e teneva ancora il disegno animato.
  { id: "pelvico", src: "PELVICO_CROPPATA.jpg", crop: { left: 1870, top: 0, width: 3000, height: 4000 }, w: TALL },
  // Lo studio col lettino, vuoto: nessun paziente, nessun consenso da chiedere, e fa da
  // secondo tempo alla foto sopra (il gesto, poi il luogo).
  // `q` piu' basso solo qui: il pavimento piastrellato e' dettaglio ad alta frequenza e a
  // 82 pesava 343 KB, il doppio di ogni altra. Va sotto un duotone desaturato e tinto al
  // 42%, quindi quel dettaglio non arriva comunque allo schermo — 70 lo riporta a 177 KB,
  // in linea con le altre. Alzalo se un giorno la foto dovesse comparire non filtrata.
  { id: "lettino", src: "LETTINO.jpg", crop: { left: 1600, top: 0, width: 3000, height: 4000 }, w: TALL, q: 70 },

  // --- ritratto e ambiente --------------------------------------------------------
  // Shot #4 of FOTO_BRIEF.md: she looks at the lens, white ground. Tight on head+torso.
  { id: "ritratto", src: "DIS4477.jpg", crop: { left: 1650, top: 150, width: 2700, height: 3600 }, w: TALL },
  // Same frame, square, for the round crop in the formazione panel.
  { id: "ritratto-tondo", src: "DIS4477.jpg", crop: { left: 1900, top: 250, width: 2200, height: 2200 }, w: 800 },
  // The empty studio — the ground of the contatti panel (never a subject).
  { id: "studio", src: "DIS4470.jpg", crop: { left: 0, top: 125, width: 6000, height: 3750 }, w: WIDE },
];

await mkdir(OUT, { recursive: true });

let total = 0;
for (const { id, src, crop, w, q = Q } of PHOTOS) {
  const dest = join(OUT, `${id}.webp`);
  const { size } = await sharp(join(SRC, src))
    .extract(crop)
    .resize(w)
    .webp({ quality: q })
    .toFile(dest);
  total += size;
  const h = Math.round((crop.height / crop.width) * w);
  console.log(`${id.padEnd(18)} ${String(w).padStart(4)}x${String(h).padEnd(4)} ${(size / 1024).toFixed(0).padStart(4)} KB  <- ${src}`);
}
console.log(`\n${PHOTOS.length} files, ${(total / 1024 / 1024).toFixed(2)} MB total`);
