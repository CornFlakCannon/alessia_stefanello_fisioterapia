'use client';

import { useEffect, useRef, useState } from "react";
import { appointmentMailto, type AppointmentFields } from "./contact";

/** Finger travel (px) past which a touch stops being a tap and becomes a scroll. */
const SLOP = 8;
/** Longest a touch can linger and still count as a tap (ms). */
const TAP_MS = 600;

/**
 * Contact form — one minimal, viewport-fitting form (Nome · Telefono · Messaggio)
 * that submits by opening a prefilled email (no backend).
 *
 * ## Scroll pass-through under the scroll-jack
 * `ScrollShell` hijacks wheel/touch (touch-action:none, pointerdown → setPointerCapture,
 * wheel preventDefault). The form is short (no internal scroll), so scroll gestures must
 * **pass through** to the shell and advance the page like anywhere else.
 *
 * The trap is deciding tap-vs-scroll at `pointerdown` from the event *target*: a finger
 * landing on a field could still be either, and blocking the pointerdown ("it's on an
 * input, so it's a tap") leaves the swipe with nowhere to go — the shell never starts a
 * drag, and `touch-action:none` means the browser won't scroll natively either, while the
 * browser's own touch defaults (caret drag, selection magnifier, focus scroll-into-view)
 * still run and fight the shell's per-frame `scrollTop` write. That was the jitter.
 *
 * So `useTapVsSwipe` decides by **gesture, after the fact**: the pointerdown is never
 * blocked (the shell drags, the page scrolls), and only on `pointerup` — if the finger
 * never travelled past `SLOP` — do we focus the field the tap landed on. Clicks are left
 * entirely native; the shell's pointer capture doesn't steal them. This is a **site-side**
 * fix — the engine is untouched (see JUMP_TO_FEATURE.md); `data-native` stays for
 * forward-compat.
 */
function useTapVsSwipe<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Only ever tracks ONE pointer: a second finger resting on the panel must not
    // resolve (or cancel) the gesture the first one started.
    let start: { id: number; x: number; y: number; t: number; control: HTMLElement } | null =
      null;

    const detach = () => {
      start = null;
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerCancel, true);
    };

    function onPointerCancel(e: PointerEvent) {
      if (start && e.pointerId !== start.id) return;
      detach();
    }

    // Sticky: once the travel says "scroll", stop watching and let the shell have it.
    function onPointerMove(e: PointerEvent) {
      if (!start || e.pointerId !== start.id) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) <= SLOP) return;
      start = null; // it's a swipe — pointerup must not focus anything
      window.removeEventListener("pointermove", onPointerMove, true);
      // A field the browser focused on touch-down would raise the keyboard over a panel
      // that must fit 100svh. Get it out of the way now that we know we're scrolling.
      const active = document.activeElement;
      if (active instanceof HTMLElement && el?.contains(active)) active.blur();
    }

    function onPointerUp(e: PointerEvent) {
      const s = start;
      if (s && e.pointerId !== s.id) return;
      detach();
      if (!s) return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > SLOP) return;
      if (performance.now() - s.t > TAP_MS) return;
      // A tap. Buttons and links are already handled natively — only text fields need a
      // nudge, and `preventScroll` keeps the browser from scrolling the shell container
      // behind the rAF loop's back. A no-op if the browser focused it natively.
      if (
        s.control instanceof HTMLInputElement ||
        s.control instanceof HTMLTextAreaElement ||
        s.control instanceof HTMLSelectElement
      ) {
        s.control.focus({ preventScroll: true });
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return; // desktop is wheel-driven and fully native
      const control = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "input, textarea, select, button, a",
      );
      if (!control) return; // bare form area: the shell already scrolls it correctly
      start = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), control };
      // On `window`, not `el`: the shell setPointerCapture()s its container on this same
      // pointerdown, so every later event for this pointer retargets there and would
      // never reach us.
      window.addEventListener("pointermove", onPointerMove, true);
      window.addEventListener("pointerup", onPointerUp, true);
      window.addEventListener("pointercancel", onPointerCancel, true);
    };

    el.addEventListener("pointerdown", onPointerDown);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      detach();
    };
  }, []);
  return ref;
}

// `touch-none` HERE, on the control itself — the shell's `touch-action: none` does NOT
// cover it. A gesture intersects touch-action from the touched element only "up to the one
// that implements the gesture, i.e. the first containing scrolling element" (MDN). A
// <textarea> IS a scroll container (UA `overflow: auto`), so the walk stops at it and the
// shell's ancestor value is never consulted: the browser handled the swipe natively,
// scroll-chained it to the shell container, and fought the rAF loop's per-frame scrollTop
// write — the textarea-only jitter. Declaring `none` on the element that implements the
// gesture is the only place that settles it. (Inputs weren't affected — they're not
// vertical scroll containers — but they get it too so no control can regress here.)
// Cost, accepted: the textarea's own overflow is no longer touch-scrollable; the page
// swipe wins, which is the right trade on a panel that must fit 100svh.
//
// `select-none focus:select-text`: the other native artefact is a caret/selection drag
// starting on an UNfocused field (touch-action doesn't suppress selection). Blocking
// user-select stops that drag from beginning; focus restores normal editing/selection.
/**
 * The fields have no box: they are transparent inputs on the panel's own ground, with a
 * hairline underneath and the PLACEHOLDER as their only label.
 *
 * ## The type is one step up from a default form, on purpose
 * `text-lg` because the client asked for it and because of WHY: this form sits on a panel
 * whose ground is a photograph. Small type on a busy ground is where legibility goes even
 * when the contrast ratio says it is fine — ratio is measured on a solid glyph, and thin
 * strokes at 14px simply have less of one. `short:text-base` gives it back on a viewport
 * that cannot afford the height (panel 4 must fit inside 100svh).
 *
 * ## The faint values, and what they are measured against now
 * `placeholder:text-ink/70` and `border-ink/30` came up from `/40` and `/20` when the
 * photo first arrived behind them. The photo is now much stronger (0.75), but the form
 * sits on a translucent card, so the ground under these is near-white again:
 *
 *   placeholder text-ink/70   5.39:1   (measured, scripts/check-contrast.mjs)
 *   body        text-ink/90   9.88:1
 *   input       text-ink     12.81:1
 *
 * ⚠️ The underline is still under the 3:1 WCAG asks of an input's border. Getting there
 * means roughly `/55`, which is a visibly heavier form than the one that was signed off;
 * left as a deliberate, recorded compromise rather than a silent redesign.
 *
 * `touch-none` is NOT decoration — a <textarea> is its own scroll container, so it
 * terminates the touch-action walk before the shell's value is ever consulted. See the
 * second engine seam in CLAUDE.md before removing it.
 */
const inputBase =
  "w-full touch-none select-none rounded-none border-0 border-b border-ink/30 bg-transparent px-0 py-2.5 " +
  "font-sans text-lg text-ink outline-none transition-colors placeholder:text-ink/70 short:text-base " +
  "focus:select-text focus:border-primary";

function MinimalForm() {
  const [f, setF] = useState<AppointmentFields>({});
  const set = (k: keyof AppointmentFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = appointmentMailto(f);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 short:gap-4">
      <input
        id="nome"
        aria-label="Nome"
        placeholder="Nome"
        required
        className={inputBase}
        value={f.nome ?? ""}
        onChange={set("nome")}
      />
      <input
        id="telefono"
        type="tel"
        aria-label="Numero di telefono"
        placeholder="Numero di telefono"
        required
        className={inputBase}
        value={f.telefono ?? ""}
        onChange={set("telefono")}
      />
      <textarea
        id="descrizione"
        aria-label="Messaggio"
        placeholder="Il disturbo, la richiesta, qualsiasi cosa…"
        required
        rows={3}
        className={`${inputBase} resize-none`}
        value={f.descrizione ?? ""}
        onChange={set("descrizione")}
      />
      <button
        type="submit"
        className="mt-1 self-start rounded-lg bg-primary px-7 py-3 font-mono text-base font-semibold uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 active:translate-y-0 short:py-2.5 short:text-sm"
      >
        Invia
      </button>
    </form>
  );
}

export default function ContactForm() {
  const ref = useTapVsSwipe<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-native
      className="mx-auto w-full max-w-md [-webkit-touch-callout:none]"
    >
      <MinimalForm />
    </div>
  );
}
