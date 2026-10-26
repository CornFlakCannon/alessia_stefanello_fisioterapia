import Image from "next/image";
import { asset } from "./basePath";
import { CONTACT } from "./data";

/**
 * Where she works — a PICTURE of a map, with a pin, and a link out to Google Maps.
 *
 * ## Why it is not an embed any more
 * This was a Google Maps `<iframe>`. An embed sets Google's cookies and sends the
 * visitor's IP to Google on load, before any consent — which obliges the site to carry a
 * cookie banner, for a map nobody could even interact with (the iframe had to be
 * `pointer-events-none`, or a gesture over it never reached `ScrollShell`). A static image
 * loads nothing from anyone: no banner, no third party, and nothing for the scroll engine
 * to work around. It also took Google's own furniture (zoom, pegman, wordmark) off the
 * phone, which is what the client had found cluttered.
 *
 * The image is built by `scripts/static-map.mjs` from OpenStreetMap tiles; what it frames
 * and why is in that file's docblock. The real map — zoom, directions — is one tap away
 * in the pill, in a new tab, and that is a place the visitor chooses to go.
 *
 * ## The credit is not decoration
 * OpenStreetMap's licence (ODbL) requires "© OpenStreetMap" next to the map. Keep it.
 */
export default function PadovaMap({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-3xl border bg-mist ring-1 ring-primary/10 short:aspect-[16/10] ${className}`}
    >
      <Image
        src={asset("/foto/mappa.webp")}
        alt="Mappa del quartiere Forcellini, Padova"
        fill
        sizes="(min-width: 640px) 25rem, 90vw"
        className="object-cover"
      />

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-0 left-0 rounded-tr-lg bg-white/80 px-1.5 py-0.5 text-[0.6rem] leading-tight text-ink"
      >
        © OpenStreetMap
      </a>

      <a
        href={CONTACT.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-primary shadow-sm ring-1 ring-primary/10 backdrop-blur-sm transition-colors hover:bg-white"
      >
        Apri in Google Maps
      </a>
    </div>
  );
}
