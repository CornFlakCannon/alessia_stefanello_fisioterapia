/**
 * Fill the interior holes of a difference-derived matte sequence, and report on it.
 *
 *   node scripts/fill-matte.mjs <dir>
 *
 * Called by scripts/hero-video.sh; not useful on its own.
 *
 * ## Why this exists
 * The matte comes from differencing the original clip against the background-replaced one
 * (see hero-video.sh). Blurring both before the difference kills most false positives,
 * but a few stubborn ones survive in high-contrast facial detail — on the test frame, a
 * gold blob straight across one eyebrow, because that patch happens to compress
 * differently in the two encodes.
 *
 * Those false positives are all INTERIOR: they sit inside her silhouette. So instead of
 * tuning a threshold until they disappear (and taking the real edge with them), flood
 * fill the *background* inward from the frame border. Whatever the fill cannot reach is
 * enclosed by subject and is therefore subject. No parameter to tune, and it cannot eat
 * the silhouette edge because the fill only ever travels through background.
 *
 * ## What it prints, and how to read it
 * The failure mode of a difference matte is a FLICKERING outline — the contour breathing
 * a pixel between frames, invisible in a still and obvious in motion. Detecting it needs
 * the right metric, and the obvious one is wrong: frame-to-frame change in silhouette
 * area is dominated by her actually moving (her area grows 39.6% -> 47.9% of the frame as
 * she crosses her arms, and fast arm motion swings it several percent in one frame).
 *
 * What separates the two is the SIGN. Real movement drifts coherently — consecutive
 * changes keep their direction. Flicker oscillates, so the derivative keeps flipping sign.
 * On this footage the inversion rate is 18%; a matte that jitters would sit near 50%.
 *
 * Recovered pixels are reported for information only, deliberately without a verdict:
 * motion-blurred arms legitimately get large fills (3.3% on one frame here, correctly),
 * so a spike there means "look at it", not "it is broken".
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const dir = process.argv[2];
if (!dir) {
  console.error("uso: node scripts/fill-matte.mjs <dir>");
  process.exit(2);
}

/** Share of sign inversions in the area derivative above which the outline is jittering
 *  rather than moving. Coherent motion stays well under this; ~50% is pure noise. */
const FLICKER_LIMIT = 0.35;

const files = (await readdir(dir)).filter((f) => f.endsWith(".png")).sort();
if (!files.length) {
  console.error(`  nessun PNG in ${dir}`);
  process.exit(2);
}

const areas = [];
let worstHole = { share: 0, file: null };

for (const file of files) {
  const path = join(dir, file);
  const { data, info } = await sharp(path).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;

  // Flood fill the background inward from every border pixel. Iterative, with an explicit
  // stack — 1080x1440 would blow the call stack recursively.
  const reached = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) {
    stack.push(x, (H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    stack.push(y * W, y * W + W - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    if (reached[i] || data[i] > 127) continue; // >127 is already subject; the fill stops
    reached[i] = 1;
    const x = i % W;
    const y = (i / W) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W);
    if (y < H - 1) stack.push(i + W);
  }

  const out = Buffer.alloc(W * H);
  let recovered = 0;
  let area = 0;
  for (let i = 0; i < W * H; i++) {
    const subject = data[i] > 127 || !reached[i];
    if (subject) {
      area++;
      if (data[i] <= 127) recovered++;
    }
    out[i] = subject ? 255 : 0;
  }
  await sharp(out, { raw: { width: W, height: H, channels: 1 } }).png().toFile(path);

  areas.push(area);
  const share = recovered / (W * H);
  if (share > worstHole.share) worstHole = { share, file };
}

const total = files[0] ? (await sharp(join(dir, files[0])).metadata()) : null;
const framepx = total ? total.width * total.height : 1;

// Flicker test: does the silhouette's area drift coherently, or oscillate?
const deltas = [];
for (let i = 1; i < areas.length; i++) deltas.push(areas[i] - areas[i - 1]);
let inversions = 0;
for (let i = 1; i < deltas.length; i++) if (deltas[i] * deltas[i - 1] < 0) inversions++;
const flicker = deltas.length > 1 ? inversions / (deltas.length - 1) : 0;

const avg = areas.reduce((a, b) => a + b, 0) / areas.length;
const span = [Math.min(...areas), Math.max(...areas)].map((a) => (100 * a / framepx).toFixed(1));
console.log(`  ${files.length} maschere, area soggetto ${span[0]}% -> ${span[1]}% del fotogramma (media ${(100 * avg / framepx).toFixed(1)}%)`);
console.log(`  buco piu grande riempito: ${(100 * worstHole.share).toFixed(3)}% (${worstHole.file}) — informativo`);
console.log(`  inversioni di segno dell'area: ${(100 * flicker).toFixed(0)}%` +
  (flicker > FLICKER_LIMIT
    ? "   <-- il contorno SFARFALLA: guarda i 3 secondi prima di spedirlo"
    : "   ok, il contorno deriva in modo coerente (e movimento, non tremolio)"));
