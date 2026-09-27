import { CONTACT } from "./data";

/**
 * Where the studio is — a real Google Maps view with a pin on the door. An `<iframe>`
 * embed: no map library, no API key.
 *
 * ## What changed, and why the radius went away
 * This used to frame ~120 km around Padova with an expanding dashed ring drawn over it,
 * scaled from `HOME_RADIUS_KM` against the embed's own metres-per-pixel. It answered
 * "how far do you travel?" — but at that zoom the map was a shape of the Veneto with no
 * legible streets, and on a phone, shrunk into a card, you could not tell what it was
 * pointing AT. The client asked for the opposite: drop the radius, focus Padova centro
 * (NUOVA_TODO.md §Fisioterapia a domicilio/1). How far she travels is now said in words,
 * on the panel, which is where it always read better anyway.
 *
 * That also removes every hand-drawn overlay: the pin is Google's own, on the real
 * address, so there is nothing left to keep in scale and nothing to re-measure when the
 * zoom changes.
 *
 * ## The `q=` embed rather than the `pb=` one
 * `pb=` is an opaque camera string (lat/lng/extent/place-id, positional) — it frames a
 * point but draws no marker, which is exactly the "non si vede dove punta" complaint.
 * `?q=<address>&output=embed` geocodes the address and drops a pin on it. `z` is the one
 * knob left: 15 is street level with the quartiere still readable around it.
 *
 * ## Why the iframe is `pointer-events-none`
 * Wheel/pointer events inside an iframe belong to ITS document and never reach ours, so
 * `ScrollShell`'s hijack would die over the map (the page would stop advancing while the
 * map zoomed instead). Making the iframe inert hands every gesture back to the shell —
 * scroll and touch-drag work over the map like anywhere else — and the "Apri in Google
 * Maps" pill covers the real interaction.
 *
 * ## Decluttering the phone
 * The embed brings its own furniture (zoom buttons, fullscreen, pegman, the Google
 * wordmark and terms) and it does not scale down: in the 12rem card this used to become
 * on a phone, that furniture WAS the map. There is no parameter to hide it — the fix is
 * to stop shrinking the card (see the call site) and to take our own chrome off the
 * small end: the pill only appears from `sm` up, where there is room for it.
 */

/** Street level: the building is findable and the quartiere still reads around it. */
const ZOOM = 15;

const EMBED_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(
  CONTACT.mapsQuery,
)}&z=${ZOOM}&hl=it&output=embed`;

export default function PadovaMap({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-3xl border bg-mist ring-1 ring-primary/10 short:aspect-[16/10] ${className}`}
    >
      <iframe
        src={EMBED_SRC}
        title={`Mappa: ${CONTACT.address.line1}, ${CONTACT.address.city}`}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="pointer-events-none absolute inset-0 h-full w-full border-0"
      />

      {/* The one interactive affordance — the iframe itself is inert (see above).
          Hidden on the smallest screens: there it would sit on top of Google's own
          controls, which is the clutter the client saw. */}
      <a
        href={CONTACT.mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 right-3 hidden rounded-full bg-white/90 px-3.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-primary shadow-sm ring-1 ring-primary/10 backdrop-blur-sm transition-colors hover:bg-white sm:block"
      >
        Apri in Google Maps
      </a>
    </div>
  );
}
