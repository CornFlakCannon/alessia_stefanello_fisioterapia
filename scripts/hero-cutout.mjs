/**
 * The hero portrait: a real cut-out with an alpha channel, from a source that only
 * PRETENDS to have one.
 *
 *   node scripts/hero-cutout.mjs        # or: npm run photos
 *
 * ## What arrived, and why it needs a script at all
 * `FOTO_ORIGINALI/HERO_PHOTO.png` looks like a background-removal export — Alessia on a
 * transparency checkerboard. It is not one: measured, the file is **100% opaque** and the
 * checkerboard is PAINTED IN, two flat neutral greys (~#ebebeb and ~#fefefe) in a regular
 * grid. Ship it as-is and the hero wears a grey checkerboard rectangle on the gold slab.
 *
 * (If a version with a REAL alpha channel ever turns up, this script becomes a two-line
 * resize — the keying below is only here because that file did not.)
 *
 * ## Why this keys safely where `hero-video.sh` could not
 * That script's long docblock records the lesson: you cannot key the studio's grey-green
 * wall, because her white trousers measure INSIDE the wall's range and the key eats them.
 * This plate is a different animal, and the numbers say so:
 *
 *   |                | mean saturation | luma        |
 *   | checkerboard   | 0.31            | 235 and 255 |
 *   | white trousers | 19.05           | 168 .. 229  |
 *
 * The plate is *perfectly neutral* and *brighter than anything on her*. So the test is
 * two-dimensional — `saturation <= SAT_MAX` AND `luma >= LUMA_MIN` — and the trousers
 * fail BOTH halves, not just one. That is the whole reason this is safe: a luma-only key
 * at 226 would take the trousers' highlights with it.
 *
 * ## And why it is a flood fill rather than a colour key
 * Even with the two-dimensional test, a global key deletes any pale neutral pixel INSIDE
 * her — the specular highlights on the white trousers are exactly that. Filling from the
 * image border instead makes background a matter of CONNECTIVITY: a pixel is background
 * only if it is pale, neutral AND reachable from the edge without crossing her. The run
 * below keeps ~11k interior pixels that a global key would have punched into holes; that
 * count is printed on every run precisely because it is the number that would go wrong
 * silently.
 *
 * `ERODE` then removes the boundary pixels, which are a BLEND of her and the plate and so
 * would ship as a hard contaminated ring, and `FEATHER` softens what is left so the
 * silhouette is not a staircase.
 *
 * ## Why `ERODE` is small, and what it is NOT for
 * The cut-out first shipped on the gold slab, and there it wore a visible pale halo around
 * the hair. The obvious reading is "erode harder". Measured, that is wrong: the pale
 * pixels are the ~11k the flood fill deliberately KEEPS — interior highlights on the white
 * trousers and in the hair — and the count barely moves between 0 and 3 erosion passes
 * (10923 → 10824) because they are nowhere near the boundary. You cannot trim them without
 * eating the subject.
 *
 * What decides whether they read as a halo is the GROUND:
 *
 *   | composited on | the palest kept pixel lands at | vs the ground |
 *   | gold (luma 172) | 255 | +83 — a bright halo |
 *   | white (luma 255) | 226 | −29 — invisible |
 *
 * So the hero puts her on WHITE and moves the gold to the text half (the client's call,
 * and the numbers agree). With the ground no longer punishing leftover plate, `ERODE` only
 * has to remove the single hard-contaminated ring, which is why it is 1 and not more —
 * every extra pass is hair we lose for nothing.
 *
 * ## Two derivatives, because the phone needs a different picture
 * She is tall and narrow (the subject is ~1250 x 2340 in a 1920 x 2560 frame), so one crop
 * cannot serve both places:
 *   - `hero.webp`        3:4, cropped tight top and bottom — the desktop slab.
 *   - `hero-mobile.webp` SQUARE, a BUST: crown to just under the shoulder line. The client
 *     asked for the face to carry the phone hero (NUOVA_TODO.md §MOBILE/1) and then for it
 *     to carry three quarters of the screen, shoulders running off both edges.
 * Vertical tightness is what makes her big: rendered height is
 * `(subject_height / crop_height) * box_height`, so trimming rows buys size, while side
 * margin costs nothing (it is transparent, and `drop-shadow` follows the silhouette rather
 * than the box). Cutting the phone frame from 1695 rows to 1135 is what takes her head from
 * 84px to ~284px on a 390x844 phone.
 *
 * ## Why the phone crop is SQUARE, which is the load-bearing part
 * That derivative is no longer laid out at its own ratio: the phone box has a FIXED HEIGHT
 * (`h-[74svh]`) and the image fills it with `object-cover`. Cover crops whichever axis the
 * container has to spare — and if a container is ever WIDER than it is tall, the axis it
 * crops is the HEIGHT, i.e. her skull. Below `lg` that is not hypothetical: tablets live
 * there, and so does a 900x600 desktop window (ratio 2.03).
 *
 * The guarantee is arithmetic, and it is split between this file and `page.tsx`: the source
 * is 1:1 and the box is capped at `w-[min(100vw,74svh)]`, i.e. never wider than it is tall.
 * Container ratio <= 1 = source ratio, so cover can only ever crop WIDTH. The vertical
 * composition chosen here — the air over her crown, the cut under the shoulders — is what
 * every device shows; the only thing that varies is how much of the shoulders runs off the
 * sides. Change `MOB_RATIO` here or that cap there and you decapitate her on some device,
 * silently.
 *
 * ## Every crop is measured against the subject before it is written
 * An off-centre window that clips a shoulder is invisible by eye at 208px on a phone, so
 * `window_` refuses one. The phone frame now WANTS a clip, though, so the check is budgeted
 * rather than absolute: `bleed` is how much may run off per side, and `faceGuard` is the row
 * above which nothing may be cut at all. Head, hair and neck are therefore whole by
 * construction, and the measured bleed is printed on every run.
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "FOTO_ORIGINALI", "HERO_PHOTO.png");
const OUT = join(ROOT, "public", "foto");

/** Max chroma spread (max-min channel) still considered "the neutral plate". The plate
 *  measures 0.31, her palest garment 19.05 — 6 sits in the gap with room on both sides. */
const SAT_MAX = 6;
/** Min mean luma for the plate. Its two tones are 235 and 255; her brightest trouser
 *  highlight is 229. 226 is below the plate and above her, by 6 and 3 levels. */
const LUMA_MIN = 226;
/** Boundary pixels to drop: the one ring that is part her, part plate. NOT a halo control
 *  — see the docblock, the halo is interior and the ground is what fixes it. Keep it
 *  minimal; every pass past this is hair thrown away. */
const ERODE = 1;
/** Gaussian sigma on the finished matte — enough to kill the staircase, not enough to
 *  make her edge mushy. */
const FEATHER = 1.2;

/** Rows of air left above the crown of her head, in source pixels. The single knob for
 *  "she sits too high / too low" on DESKTOP. */
const HEAD_ROOM = 160;
/** Desktop output: 3:4 (the slab's shape), 1100px across ≈ 2x the largest CSS box (34rem). */
const DESK_RATIO = 3 / 4;
const DESK_W = 1100;

/* ── the phone frame ──────────────────────────────────────────────────────────────────
   Measured on the matte, which is what these numbers answer to:
     crown 225 · chin/neck 775 (her narrowest, w=262) · shoulders start 875 (w jumps
     306 -> 726) · widest ±607 from cx=1011 at y 1225..1275 · crossed arms below 1300.  */
/** Air over the crown on the phone — less than the desktop's, because the frame is a third
 *  as tall and 160 rows would read as a hat. 110 lands at ~8% of the crop. */
const MOB_HEAD_ROOM = 110;
/** How far down the body the phone frame reaches. 1250 cuts under the shoulder line and
 *  above the crossed arms: a bust. It was 1760 (arms included, "testa e mezzo busto") and
 *  the whole point of moving it is that the frame's height IS her rendered size. */
const MOB_BOTTOM = 1250;
/** 1:1, and NOT a taste decision — see the docblock. The box is height-driven and capped at
 *  `min(100vw,74svh)`; square is what stops `object-cover` from ever cropping her head. */
const MOB_RATIO = 1;
/** The crop is natively 1135 across and the box shows ~61% of that width on a phone, so 960
 *  is already oversampled. Raising it only costs LCP bytes. */
const MOB_W = 960;
/** Phone frame only: how far the subject may run off EACH side, in source px. At the current
 *  framing she is ±623 at the last row against a half-frame of 561, so 13px goes on the left
 *  and 63 on the right — the bleed the client asked for. A budget, not a licence: past this
 *  the framing has drifted and the run fails.
 *  (The asymmetry is real and harmless: `cx` is the centre of her WHOLE body, and this frame
 *  keeps only the part of her that leans right of it.) */
const MOB_BLEED = 80;
/** ...and the row above which NOTHING may be cut, whatever the budget says. 1050 is 175 rows
 *  BELOW the shoulder join (875) and 200 above the widest point: crown, hair, face, neck and
 *  the shoulder line itself are whole by construction, not by luck. A budget meant for
 *  shoulders can therefore never be spent on her head. */
const MOB_FACE_GUARD = 1050;

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// 1 · candidate plate pixels: pale AND neutral (see the table above — both halves matter)
const cand = new Uint8Array(W * H);
for (let p = 0, i = 0; p < W * H; p++, i += C) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  cand[p] = Math.max(r, g, b) - Math.min(r, g, b) <= SAT_MAX && (r + g + b) / 3 >= LUMA_MIN ? 1 : 0;
}

// 2 · background = candidates REACHABLE from the border (connectivity, not colour)
const bg = new Uint8Array(W * H);
const stack = [];
const push = (x, y) => {
  const p = y * W + x;
  if (cand[p] && !bg[p]) { bg[p] = 1; stack.push(p); }
};
for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
while (stack.length) {
  const p = stack.pop(), x = p % W, y = (p - x) / W;
  if (x > 0) push(x - 1, y);
  if (x < W - 1) push(x + 1, y);
  if (y > 0) push(x, y - 1);
  if (y < H - 1) push(x, y + 1);
}

let plate = 0, keptInside = 0;
for (let p = 0; p < W * H; p++) { plate += bg[p]; if (cand[p] && !bg[p]) keptInside++; }

// 3 · erode the blended boundary, then feather
let matte = Buffer.alloc(W * H);
for (let p = 0; p < W * H; p++) matte[p] = bg[p] ? 0 : 255;
for (let k = 0; k < ERODE; k++) {
  const next = Buffer.from(matte);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x;
      if (matte[p] && (!matte[p - 1] || !matte[p + 1] || !matte[p - W] || !matte[p + W])) next[p] = 0;
    }
  }
  matte = next;
}
// `toColourspace("b-w")` is load-bearing: without it sharp hands back an interleaved
// 3-channel buffer and every later `alpha[p]` reads a third of the image, stretched.
const soft = await sharp(matte, { raw: { width: W, height: H, channels: 1 } })
  .blur(FEATHER)
  .toColourspace("b-w")
  .raw()
  .toBuffer();

// 4 · subject box, measured on the finished matte (not on the raw candidates)
let minX = W, maxX = -1, minY = H, maxY = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (soft[y * W + x] > 8) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const cx = Math.round((minX + maxX) / 2);

console.log(`plate ${(100 * plate / (W * H)).toFixed(1)}% of frame · ${keptInside} interior pale px kept (a global key would have holed these)`);
console.log(`subject  x ${minX}..${maxX} (w ${maxX - minX + 1})  y ${minY}..${maxY} (h ${maxY - minY + 1})`);

const rgba = Buffer.alloc(W * H * 4);
for (let p = 0, i = 0; p < W * H; p++, i += C) {
  rgba[p * 4] = data[i];
  rgba[p * 4 + 1] = data[i + 1];
  rgba[p * 4 + 2] = data[i + 2];
  rgba[p * 4 + 3] = soft[p];
}
const cut = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });

/**
 * Clamp a window to the frame and measure it against the subject.
 *
 * `bleed` = how many px of her may run off EACH side (0 = the old absolute refusal, which is
 * what the desktop frame still wants). `faceGuard` = a source row above which nothing may be
 * cut whatever `bleed` says, so a budget meant for shoulders can never be spent on her head.
 * Both measured, both printed: a clip is invisible at phone size, which is the entire reason
 * this function exists.
 */
function window_(top, bottom, ratio, label, { bleed = 0, faceGuard = null } = {}) {
  const height = bottom - top;
  const width = Math.round(height * ratio);
  let left = Math.round(cx - width / 2);
  left = Math.max(0, Math.min(W - width, left));
  if (width > W || top < 0 || bottom > H) throw new Error(`${label}: window ${width}x${height} does not fit ${W}x${H}`);
  const right = left + width;
  // widest point of the subject inside this band, and inside its protected upper part
  let bMinX = W, bMaxX = -1, gMinX = W, gMaxX = -1;
  for (let y = top; y < bottom; y++) {
    for (let x = 0; x < W; x++) {
      if (soft[y * W + x] > 8) {
        if (x < bMinX) bMinX = x;
        if (x > bMaxX) bMaxX = x;
        if (faceGuard !== null && y < faceGuard) { if (x < gMinX) gMinX = x; if (x > gMaxX) gMaxX = x; }
      }
    }
  }
  const cutL = Math.max(0, left - bMinX);
  const cutR = Math.max(0, bMaxX - (right - 1));
  const guarded = faceGuard !== null && gMaxX >= 0 && (gMinX < left || gMaxX >= right);
  const verdict = guarded ? "⚠ CLIPS ABOVE THE GUARD" : cutL || cutR ? `bleed L${cutL} R${cutR} (max ${bleed})` : "fits";
  console.log(`${label.padEnd(12)} crop ${width}x${height} @ ${left},${top} · subject spans ${bMinX}..${bMaxX} · ${verdict}`);
  if (guarded)
    throw new Error(`${label}: the crop cuts the subject above y=${faceGuard} (head/neck) — widen the ratio or raise the frame`);
  if (Math.max(cutL, cutR) > bleed)
    throw new Error(`${label}: the crop clips the subject by ${Math.max(cutL, cutR)}px, past the ${bleed}px budget — widen the ratio or lower ${label === "hero-mobile" ? "MOB_BOTTOM" : "HEAD_ROOM"}`);
  return { left, top, width, height };
}

await mkdir(OUT, { recursive: true });
const manifest = [];
const jobs = [
  { id: "hero", win: window_(Math.max(0, minY - HEAD_ROOM), H, DESK_RATIO, "hero"), w: DESK_W },
  {
    id: "hero-mobile",
    win: window_(Math.max(0, minY - MOB_HEAD_ROOM), MOB_BOTTOM, MOB_RATIO, "hero-mobile", {
      bleed: MOB_BLEED,
      faceGuard: MOB_FACE_GUARD,
    }),
    w: MOB_W,
  },
];
for (const { id, win, w } of jobs) {
  const dest = join(OUT, `${id}.webp`);
  const { size } = await cut.clone().extract(win).resize(w).webp({ quality: 84 }).toFile(dest);
  const h = Math.round((win.height / win.width) * w);
  console.log(`${id.padEnd(12)} ${w}x${h} ${(size / 1024).toFixed(0)} KB -> public/foto/${id}.webp`);
  // The exact box, ready to paste: the crop's height follows HEAD_ROOM/MOB_BOTTOM and the
  // ratio only rounds to 3:4, so these drift by a pixel whenever a framing is retuned.
  // Printing them is cheaper than remembering (and a stale height is a layout shift).
  manifest.push(`  ${id === "hero" ? "desktop" : "mobile"}: { src: "/foto/${id}.webp", width: ${w}, height: ${h} },`);
}
console.log("\napp/site/photos.ts — HERO_PHOTO:");
for (const line of manifest) console.log(line);
