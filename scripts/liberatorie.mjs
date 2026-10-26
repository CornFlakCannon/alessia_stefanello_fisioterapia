/**
 * Builds one ready-to-sign photo release per person, with that person's photos printed
 * on it: LIBERATORIA_FOTO.md (the text) + `PEOPLE` below -> docs/liberatorie/*.docx.
 *
 *   node scripts/liberatorie.mjs        (needs `pandoc` on the PATH)
 *
 * The photos are on the sheet because consent has to be for THESE pictures, not for
 * "the photos we took": the person signs next to what they are agreeing to.
 *
 * `PEOPLE` is the only thing to touch. A photo used on the site must appear in exactly
 * one group — add a photo to app/site/photos.ts with a new person in it, add it here.
 * The groups were made by looking at the pictures, not from names; nobody is named in
 * this repo, which is public. SIGNED copies never enter git: the scans live in
 * LIBERATORIE_FIRMATE/, which is gitignored (all four groups below signed, 24/10/2026).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FOTO = join(ROOT, "public", "foto");
const OUT = join(ROOT, "docs", "liberatorie");

const PEOPLE = [
  { file: "1-sport", photos: ["equilibrio", "spalla"] },
  { file: "2-signora-anziana", photos: ["anziani-spiega", "palla", "step"] },
  { file: "3-cervicale-spalla", photos: ["cervicale", "cervicale-largo", "spalla-verticale"] },
  { file: "4-terapia-manuale-schiena", photos: ["manuale", "manuale-dorsale", "pelvico"] },
  // A blank one, for whoever is photographed next: paste or staple the prints.
  { file: "vuota", photos: [] },
];

const template = readFileSync(join(ROOT, "LIBERATORIA_FOTO.md"), "utf8");
const tmp = mkdtempSync(join(tmpdir(), "liberatorie-"));
mkdirSync(OUT, { recursive: true });

for (const { file, photos } of PEOPLE) {
  const cells = [];
  for (const name of photos) {
    // Word does not read WebP.
    const jpg = join(tmp, `${name}.jpg`);
    await sharp(join(FOTO, `${name}.webp`)).resize({ width: 600 }).jpeg({ quality: 80 }).toFile(jpg);
    cells.push(`![](${jpg}){width=1.8in height=2.4in}`);
  }
  const block = photos.length
    ? cells.join(" ")
    : "*(incollare o allegare qui le fotografie, siglate una per una)*";
  const md = join(tmp, `${file}.md`);
  writeFileSync(md, template.replace("<!-- FOTO -->", block));
  const docx = join(OUT, `liberatoria-${file}.docx`);
  execFileSync("pandoc", [md, "-o", docx]);
  console.log(docx, photos.join(" "));
}

rmSync(tmp, { recursive: true });
