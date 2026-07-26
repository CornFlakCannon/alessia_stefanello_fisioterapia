'use client';

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CONTACT } from "./data";
import { MailIcon, PhoneIcon, PinIcon } from "./ContactIcons";
import Logo from "./Logo";

/** Hydration gate (same trick as DevHud): render the portal only on the client so
 *  the server render and first client render agree (both null). */
const NEVER = () => () => {};

/**
 * Always-visible quick-contact badge, pinned top-left (the "targhetta" from the
 * brief). Portaled to <body> so it's viewport-fixed and clear of the scroll-jack's
 * transformed panels. Full card on ≥sm; a compact call/email pill on phones.
 */
export default function ContactBar() {
  const mounted = useSyncExternalStore(NEVER, () => true, () => false);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed left-3 top-3 z-[9998] max-w-[min(88vw,20rem)]">
      {/* ≥ sm — plain text, no card chrome. `mix-blend-difference` inverts the
          (monochrome white) text against whichever panel is behind it, so it stays
          readable over both light and dark grounds without a background. Emphasis
          is carried by opacity, not colour, to keep the blend clean. */}
      <div className="hidden text-black mix-blend-difference sm:block">
        <div className="flex items-center gap-2.5">
          <Logo size={30} color="#ffffff" />
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold">{CONTACT.name}</div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.15em] opacity-70">
              {CONTACT.role}
            </div>
          </div>
        </div>
        <div className="mt-2.5 space-y-1.5 text-[0.8rem]">
          <a href={`tel:${CONTACT.phoneHref}`} className="flex items-center gap-2 hover:underline">
            <PhoneIcon /> {CONTACT.phoneDisplay}
          </a>
          <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 break-all hover:underline">
            <MailIcon /> {CONTACT.email}
          </a>
          <div className="flex items-start gap-2 opacity-90">
            <span className="mt-0.5 shrink-0">
              <PinIcon />
            </span>
            <span>
              {CONTACT.address.line1} <br/> {CONTACT.address.line2} — {CONTACT.address.city}
            </span>
          </div>
        </div>
        <div className="mt-2.5 inline-block font-mono text-[0.6rem] uppercase tracking-[0.14em] opacity-80">
          {CONTACT.note}
        </div>
      </div>

      {/* < sm — compact call/email pill */}
      <div className="flex items-center gap-1 rounded-full bg-white/90 p-1 pr-1 shadow-lg shadow-primary/10 ring-1 ring-ink/10 backdrop-blur-md sm:hidden">
        <Logo size={26} className="ml-0.5" />
        <a href={`tel:${CONTACT.phoneHref}`} aria-label="Chiama" className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10">
          <PhoneIcon />
        </a>
        <a href={`mailto:${CONTACT.email}`} aria-label="Email" className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10">
          <MailIcon />
        </a>
      </div>
    </div>,
    document.body,
  );
}
