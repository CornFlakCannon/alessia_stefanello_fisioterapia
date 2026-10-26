/**
 * One-shot builder for the static map in the domiciliare panel (app/site/PadovaMap.tsx).
 *
 * The map used to be a Google Maps `<iframe>`. An embed sets Google's cookies and hands
 * the visitor's IP to Google before anyone has agreed to anything, which obliges the site
 * to carry a cookie banner. A picture of a map obliges nothing — so the map is built here,
 * once, from OpenStreetMap tiles, and shipped as a plain WebP. The interaction (zoom,
 * directions) is the "Apri in Google Maps" link, which the visitor chooses to follow.
 *
 *   node scripts/static-map.mjs
 *
 * Not part of `npm run photos`: it goes to the network (a dozen tiles from
 * tile.openstreetmap.org), and it only needs re-running if the centre or the framing
 * changes. The output is committed.
 *
 * OpenStreetMap's data is ODbL: the page must credit "© OpenStreetMap" next to the map.
 * PadovaMap does; do not remove that line.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "foto", "mappa.webp");

/** The centre of the Forcellini quartiere, as OpenStreetMap places it — the same thing the
 *  old embed framed (`MAPS_QUERY` in app/site/data.ts) and what the "Apri in Google Maps"
 *  link still opens, so the picture and the link agree.
 *
 *  NOT the studio's door, on purpose: OpenStreetMap's only node for "Viale della
 *  Navigazione Interna 51" (45.4032045, 11.9222456) sits ~600 m south of the street that
 *  carries that name, so a pin there could not be trusted. If the map should point at the
 *  studio instead, read the coordinates off the real door and put them here. */
const LAT = 45.3970395;
const LON = 11.8989158;

/** Built at twice the card's largest display size (25rem = 400px wide, 4:3), from tiles
 *  one zoom level deeper, so it shows what a z15 map shows and stays sharp on a 2x screen. */
const ZOOM = 16;
const W = 800;
const H = 600;
const TILE = 256;

const PIN = "#b31270"; // --brand-emphasis

const n = 2 ** ZOOM;
const latRad = (LAT * Math.PI) / 180;
// The centre's position in world pixels at this zoom (Web Mercator).
const cx = ((LON + 180) / 360) * n * TILE;
const cy = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n * TILE;

const left = Math.round(cx - W / 2);
const top = Math.round(cy - H / 2);
const x0 = Math.floor(left / TILE);
const y0 = Math.floor(top / TILE);
const x1 = Math.floor((left + W - 1) / TILE);
const y1 = Math.floor((top + H - 1) / TILE);

const tiles = [];
for (let x = x0; x <= x1; x++) {
  for (let y = y0; y <= y1; y++) {
    const url = `https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png`;
    // The tile usage policy asks for an identifying User-Agent.
    const res = await fetch(url, {
      headers: { "User-Agent": "fisio-alessia-static-map/1.0 (one-off site build)" },
    });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    tiles.push({
      input: Buffer.from(await res.arrayBuffer()),
      left: (x - x0) * TILE,
      top: (y - y0) * TILE,
    });
  }
}

const pin = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="72" viewBox="0 0 56 72">
     <path d="M28 70C28 70 52 42 52 26A24 24 0 0 0 4 26C4 42 28 70 28 70Z"
           fill="${PIN}" stroke="#fff" stroke-width="4"/>
     <circle cx="28" cy="26" r="9" fill="#fff"/>
   </svg>`,
);

const mosaic = await sharp({
  create: {
    width: (x1 - x0 + 1) * TILE,
    height: (y1 - y0 + 1) * TILE,
    channels: 3,
    background: "#fff",
  },
})
  .composite(tiles)
  .png()
  .toBuffer();

await sharp(mosaic)
  .extract({ left: left - x0 * TILE, top: top - y0 * TILE, width: W, height: H })
  // The pin's tip (28,70 in its own box) sits on LAT/LON, i.e. the centre.
  .composite([{ input: pin, left: W / 2 - 28, top: H / 2 - 70 }])
  .webp({ quality: 82 })
  .toFile(OUT);

console.log(`${OUT}  ${W}x${H}  z${ZOOM}  ${tiles.length} tiles`);
