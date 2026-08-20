'use client';

import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CONTACT } from "./data";
import { MailIcon, PhoneIcon, PinIcon } from "./ContactIcons";
import { PHOTOS } from "./photos";

/** Hydration gate (same trick as DevHud): render the portal only on the client so the
 *  server render and the first client render agree (both null). */
const NEVER = () => () => {};

/**
 * The quick-contact badge, top-left over every panel — the "targhetta" from the brief.
 *
 * ## It used to be two different things; now it is one, and it is closed
 * On phones this was a compact pill (avatar, call, email); on desktop it was the whole
 * card, always open — name, role, phone, email, address, "solo su prenotazione" — held
 * legible over any panel with `mix-blend-difference`. That is a lot of standing text in
 * the corner of a page whose whole point is one full-screen idea at a time, and the
 * client asked for the phone's motif to win everywhere and the rest to be a disclosure
 * (NUOVA_TODO.md §DESKTOP/1). So: one pill, one panel, every viewport.
 *
 * The pill keeps the two things worth a single tap — **call and email stay direct links,
 * closed or open**. Only the detail (address, hours, the full name) is behind the toggle;
 * hiding a phone number behind a click on a physiotherapist's site would be decluttering
 * the wrong thing.
 *
 * The avatar is Alessia's own round portrait rather than the placeholder mark: at 32px a
 * face is recognised and a logo is not, and the badge's job is "this is who you would be
 * writing to".
 *
 * ## Placement
 * Portaled to `<body>`, like DevHud — viewport-fixed and clear of the shell's transformed
 * panels, while still under the scroll context through React's portal. That also puts it
 * OUTSIDE the shell's scroll container, so its own pointer events never reach the wheel
 * hijack: no `touch-action` fight, nothing to do with the tap-vs-swipe seam.
 *
 * `Corners topLeft={false}` in page.tsx exists because this sits where that bracket would.
 */
export default function ContactBar() {
  const mounted = useSyncExternalStore(NEVER, () => true, () => false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // pointerdown, not click: the panel must be gone before the gesture becomes a scroll.
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [open]);

  if (!mounted) return null;

  const iconLink =
    "flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10";

  return createPortal(
    <div ref={root} className="fixed left-3 top-3 z-[9998] max-w-[min(88vw,20rem)]">
      <div className="flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-lg shadow-primary/10 ring-1 ring-ink/10 backdrop-blur-md">
        <Image
          src={PHOTOS.ritrattoTondo.src}
          alt=""
          width={PHOTOS.ritrattoTondo.width}
          height={PHOTOS.ritrattoTondo.height}
          sizes="2rem"
          className="ml-0.5 size-8 shrink-0 rounded-full object-cover"
        />
        <a href={`tel:${CONTACT.phoneHref}`} aria-label={`Chiama ${CONTACT.name}`} className={iconLink}>
          <PhoneIcon />
        </a>
        <a href={`mailto:${CONTACT.email}`} aria-label={`Scrivi a ${CONTACT.name}`} className={iconLink}>
          <MailIcon />
        </a>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Nascondi i contatti" : "Mostra i contatti"}
          className={`${iconLink} h-8 w-8`}
        >
          <svg
            viewBox="0 0 16 16"
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m3.5 6 4.5 4.5L12.5 6" />
          </svg>
        </button>
      </div>

      {/* Il dettaglio, a comparsa. `hidden` e non smontato: cosi' aria-controls punta
          sempre a un elemento che esiste. */}
      <div
        id={panelId}
        hidden={!open}
        className="mt-2 rounded-2xl bg-white/95 p-4 font-contact text-[0.82rem] leading-relaxed text-ink shadow-xl shadow-primary/10 ring-1 ring-ink/10 backdrop-blur-md"
      >
        <p className="font-display text-sm font-semibold text-primary">{CONTACT.name}</p>
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-primary/70">
          {CONTACT.role}
        </p>
        <div className="mt-3 space-y-2">
          <a href={`tel:${CONTACT.phoneHref}`} className="flex items-center gap-2 hover:underline">
            <span className="shrink-0 text-primary">
              <PhoneIcon />
            </span>
            {CONTACT.phoneDisplay}
          </a>
          <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 break-all hover:underline">
            <span className="shrink-0 text-primary">
              <MailIcon />
            </span>
            {CONTACT.email}
          </a>
          <p className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-primary">
              <PinIcon />
            </span>
            <span>
              {CONTACT.address.line1}
              <br />
              {CONTACT.address.line2} — {CONTACT.address.city}
            </span>
          </p>
        </div>
        <p className="mt-3 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-primary/70">
          {CONTACT.note}
        </p>
      </div>
    </div>,
    document.body,
  );
}
