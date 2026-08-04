'use client';

import SDiv from "@/app/widgets/SDiv";
import { easeOutCubic } from "@/app/_scroll/easing";
import { CONTACT, HOME_RADIUS_KM } from "./data";

/**
 * A real Google Maps view of Padova with the home-visit action radius drawn on top —
 * an `<iframe>` embed, no map library and no API key.
 *
 * ## Why the iframe is `pointer-events-none`
 * Wheel/pointer events inside an iframe belong to ITS document and never reach ours,
 * so `ScrollShell`'s wheel hijack would die over the map (the page would stop
 * advancing while the map zoomed instead). Making the iframe non-interactive hands
 * every gesture back to the shell — scroll and touch-drag work over the map like
 * anywhere else — and the "Apri in Google Maps" pill covers the real interaction.
 *
 * ## How the radius stays in scale
 * The embed's `pb` string encodes the framed vertical extent in METRES as its `!1d…`
 * segment, so metres-per-pixel is `MAP_SPAN_M / (container height)`. That makes the
 * ring's diameter a pure percentage of the container's HEIGHT — no measuring, no
 * viewport maths: `2 · HOME_RADIUS_KM · 1000 / MAP_SPAN_M`. If it ever looks off,
 * `MAP_SPAN_M` is the single knob — compare the ring against the scale bar Google
 * draws in the embed's bottom-right corner.
 *
 * Because the scale is height-driven, the box's ASPECT is free to change: `short:` (a
 * viewport under 740px tall — see globals.css) letterboxes it to 16/10 so the domiciliare
 * panel still fits above the fold on an iPhone SE. The ring shrinks with the box and
 * stays correct.
 */

/** Framed vertical extent, in metres (the `!1d…` segment below). ~40 km around
 *  Padova centre: tight enough that an 8 km radius reads clearly. */
const MAP_SPAN_M = 120000;
/** Ring diameter as a % of the container's height — see the scale note above. */
const RING_PCT = (10 * HOME_RADIUS_KM * 1000 * 100) / MAP_SPAN_M;

/** Padova centre, matching the embed's `!2d`(lng)/`!3d`(lat) camera. */
const EMBED_SRC =
  `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d${MAP_SPAN_M}` +
  "!2d11.811049430517231!3d45.40206663278405!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1" +
  "!3m3!1m2!1s0x477eda5841ab30cf%3A0xc18236edaa1a2e2c!2sPadova%20PD!5e0!3m2!1sit!2sit" +
  "!4v1784664733880!5m2!1sit!2sit";

/** Reveal for the radius overlay: expands outward once as the panel settles. Place
 *  this component INSIDE the domiciliare `<Section>` — the SDivs inherit its index. */
const ring = (start: number) => ({
  start,
  budget: 420,
  anim: [
    { at: 0, scale: 0.3, opacity: 0 },
    { at: 1, scale: 1, opacity: 1, ease: easeOutCubic },
  ],
});

export default function PadovaMap({
  className = "",
  revealAt = 560,
}: {
  className?: string;
  /** Scroll position (section-local) where the radius overlay starts expanding. It
   *  must be past the moment the map is actually ON screen: inside a `FocusPanel` the
   *  map rides in on the slab, so a reveal at the default would play off-stage and the
   *  ring would already be open by the time the slab lands. */
  revealAt?: number;
}) {
  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-mist ring-1 ring-primary/10 short:aspect-[16/10] ${className}`}
    >
      <iframe
        src={EMBED_SRC}
        title="Mappa di Padova"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="pointer-events-none absolute inset-0 h-full w-full border-0"
      />

      {/* Radius ring + centre pin, centred on the map's camera (= the container's centre). */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* The scaled radius box: sized from RING_PCT (height-driven, so it tracks the
            map's metres-per-pixel), with both rings filling it. */}
        <div className="absolute aspect-square" style={{ height: `${RING_PCT}%` }}>
          {/* soft filled catchment */}
          <SDiv {...ring(revealAt)} className="absolute inset-0 rounded-full bg-primary/15" />
          {/* dashed action radius */}
          <SDiv {...ring(revealAt + 60)} className="absolute inset-0 rounded-full border-2 border-dashed border-secondary" />
        </div>
        {/* Padova centre */}
        <div className="relative flex flex-col items-center gap-1">
          <span className="block h-3.5 w-3.5 rounded-full bg-emphasis ring-4 ring-emphasis/25" />
          <span className="rounded-full bg-white/85 px-2 py-0.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink/80">
            Padova
          </span>
        </div>
      </div>

      {/* The one interactive affordance — the iframe itself is inert (see above). */}
      <a
        href={CONTACT.mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-primary shadow-sm ring-1 ring-primary/10 backdrop-blur-sm transition-colors hover:bg-white"
      >
        Apri in Google Maps
      </a>
    </div>
  );
}
