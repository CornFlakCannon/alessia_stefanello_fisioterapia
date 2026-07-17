'use client';

import { useEffect, useRef, useState } from "react";
import { appointmentMailto, type AppointmentFields } from "./contact";

/**
 * Contact form — one minimal, viewport-fitting form (Nome · Telefono · Messaggio)
 * that submits by opening a prefilled email (no backend).
 *
 * ## Scroll pass-through under the scroll-jack
 * `ScrollShell` hijacks wheel/touch (touch-action:none, pointerdown → setPointerCapture,
 * wheel preventDefault). Because this form is short (no internal scroll), we let scroll
 * gestures **pass through** to the shell so the page still advances over the form —
 * while capturing only the taps that land **on a form control**, so inputs focus and the
 * send button taps ("pass through the scroll, not the click"). `useFormControlGuard`
 * `stopPropagation()`s `pointerdown` ONLY when it hits an input/textarea/button/etc.,
 * keeping the shell from starting a scroll-drag on it; every other pointerdown bubbles to
 * the shell, which scrolls the page. No wheel listener and no `touch-action` override are
 * needed anymore. This is a **site-side** fix — the engine is untouched (see
 * JUMP_TO_FEATURE.md); the `data-native` attribute stays for forward-compat.
 */
function useFormControlGuard<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Focus the control (or tap the button) without letting ScrollShell capture the
    // pointer as a scroll-drag. Anything NOT on a control bubbles through so the shell
    // scrolls the page — the scroll passes through the form.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, label")) {
        e.stopPropagation();
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    return () => el.removeEventListener("pointerdown", onPointerDown);
  }, []);
  return ref;
}

const inputBase =
  "w-full rounded-none border-0 border-b border-ink/20 bg-transparent px-0 py-2.5 " +
  "font-sans text-ink outline-none transition-colors placeholder:text-ink/40 " +
  "focus:border-primary";

function MinimalForm() {
  const [f, setF] = useState<AppointmentFields>({});
  const set = (k: keyof AppointmentFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = appointmentMailto(f);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-7">
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
        rows={4}
        className={`${inputBase} resize-none`}
        value={f.descrizione ?? ""}
        onChange={set("descrizione")}
      />
      <button
        type="submit"
        className="mt-1 self-start rounded-lg bg-primary px-6 py-2.5 font-mono text-sm font-semibold uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        Invia
      </button>
    </form>
  );
}

export default function ContactForm() {
  const ref = useFormControlGuard<HTMLDivElement>();
  return (
    <div ref={ref} data-native className="mx-auto w-full max-w-md">
      <MinimalForm />
    </div>
  );
}
