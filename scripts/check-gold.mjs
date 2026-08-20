/**
 * Does the hero video's background actually equal the brand gold?
 *
 * Only meaningful when the background is supposed to BE the slab — i.e. the clip came
 * back from a background-replacement tool. If the tool painted a generic "gold" instead
 * of #edab39, the video becomes a rectangle of a different gold sitting on the CSS band.
 * Three levels of drift is invisible in isolation and obvious side by side, which is
 * exactly the kind of thing not to judge by eye — hence a number.
 *
 * Being out of tolerance is not automatically a fault: on the straight V1-gold route it
 * is the expected, accepted state, and this is just the reminder of how far off it is.
 *
 *   node scripts/check-gold.mjs <frame.png> <tolerance>
 *
 * Samples the four corners, where there is only ever background. Exit 1 when out of
 * tolerance, so the caller can react.
 */
import sharp from "sharp";

const [file, tolArg] = process.argv.slice(2);
const tol = Number(tolArg ?? 2);
const WANT = [0xed, 0xab, 0x39];

const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
const at = (x, y) => {
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2]];
};

let worst = 0;
let sample = null;
for (const [x, y] of [
  [4, 4],
  [info.width - 5, 4],
  [4, info.height - 5],
  [info.width - 5, info.height - 5],
]) {
  const c = at(x, y);
  const d = Math.max(...c.map((v, k) => Math.abs(v - WANT[k])));
  if (d > worst) {
    worst = d;
    sample = c;
  }
}

console.log(`  fondo agli angoli: ${sample.join(",")}  (atteso ${WANT.join(",")})  scarto max ${worst}`);
if (worst <= tol) {
  console.log("  -> entro tolleranza: nessuna cucitura contro la fascia CSS");
} else {
  console.log("  -> FUORI TOLLERANZA: il video legge come un rettangolo sulla fascia.");
  console.log("     Atteso sul percorso 'secco'. Se non lo vuoi, tre leve:");
  console.log("       HERO_MATTE=1 bash scripts/hero-video.sh   compone sull'oro esatto");
  console.log("       mask-image sui bordi del video            sfuma, nessuna cucitura");
  console.log("       copia verde in FOTO_ORIGINALI/V1-green.*  key + ricomposizione");
  process.exit(1);
}
