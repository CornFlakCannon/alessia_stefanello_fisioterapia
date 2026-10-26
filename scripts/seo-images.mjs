/**
 * The images the page shows to OTHER software, not to visitors: the link preview
 * (WhatsApp, Facebook, Google) and the icons (browser tab, Google's result line, a phone's
 * home screen). All four come from the portrait in FOTO_ORIGINALI/ (gitignored), the same
 * frame `ritratto` uses, and are written into app/, where Next's file conventions pick them
 * up and write the <meta>/<link> tags by themselves:
 *
 *   app/opengraph-image.jpg  1200x630  the link preview (+ opengraph-image.alt.txt, by hand)
 *   app/icon.png             192x192   round, transparent corners
 *   app/apple-icon.png       180x180   square: iOS rounds it itself and fills transparency black
 *   app/favicon.ico          48x48     what browsers fetch at /favicon.ico; Google wants a
 *                                      multiple of 48
 *
 *   node scripts/seo-images.mjs          # or: npm run photos
 *
 * The icon is her face, not a logo, for the reason the contact badge already wears one: at
 * 32px a face is recognised and a mark is not — and the real logo does not exist yet
 * (Logo.tsx is a placeholder). When it does, point ICON at it.
 *
 * `crop` is in ORIGINAL pixels, as in crop-photos.mjs.
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "FOTO_ORIGINALI", "DIS4477.jpg");
const APP = join(ROOT, "app");

/** 1.905:1, the ratio every preview card uses. Head to just under the crossed arms, centred
 *  on her: WhatsApp's small preview crops a centre square out of it. */
const PREVIEW = { left: 370, top: 300, width: 5400, height: 2835 };
/** Hair to collar, centred on the face. */
const ICON = { left: 2413, top: 433, width: 1333, height: 1333 };

const face = (size) => sharp(SRC).extract(ICON).resize(size, size);
/** 256 colours: a third of the bytes (66 -> 22 KB at 192px), no banding visible even at 2x. */
const PNG = { palette: true, quality: 90 };
const round = (size) =>
  face(size)
    .composite([
      {
        input: Buffer.from(
          `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`,
        ),
        blend: "dest-in",
      },
    ])
    .png(PNG)
    .toBuffer();

/** An .ico is a 6-byte header, one 16-byte entry per image, then the images; since Vista an
 *  entry may simply BE a PNG, which is all sharp can write. */
function ico(png, size) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(1, 4); // one image
  head.writeUInt8(size, 6);
  head.writeUInt8(size, 7);
  head.writeUInt16LE(1, 10); // colour planes
  head.writeUInt16LE(32, 12); // bits per pixel
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(22, 18); // offset of the image
  return Buffer.concat([head, png]);
}

const out = [
  ["opengraph-image.jpg", await sharp(SRC).extract(PREVIEW).resize(1200, 630).jpeg({ quality: 80, mozjpeg: true }).toBuffer()],
  ["icon.png", await round(192)],
  ["apple-icon.png", await face(180).png(PNG).toBuffer()],
  ["favicon.ico", ico(await round(48), 48)],
];
for (const [name, data] of out) {
  await writeFile(join(APP, name), data);
  console.log(`app/${name.padEnd(20)} ${(data.length / 1024).toFixed(0).padStart(4)} KB`);
}
