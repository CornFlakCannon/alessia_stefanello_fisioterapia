/**
 * Print a frame's background colour as `0xRRGGBB`, for feeding to chromakey.
 *
 *   node scripts/probe-bg.mjs <frame.png>
 *
 * Called by scripts/hero-video.sh; not useful on its own.
 *
 * ## Why measure instead of hard-coding
 * A "green screen" out of an editing tool is not `#00ff00`. The one that came back
 * measured `#228021` — a dark green, and a gradient at that (`#197119` to `#29892c`).
 * Keying the nominal pure green against that fails, and keying a hard-coded `#228021`
 * would break the moment the file is re-exported with different grading. So the key
 * colour is read off the file every run.
 *
 * Samples both vertical edges, where there is only ever background, and averages: a
 * single corner would land on one end of the gradient. chromakey compares CHROMA, so an
 * average hue across a luma gradient is the right thing to hand it.
 */
import sharp from "sharp";

const file = process.argv[2];
if (!file) {
  console.error("uso: node scripts/probe-bg.mjs <frame.png>");
  process.exit(2);
}

const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const sum = [0, 0, 0];
let n = 0;
for (let y = 0; y < H; y += 3) {
  for (const x of [2, 6, W - 7, W - 3]) {
    const i = (y * W + x) * C;
    sum[0] += data[i];
    sum[1] += data[i + 1];
    sum[2] += data[i + 2];
    n++;
  }
}

const hex = sum.map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("");
process.stdout.write(`0x${hex.toUpperCase()}`);
