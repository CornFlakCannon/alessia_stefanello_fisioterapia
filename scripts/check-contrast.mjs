/**
 * WCAG contrast on a photographic ground, measured instead of guessed.
 *
 *   node scripts/check-contrast.mjs
 *
 * The contatti panel puts text over a studio photo. That is a contrast problem with no
 * single answer — the ground is a different colour in every pixel — so the only honest
 * number is the WORST one: the darkest (or lightest) pixel any glyph could land on.
 * Eyeballing it fails in a specific, nasty way: the panel looks fine, and simply stops
 * being readable for anyone who needs the contrast.
 *
 * This rebuilds the exact stack the browser composites, in the same order:
 *
 *   1. the photo, `grayscale(1) contrast(1.05)`          (DuotonePhoto)
 *   2. `mix-blend-multiply` with the tint                (DuotonePhoto)
 *   3. a flat tint layer at `intensity`                  (DuotonePhoto)
 *   4. all of the above at `opacity` over the panel      (PanelTexture)
 *   5. optionally a translucent card over that           (page.tsx)
 *
 * then reports, for each text colour, the ratio against the worst pixel it could sit on.
 * 4.5:1 is the AA floor for body text; 3:1 for large text (>=24px, or >=19px bold).
 *
 * Change a dose in page.tsx, re-run this, paste the table into the docblock there.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const TINT = { primary: [0x00, 0x4e, 0x8f], secondary: [0xe7, 0x9e, 0x33], emphasis: [0xb3, 0x12, 0x70] };
const INK = [0x14, 0x21, 0x2e];
const PRIMARY = TINT.primary;
const WHITE = [255, 255, 255];

const srgb = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** `color-mix`-free alpha compositing: `over` at `a` on top of `under`. */
const over = (top, a, under) => top.map((c, i) => c * a + under[i] * (1 - a));

/**
 * Every pixel of the finished ground, as the browser would paint it.
 * @param photo  path under public/
 * @param tint   key of TINT
 * @param intensity  DuotonePhoto's flat-colour dose
 * @param opacity    PanelTexture's dose of the whole duotone over the panel
 * @param ground     the panel's own background
 * @param card       [colour, alpha] of a panel laid over it, or null
 */
async function groundPixels({ photo, tint, intensity, opacity, ground, card }) {
  const t = TINT[tint];
  // step 1: the CSS filter chain, applied the way the browser does (luma, then contrast
  // about the 0.5 midpoint)
  const { data, info } = await sharp(join(ROOT, "public", photo))
    .grayscale()
    .linear(1.05, -(0.5 * 1.05 - 0.5) * 255)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = [];
  for (let i = 0; i < data.length; i += info.channels) {
    const g = data[i];
    // 2 · multiply, 3 · flat tint at `intensity`
    let px = [0, 1, 2].map((k) => (g * t[k]) / 255);
    px = over(t, intensity, px);
    // 4 · the whole layer at `opacity` over the panel ground
    px = over(px, opacity, ground);
    // 5 · the card
    if (card) px = over(card[0], card[1], px);
    out.push(px);
  }
  return out;
}

/** Worst-case ratio of `text` (optionally at `alpha` over the ground) across the ground. */
function worst(pixels, text, alpha = 1) {
  let min = Infinity, at = null;
  for (const bg of pixels) {
    const fg = alpha === 1 ? text : over(text, alpha, bg);
    const r = ratio(fg, bg);
    if (r < min) { min = r; at = bg; }
  }
  return { min, at: at.map((c) => Math.round(c)) };
}

const SWEEP = process.argv[2] === "--sweep";
const CASES = SWEEP ? [0.45, 0.55, 0.65, 0.75, 0.85].flatMap((op) => [0.9, 0.85, 0.8].map((ca) => ({
  label: `sweep · texture ${op} · card ${ca}`,
  ground: { photo: "foto/studio.webp", tint: "primary", intensity: 0.2, opacity: op, ground: WHITE, card: [WHITE, ca] },
  texts: [["placeh.  text-ink/70", INK, 0.7], ["heading  text-primary", PRIMARY, 1]],
}))) : [
  {
    label: "contatti · sulla card",
    ground: { photo: "foto/studio.webp", tint: "primary", intensity: 0.2, opacity: 0.75, ground: WHITE, card: [WHITE, 0.85] },
    texts: [
      ["heading  text-primary", PRIMARY, 1],
      ["body     text-ink/90", INK, 0.9],
      ["input    text-ink", INK, 1],
      ["placeh.  text-ink/70", INK, 0.7],
      ["eyebrow  text-primary", PRIMARY, 1],
    ],
  },
  {
    label: "contatti · fuori dalla card (nessun testo, solo controllo)",
    ground: { photo: "foto/studio.webp", tint: "primary", intensity: 0.2, opacity: 0.75, ground: WHITE, card: null },
    texts: [["heading  text-primary", PRIMARY, 1]],
  },
  {
    label: "formazione · texture 0.08",
    ground: { photo: "foto/cervicale-largo.webp", tint: "primary", intensity: 0.2, opacity: 0.08, ground: [0xee, 0xf5, 0xfb], card: null },
    texts: [
      ["heading  text-primary", PRIMARY, 1],
      ["body     text-ink/90", INK, 0.9],
      ["place    text-ink/70", INK, 0.7],
    ],
  },
];

for (const c of CASES) {
  const px = await groundPixels(c.ground);
  console.log(`\n${c.label}`);
  for (const [name, colour, alpha] of c.texts) {
    const { min, at } = worst(px, colour, alpha);
    const verdict = min >= 4.5 ? "AA" : min >= 3 ? "AA large only" : "FAIL";
    console.log(`  ${name.padEnd(24)} ${min.toFixed(2)}:1  (worst ground rgb ${at.join(",")})  ${verdict}`);
  }
}
