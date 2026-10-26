import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, LEGAL } from "../site/data";
import { SITE_URL } from "../site/seo";

/**
 * The privacy notice — a plain, normally-scrolling page, deliberately OUTSIDE the scroll
 * engine: it is a document to read, not a panel to animate.
 *
 * It is short because the site does very little, and every sentence here is a claim about
 * the code. If any of these stops being true, this page must change in the same commit:
 *  - no cookies, no analytics, no storage (nothing in `app/` writes any);
 *  - fonts self-hosted (`next/font` in layout.tsx);
 *  - the map is a static image (`PadovaMap`), not an embed;
 *  - the contact form sends nothing — it opens a `mailto:` (`contact.ts`).
 */
export const metadata: Metadata = {
  title: "Privacy — Alessia Stefanello, fisioterapista",
  description: "Informativa sul trattamento dei dati personali.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const h2 = "mt-10 mb-3 font-display text-xl font-semibold text-primary";
const link = "text-primary underline underline-offset-2";

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-base leading-relaxed text-ink">
      <Link href="/" className={`font-mono text-xs uppercase tracking-[0.16em] ${link}`}>
        ← Torna al sito
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold text-primary">Privacy</h1>
      <p className="mt-3 text-ink/75">
        Informativa ai sensi dell&apos;art. 13 del Regolamento UE 2016/679 (GDPR).
      </p>

      <h2 className={h2}>Chi tratta i dati</h2>
      <p>
        {CONTACT.name}, fisioterapista — {CONTACT.address.line1}, {CONTACT.address.line2},{" "}
        {CONTACT.address.city}. P. IVA {LEGAL.piva}. {LEGAL.albo}.
        <br />
        <a href={`mailto:${CONTACT.email}`} className={link}>
          {CONTACT.email}
        </a>{" "}
        ·{" "}
        <a href={`tel:${CONTACT.phoneHref}`} className={link}>
          {CONTACT.phoneDisplay}
        </a>
      </p>

      <h2 className={h2}>Cosa fa questo sito con i tuoi dati</h2>
      <p>
        Niente. Il sito non usa cookie, non fa statistiche sulle visite, non ha pubblicità e non
        carica contenuti da altri siti: i caratteri e la mappa sono file del sito stesso (la mappa
        è un&apos;immagine, © OpenStreetMap). Per questo non c&apos;è un banner dei cookie.
      </p>
      <p className="mt-3">
        Il sito è ospitato da GitHub Pages (GitHub, Inc., Stati Uniti), che come ogni servizio di
        hosting registra per ragioni tecniche e di sicurezza l&apos;indirizzo IP di chi lo visita.
        Il trasferimento avviene con le garanzie previste dal GDPR (EU-US Data Privacy Framework).
      </p>
      <p className="mt-3">
        I link a Google Maps e ad altri siti si aprono in una nuova finestra: da lì in poi valgono
        le regole di quei siti.
      </p>

      <h2 className={h2}>Se mi scrivi o mi chiami</h2>
      <p>
        Il modulo di contatto non invia nulla al sito: apre il tuo programma di posta con il
        messaggio già scritto, e sei tu a spedirlo. Uso il nome, il recapito e quello che mi
        scrivi solo per risponderti e fissare l&apos;appuntamento (art. 6, par. 1, lett. b, GDPR),
        e li conservo per il tempo necessario a farlo. Non li cedo a nessuno.
      </p>
      <p className="mt-3">
        Ti chiedo di non scrivere dettagli clinici nel primo messaggio: ne parliamo di persona.
        Se diventi paziente, ricevi in studio un&apos;informativa specifica sui dati sanitari.
      </p>

      <h2 className={h2}>Le fotografie</h2>
      <p>
        Le persone ritratte nelle fotografie del sito hanno dato il loro consenso scritto alla
        pubblicazione e possono ritirarlo in qualsiasi momento scrivendo all&apos;indirizzo qui
        sopra.
      </p>

      <h2 className={h2}>I tuoi diritti</h2>
      <p>
        Puoi chiedere in ogni momento di sapere quali dati ho su di te, di correggerli, cancellarli
        o limitarne l&apos;uso (artt. 15-22 GDPR), scrivendo a{" "}
        <a href={`mailto:${CONTACT.email}`} className={link}>
          {CONTACT.email}
        </a>
        . Se ritieni che i tuoi dati siano trattati in modo scorretto puoi rivolgerti al{" "}
        <a
          href="https://www.garanteprivacy.it"
          target="_blank"
          rel="noopener noreferrer"
          className={link}
        >
          Garante per la protezione dei dati personali
        </a>
        .
      </p>
    </main>
  );
}
