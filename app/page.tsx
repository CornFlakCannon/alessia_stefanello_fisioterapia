"use client";

import Image from "next/image";

import { Section } from "./_scroll";
import { easeInCubic, easeOutCubic } from "./_scroll/easing";
import ScrollShell from "./ScrollShell";
import SDiv from "./widgets/SDiv";
import SMask from "./widgets/SMask";
import DevHud from "./widgets/DevHud";

import { CONTACT, CONTACT_COPY, FORMAZIONE, HERO, SERVICES } from "./site/data";
import FocusPanel, { FOCUS_LANDED } from "./site/FocusPanel";
import { PANEL_BOX } from "./site/panelBox";
import Logo from "./site/Logo";
import HeroFigure from "./site/HeroFigure";
import HeroPortrait from "./site/HeroPortrait";
import PadovaMap from "./site/PadovaMap";
import ContactForm from "./site/ContactForm";
import CvSheets, { sheetsEnd } from "./site/CvSheets";
import ServiceIndex from "./site/ServiceIndex";
import ContactBar from "./site/ContactBar";
import PhotoSlab from "./site/PhotoSlab";
import DuotonePhoto from "./site/DuotonePhoto";
import { PHOTOS, type Photo } from "./site/photos";
import { MailIcon, PhoneIcon, PinIcon } from "./site/ContactIcons";

/* Restrained reveal — fade + short rise. `at:0` is invisible, so it's used only in
   panels 1-6 (which aren't active at load); the hero uses on-load CSS animations
   instead (its content is visible at scroll 0). Panels use `snap`, so reveals start
   just after the panel lands (`SNAP`). */
const SNAP = 320;
const DWELL = 500; // extra scroll a landed panel holds, fully revealed, before it hands off
const UP = [
  { at: 0, opacity: 0, y: 24 },
  { at: 1, opacity: 1, y: 0, ease: easeOutCubic },
];
const RIGHT = [
  { at: 0, opacity: 0, x: -50 },
  { at: 1, opacity: 1, x: 0, ease: easeOutCubic },
];
/** Staggered reveal window for the i-th item after the panel lands. */
const rev = (i: number) => ({ start: SNAP + 30 + i * 70, budget: 300 });
/** Section hand-off point for a snap panel whose furthest reveal is rev(lastRev):
 *  that reveal's window end + a DWELL buffer, so the panel holds fully revealed
 *  before snapping to the next. */
const holdEnd = (lastRev: number) => rev(lastRev).start + rev(lastRev).budget + DWELL;

/* The slab's photos are the thing that moves on the service panels now. On desktop the
   slab is already home when the panel lands (see FocusPanel), so they start cycling
   straight away — "teniamola gia' in view e cicliamo solamente le foto con lo scroll"
   (NUOVA_TODO.md). They used to be squeezed into what a scrubbed figure left over, which
   is why they only began at 1360.

   PHOTO_CYCLE is how much scroll a panel keeps AFTER its focus has landed, i.e. how slow
   the dissolve is. It is the panel's whole reason to be long: raise it for a more
   leisurely read, lower it to make the page shorter. */
const PHOTO_CYCLE = 900;
/** The photo window for a panel: from the moment it is seated to a beat before it hands
 *  off, so the last photo is not still fading as the next panel takes over. */
const photoWindow = (panelEnd: number) => ({ start: SNAP, end: panelEnd - 150 });

/* Circular wipe for the footer contact table: an SMask spotlight circle whose LEFT edge
   sits just past the box's left and grows rightward, so it ends fully open (a plain
   sliding circle would re-cover what it passes). `x` stays at MASK_LEFT (left edge fixed,
   a touch off-box so the border/corners never clip) while `width=height=2r` and
   `y = cy - r` keep it vertically centred as it grows; `easeInCubic` back-loads the growth
   so the last corner opens right at the end. Tune the constants by eye with the DevHud
   `scroll` readout (Alt-click the table box to read its w,h). */
const MASK_START = 500; // scroll where the wipe begins (after logo/name/role settle)
const MASK_END = 1000; // scroll where it completes — becomes the page's end (last section)
const MASK_LEFT = -80; // circle left edge, just PAST the box's left so the border/corners never clip
const MASK_RADIUS = 460; // final circle radius (px); overshoots the table so it ends fully open
const MASK_CY = 65; // circle vertical centre inside the table box (px, ≈ half its height)
const tableReveal = [
  { at: 0, x: MASK_LEFT, y: MASK_CY, width: 0, height: 0, rounding: 0 },
  { at: 1, x: MASK_LEFT, y: MASK_CY - MASK_RADIUS, width: 2 * MASK_RADIUS, height: 2 * MASK_RADIUS, rounding: 9999, ease: easeInCubic },
];

/** Per-panel scroll ceiling — each `<Section>`'s hand-off threshold, kept here so a
 *  panel's budget and the windows its children are authored against sit side by side.
 *
 *  These used to be load-bearing FAR beyond their own panel: a travelling mascot ran on
 *  a `rawAnim` keyed to the prefix sums of this array, so shortening any panel silently
 *  re-timed the whole page. The mascot is gone (the client asked for it), and with it
 *  that coupling — each entry now only has to satisfy its own panel. Panel 6 has no
 *  `end`; its furthest child window (MASK_END) stands in for it. */
const PANEL_END = [
  600 + DWELL, // 0 hero
  FOCUS_LANDED + PHOTO_CYCLE, // 1 muscolo + focus sport — three photos to get through
  FOCUS_LANDED + PHOTO_CYCLE, // 2 pelvico + focus post parto — two
  FOCUS_LANDED + DWELL, // 3 domiciliare — two photos, but the map is the beat here
  holdEnd(4), // 4 contatti (rev(4) is the form)
  sheetsEnd() + DWELL, // 5 formazione — span fisso, i fogli si spartiscono quello
  MASK_END, // 6 footer
] as const;

/* The shared panel box (and why it's shared) lives in site/panelBox.ts — the focus
   panels are built on the same one. `shell` is that box stacked: every panel authored
   here uses it; the three service panels get theirs from <FocusPanel>. */
const shell = `${PANEL_BOX} flex-col`;
const eyebrow = "font-mono text-sm uppercase tracking-[0.22em] text-primary";
/* `xl:` and not `lg:` for the biggest step: from 1024 the service panels' text column is
   only the ~42% the focus slab leaves it (see FocusPanel), and a 60px heading in ~400px
   wraps into a tower that pushes the panel past its 100svh. It gets its full size once
   there is width to spend. */
const heading = "font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl xl:text-6xl";
const body = "text-lg leading-relaxed text-ink/90 sm:text-xl";
/* Inside a focus slab the type is one step down from the panel's own (it's a sub-beat,
   not a second headline) and inherits the slab's colour, so it works on every ground.
   `short:` trims the heading: the slab is the tallest thing on those panels. */
const focusEyebrow = "font-mono text-[0.72rem] uppercase tracking-[0.2em] opacity-80";
const focusHeading = "mt-2 font-display text-3xl font-semibold leading-tight short:text-2xl sm:text-4xl";
const focusBody = "mt-3 text-base leading-relaxed opacity-90 sm:text-lg";

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-5 w-5 shrink-0 text-secondary" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 8.5 3 3 7-7.5" />
    </svg>
  );
}

function Points({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-3 text-base text-ink/90 sm:text-lg">
          <Check />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A studio photo as the ground of a TEXT panel (contatti, formazione).
 *
 * These two panels have no slab to put a photo in, and no vertical room to put one in
 * flow — panel 4 carries the form and panel 5 the CV, and both have to fit inside 100svh.
 * So the photo goes behind everything, absolutely: it costs zero height and nothing in
 * the a11y tree.
 *
 * The dose lives HERE, not in `intensity`: these grounds are light, so the way to make a
 * duotone recede is to fade the whole layer OVER the ground, not to pile more colour on
 * top of it — that would paint a solid blue rectangle over the panel.
 *
 * ## Choosing `opacity`
 * It used to be a contrast budget, and a tight one: with text sitting directly on the
 * photo, 0.22 was the last value where everything cleared 4.5:1 and the heading went
 * under first, silently. That is the trap the panel had fallen into — it shipped at 0.40,
 * where `text-primary` measures **1.97:1** against the photo's darkest pixel.
 *
 * The fix was not to turn the photo down (the client wanted it MORE visible) but to stop
 * asking it to be a text ground: on contatti the copy and the form now sit on a
 * translucent card, so contrast is measured against near-white and the photo is free to
 * be a photo. Measured with `scripts/check-contrast.mjs`, worst pixel of `studio.webp`:
 *
 *   |                          | on the card (white/85) | bare panel |
 *   | texture 0.55             |                   7.09 |       — |
 *   | texture 0.75  ← shipping |                   6.63 |    1.97 |
 *   | texture 0.85             |                   6.41 |       — |
 *
 * i.e. the card flattens the whole question: every dose in that range is comfortably AA
 * on it, and none of them is legible off it. Formazione has no card, so it stays at the
 * 0.08 default — a whisper, and it already carries the round portrait; two images at the
 * same volume fight.
 *
 * Re-run the script after changing a dose; don't nudge it by eye.
 */
function PanelTexture({ photo, opacity = 0.08 }: { photo: Photo; opacity?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" style={{ opacity }}>
      <DuotonePhoto photo={photo} tint="primary" intensity={0.2} sizes="100vw" className="absolute inset-0" />
    </div>
  );
}

/** Decorative corner brackets (the biglietto da visita motif). `topLeft` is opt-out
 *  because the always-on ContactBar badge sits at top-left (fixed, over every panel)
 *  and the bracket collides with it. */
function Corners({ color = "rgba(255,255,255,0.6)", topLeft = true }: { color?: string; topLeft?: boolean }) {
  const c = "pointer-events-none absolute h-10 w-10";
  return (
    <>
      {topLeft && <span className={`${c} left-6 top-6 border-l-2 border-t-2`} style={{ borderColor: color }} />}
      <span className={`${c} right-6 top-6 border-r-2 border-t-2`} style={{ borderColor: color }} />
      <span className={`${c} bottom-6 left-6 border-b-2 border-l-2`} style={{ borderColor: color }} />
      <span className={`${c} bottom-6 right-6 border-b-2 border-r-2`} style={{ borderColor: color }} />
    </>
  );
}

export default function Home() {
  const year = new Date().getFullYear();
  return (
    <ScrollShell>
      {/* ── 0 · HERO ───────────────────────────────────────────────────────
          Il leitmotiv delle sezioni — una fascia colorata che entra da destra — portato
          qui e suonato AL CARICAMENTO, non allo scroll: il pannello 0 è a schermo a
          scroll 0, quindi ogni sua entrata è una CSS animation (vedi globals.css). */}
      <Section index={0} end={PANEL_END[0]}>
        {/* `max-lg:py-*`: il PANEL_BOX porta `py-24 short:py-12`, budget scritto per il
            desktop. Sul telefono l'hero e' il pannello piu' carico della pagina (ritratto
            + cinque blocchi di testo + indice) e 192px di padding erano la prima cosa da
            restituire. Composto con `short:` invece di lasciarli correre uno contro
            l'altro — sotto lg e sotto 740px di altezza matcherebbero entrambi. */}
        <div className={`${shell} bg-white max-lg:py-8 max-lg:short:py-5 lg:px-0`}>
          {/* ink and not primary: these brackets now cross both halves, and blue at 22%
              disappears on the gold one */}
          <Corners color="rgba(20,33,46,0.25)" topLeft={false} />

          {/* LA METÀ ORO, che è quella del TESTO.
              Ci è arrivata perché la foto è un ritaglio e sull'oro portava un alone
              chiaro attorno ai capelli. Non era una frangia di bordo da erodere: quei
              pixel sono gli ~11k che il flood fill tiene DENTRO di lei (le luci sui
              pantaloni e nei capelli), ed erodere tre volte non li scalfisce. Su oro il
              più chiaro sta 83 livelli SOPRA il fondo, su bianco 29 sotto — cioè
              invisibile. Quindi lei sta sul bianco e l'oro passa di qua.
              Conseguenza da non perdere di vista: su oro `text-primary` regge solo come
              testo GRANDE (3.75:1). Il titolo lo è; tutto il resto è passato a `ink`. */}
          <span
            aria-hidden="true"
            className="fisio-slide-left pointer-events-none absolute inset-y-0 left-0 z-0 hidden bg-secondary lg:block lg:w-[54vw]"
            style={{ animationDelay: "0.10s" }}
          />

          {/* LA LAMA BERRY. Entra da destra insieme all'oro e la fascia bianca la copre
              quasi tutta: quello che avanza è una barra verticale di ~50px, che ora cade
              esattamente sulla cucitura oro/bianco e fa da divisore invece che da bordo.
              Solo da lg — è verticale per definizione. */}
          <span
            aria-hidden="true"
            className="fisio-slide-in pointer-events-none absolute inset-y-0 right-0 z-[1] hidden bg-emphasis lg:block lg:w-[calc(46vw+50px)]"
            style={{ animationDelay: "0.10s" }}
          />

          {/* LA FASCIA BIANCA E IL RITRATTO — deliberatamente UN box, non due.
              Il fondo era oro e ora è bianco, ma la regola non cambia: lo sfondo È di
              questo elemento e la foto è centrata dentro, quindi sono concentrici per
              costruzione a ogni larghezza. Prima erano due cose in due sistemi di
              riferimento diversi e su una finestra da 1883px la foto stava 164px a
              sinistra del centro dell'oro. Non tornare indietro.

              È anche ciò che copre la lama berry lasciandone i 50px. */}
          <div
            className="fisio-slide-in relative z-[2] mb-6 w-full max-w-6xl max-lg:short:mb-4 lg:absolute lg:inset-y-0 lg:right-0 lg:mb-0 lg:flex lg:w-[46vw] lg:max-w-none lg:items-end lg:justify-center lg:bg-white lg:pb-0 lg:pt-12 lg:short:pt-6"
            style={{ animationDelay: "0.22s" }}
          >
            {/* SUL TELEFONO l'oro sta DIETRO AL TESTO e comincia a `top-full`, cioe' esatto
                sul bordo inferiore della foto: cosi' lei POGGIA sulla linea invece di
                fluttuarci sopra. Stava nel blocco del testo con un `-top-8` che doveva
                indovinare il margine fra i due, e i px che avanzavano erano lo stacco.
                Scende oltre la piega (`bottom-[-100svh]`, tagliato dall'overflow-hidden del
                pannello); il filetto berry in alto e' la stessa lama del desktop, girata di
                90°, visto che qui le meta' sono sopra/sotto e non dx/sx. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[-50vw] bottom-[-100svh] top-full border-t-4 border-emphasis bg-secondary lg:hidden"
            />
            {/* La deriva dell'intero gruppo allo scroll. Va verso il BASSO, non verso
                l'alto: adesso lei poggia sul bordo inferiore della videata, e sollevarla
                aprirebbe una striscia bianca sotto ai piedi. Scendendo, invece, il taglio
                dei pantaloni esce dalla piega e non si vede nulla.

                Il cap non ha più un termine in rem — era `34rem` ed era LUI a legare, non
                l'altezza: su 1920x1080 la teneva a 544px in una fascia da 883. Ora i due
                termini sono entrambi relativi alla videata:
                  69svh  è l'ALTEZZA travestita da larghezza. 3:4 vuol dire 1.33x più alta
                         che larga, quindi 69svh di larghezza sono ~92svh di altezza: piena
                         fino in fondo, con ~8svh di aria sopra la testa. Alzalo e le tagli
                         la testa (il pannello è overflow-hidden).
                  39vw   guarda l'altro asse: la fascia è 46vw, quindi le lascia ~3.5vw di
                         aria per lato. È il termine che lega sotto i 16:9 — su 1024x768
                         risolve a 399px dentro 471px di fascia.
                Senza lo scale finale (vedi HeroPortrait) questi numeri sono la misura vera
                a schermo, non una misura a riposo da moltiplicare. */}
            <SDiv
              start={0}
              budget={600}
              anim={[
                { at: 0, y: 0 },
                { at: 1, y: 14 },
              ]}
              className="relative mx-auto w-[min(13rem,24svh)] sm:w-[min(16rem,28svh)] lg:mx-0 lg:w-[min(69svh,39vw)]"
            >
              <HeroPortrait />
            </SDiv>
          </div>

          {/* IL TESTO — `self-start` perché il pannello è `flex-col items-center`, quindi
              l'asse trasversale è orizzontale: senza, un box da 54vw finirebbe centrato
              nella viewport e sotto la fascia bianca.
              Dentro, tutto è CENTRATO (richiesta del cliente) e `mx-auto`: il testo sta al
              centro della metà ORO esattamente come il ritratto sta al centro di quella
              bianca. Aveva già avuto due giri di "lo spazio è distribuito male" da
              `ml-auto`. */}
          {/* `54vw - 50px` e non `54vw`: la colonna si ferma dove comincia la lama berry,
              così è centrata nell'oro VISIBILE. A 54vw pieni, su una finestra da 1024 il
              bordo destro del testo finiva 5px sotto la lama. */}
          <div className="relative z-10 w-full max-w-6xl text-center lg:w-[calc(54vw-50px)] lg:max-w-none lg:self-start">
            <div className="relative mx-auto max-w-[34rem] lg:px-10">
              <p className="fisio-rise font-mono text-xs uppercase tracking-[0.28em] text-ink/80 sm:text-sm" style={{ animationDelay: "0.05s" }}>
                {HERO.kicker}
              </p>
              {/* l'unico blu su fondo oro, e può esserlo perché è testo GRANDE: 3.75:1
                  passa il minimo WCAG per il large text (3:1), non quello per il corpo */}
              {/* `clamp` e non due gradini: sotto sm il nome e' lungo 18 caratteri e il
                  costo di mandarlo a capo e' una riga intera del budget del pannello. Legato
                  alla LARGHEZZA sta su una riga da 320px in su, e il tetto e' la misura di
                  prima. */}
              <h1 className="fisio-rise mt-3 font-display text-[clamp(1.7rem,8vw,2.6rem)] font-semibold leading-[1.02] tracking-tight text-primary sm:text-6xl lg:text-7xl" style={{ animationDelay: "0.15s" }}>
                {HERO.name}
              </h1>
              {/* il ruolo fra due stanghette, ora BLU: l'oro su oro sparirebbe. Un filetto
                  è un elemento non testuale, quindi la soglia è 3:1 e il blu la passa. */}
              <p className="fisio-rise mt-3 flex items-center justify-center gap-3 font-display text-xl italic text-ink short:mt-2 sm:text-2xl" style={{ animationDelay: "0.28s" }}>
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-primary sm:w-10" />
                {HERO.role}
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-primary sm:w-10" />
              </p>
              <p className="fisio-rise mx-auto mt-5 max-w-md text-base leading-relaxed text-ink/85 short:mt-3 sm:text-lg" style={{ animationDelay: "0.42s" }}>
                {HERO.tagline}
              </p>
              {/* Dov'è lo studio, al posto del CTA + numero che stavano qui: chi arriva
                  sul sito di una fisioterapista vuole prima sapere DOVE. Telefono ed email
                  restano a un tap nella targhetta in alto a sinistra e nel footer. */}
              <div className="fisio-rise mt-6 flex flex-col items-center gap-1.5 short:mt-4" style={{ animationDelay: "0.56s" }}>
                <p className="flex items-start justify-center gap-2 text-sm leading-relaxed text-ink/85 sm:text-base">
                  <span className="mt-0.5 shrink-0 text-primary">
                    <PinIcon />
                  </span>
                  <span>
                    {CONTACT.address.line1}, {CONTACT.address.line2} — {CONTACT.address.city}
                  </span>
                </p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink/75">
                  {CONTACT.note}
                </p>
              </div>
              {/* l'indice della pagina — dà al pannello un bordo inferiore e una gerarchia,
                  e ogni voce scorre fino alla sua sezione (vedi useSectionJump) */}
              <div className="fisio-rise mt-6 short:mt-5" style={{ animationDelay: "0.7s" }}>
                <ServiceIndex className="mx-auto max-w-md" />
              </div>
            </div>
          </div>

          {/* scroll hint — visible at rest, fades as you begin. Solo da lg: sul telefono
              e' centrato in basso esattamente dove finisce l'indice, e li' non c'e' un
              pixel da regalare. La fascia oro che esce dalla piega dice gia' "continua". */}
          <SDiv
            start={0}
            budget={200}
            anim={[
              { at: 0, opacity: 1, y: 0 },
              { at: 1, opacity: 0, y: 8 },
            ]}
            className="absolute inset-x-0 bottom-8 z-10 hidden flex-col items-center gap-1 text-ink/80 lg:flex"
          >
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em]">{HERO.scrollHint}</span>
            <span aria-hidden="true" className="text-lg leading-none">↓</span>
          </SDiv>
        </div>
      </Section>


      {/* ── 1 · MUSCOLOSCHELETRICO (+ focus sport, entra da destra) ───────────
          La sequenza dei servizi e il "focus a destra" sono richiesta del cliente
          (CLIENTE_TODO.md §2): la parte sportiva non è più un pannello a sé, è il
          focus di questo. Il device sta in FocusPanel — qui si autora solo il
          contenuto delle due metà. */}
      <Section index={1} snap={SNAP} end={PANEL_END[1]}>
        <FocusPanel
          ground="bg-white"
          slab="bg-emphasis text-white"
          backdrop={
            /* Quello che la fascia indossa mentre il testo e' ancora fuori scena: su
               desktop e' l'unica cosa che si vede all'arrivo del pannello. Ordine del
               racconto: valutazione, terapia manuale, ritorno al gesto sportivo. */
            <PhotoSlab
              photos={[PHOTOS.spalla, PHOTOS.manuale, PHOTOS.equilibrio]}
              tint="emphasis"
              intensity={0.42}
              {...photoWindow(PANEL_END[1])}
            />
          }
          focus={
            <>
              <div className="relative z-10 max-w-md">
                <p className={focusEyebrow}>{SERVICES.sport.eyebrow}</p>
                <h3 className={focusHeading}>{SERVICES.sport.title}</h3>
                <p className={focusBody}>{SERVICES.sport.body}</p>
              </div>

              {/* Milano Cortina 2026 — the JPEG's own ground is exactly --brand-emphasis
                  (see globals.css), so it sits on the slab with no visible box. The
                  Olimpiadi beat signs the focus off rather than owning a panel. */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <Image
                  src="/olimpiadi_cortina.jpeg"
                  alt="Milano Cortina 2026"
                  width={399}
                  height={501}
                  className="h-28 w-auto short:h-20"
                />
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/75">
                  {SERVICES.sport.olimpiadi.caption}
                </p>
              </div>

              <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-4 font-display text-[11rem] leading-none text-white/10">
                ◎
              </span>
            </>
          }
        >
          <SDiv {...rev(0)} anim={UP} className="mb-4">
            <p className={eyebrow}>{SERVICES.muscolo.eyebrow}</p>
          </SDiv>
          <SDiv {...rev(1)} anim={UP} className="mb-6">
            <h2 className={heading}>{SERVICES.muscolo.title}</h2>
          </SDiv>
          <SDiv {...rev(2)} anim={UP} className="mb-6">
            <p className={body}>{SERVICES.muscolo.body}</p>
          </SDiv>
          <SDiv {...rev(3)} anim={UP}>
            <Points items={SERVICES.muscolo.points} />
          </SDiv>
        </FocusPanel>
      </Section>

      {/* ── 2 · PAVIMENTO PELVICO (+ focus post parto) ────────────────────── */}
      <Section index={2} snap={SNAP} end={PANEL_END[2]}>
        <FocusPanel
          ground="bg-mist"
          slab="bg-primary text-white"
          backdrop={
            /* Finalmente due foto anche qui: era l'unica fascia senza, e teneva ancora
               il disegno animato del ponte. Il gesto prima, poi il luogo — e il lettino
               vuoto e' anche l'unico scatto dello studio senza pazienti dentro.
               `multiply` (il default) perche' il testo sopra e' bianco: vedi la tabella
               di contrasto in DuotonePhoto prima di cambiarlo. */
            <PhotoSlab
              photos={[PHOTOS.pelvico, PHOTOS.lettino]}
              tint="primary"
              intensity={0.42}
              {...photoWindow(PANEL_END[2])}
            />
          }
          focus={
            <>
              {/* `relative z-10`: prima non serviva, questa fascia non aveva fondo
                  fotografico. Ora si'. */}
              <div className="relative z-10 max-w-md">
                <p className={focusEyebrow}>{SERVICES.pelvico.postParto.eyebrow}</p>
                <h3 className={focusHeading}>{SERVICES.pelvico.postParto.title}</h3>
                <p className={focusBody}>{SERVICES.pelvico.postParto.body}</p>
              </div>
            </>
          }
        >
          <SDiv {...rev(0)} anim={UP} className="mb-4">
            <p className={eyebrow}>{SERVICES.pelvico.eyebrow}</p>
          </SDiv>
          <SDiv {...rev(1)} anim={UP} className="mb-6">
            <h2 className={heading}>{SERVICES.pelvico.title}</h2>
          </SDiv>
          <SDiv {...rev(2)} anim={UP} className="mb-6">
            <p className={body}>{SERVICES.pelvico.body}</p>
          </SDiv>
          <SDiv {...rev(3)} anim={UP}>
            <Points items={SERVICES.pelvico.points} />
          </SDiv>
        </FocusPanel>
      </Section>

      {/* ── 3 · ANZIANI / DOMICILIARE (+ focus mappa) ─────────────────────── */}
      <Section index={3} snap={SNAP} end={PANEL_END[3]}>
        <FocusPanel
          ground="bg-white"
          slab="bg-secondary text-primary"
          backdrop={
            /* The only slab with DARK text on it, so it screens instead of multiplying
               — gold multiplied by a photo goes brown and takes text-primary down to
               ~1:1. Screened it floors at 4.25:1, which is the flat gold's own value,
               and that is what buys the low `intensity`: the photo can carry the slab
               here more than it does on the fuchsia one. */
            <PhotoSlab
              photos={[PHOTOS.palla, PHOTOS.step]}
              tint="secondary"
              intensity={0.3}
              blend="screen"
              {...photoWindow(PANEL_END[3])}
            />
          }
          focus={
            <>
              <div className="relative z-10 max-w-md">
                <p className={focusEyebrow}>{SERVICES.domiciliare.zona.eyebrow}</p>
                <h3 className={focusHeading}>{SERVICES.domiciliare.zona.title}</h3>
                <p className={focusBody}>{SERVICES.domiciliare.zona.body}</p>
              </div>

              {/* Una card appoggiata sulla fascia, non il piatto forte: la fascia ha gia'
                  le sue foto, e il box chiaro con l'ombra e' cio' che la stacca da sotto.
                  Il cap `short:` sale da 12rem a 16rem — a 12 i controlli dell'embed
                  (zoom, fullscreen, pegman, il marchio Google) coprivano la mappa invece
                  di stare in un angolo, ed e' quello che il cliente ha visto sul telefono. */}
              <PadovaMap className="relative z-10 max-w-[25rem] shadow-xl shadow-primary/20 short:max-w-[16rem]" />
            </>
          }
        >
          <SDiv {...rev(0)} anim={UP} className="mb-4">
            <p className={eyebrow}>{SERVICES.domiciliare.eyebrow}</p>
          </SDiv>
          <SDiv {...rev(1)} anim={UP} className="mb-6">
            <h2 className={heading}>{SERVICES.domiciliare.title}</h2>
          </SDiv>
          <SDiv {...rev(2)} anim={UP} className="mb-4">
            <p className={body}>{SERVICES.domiciliare.body}</p>
          </SDiv>
          {/* Il raggio d'azione si dice QUI, a parole. Era un anello tratteggiato
              disegnato sulla mappa, che per stare dentro voleva un'inquadratura da 120 km
              — a quello zoom la mappa era una forma del Veneto senza una via leggibile. */}
          <SDiv {...rev(3)} anim={UP}>
            <p className="font-mono text-sm text-primary">{SERVICES.domiciliare.zona.range}</p>
          </SDiv>
        </FocusPanel>
      </Section>

      {/* ── 4 · CONTATTAMI ───────────────────────────────────────────────── */}
      <Section index={4} snap={SNAP} end={PANEL_END[4]}>
        <div className={`${shell} bg-white`}>
          {/* Lo studio dietro al form: "vieni qui" detto dall'ambiente invece che a
              parole, e ora abbastanza presente da vedersi davvero. */}
          <PanelTexture photo={PHOTOS.studio} opacity={0.75} />

          {/* La card. Non e' decorazione: e' cio' che permette alla foto di salire. Il
              testo smette di essere misurato contro la fotografia (dove `text-primary`
              stava a 1.97:1) e torna a esserlo contro un quasi-bianco, dove ogni riga sta
              sopra 5:1 — vedi la tabella su PanelTexture. `backdrop-blur` non e' solo
              gusto: sfoca cio' che le sta dietro, quindi riduce anche la varianza del
              fondo, cioe' proprio la grandezza che rende infido un ground fotografico. */}
          <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white/85 p-8 shadow-xl shadow-primary/10 ring-1 ring-primary/10 backdrop-blur-md short:p-5 sm:p-10">
            <SDiv {...rev(0)} anim={UP} className="mb-3 text-center">
              <p className={eyebrow}>{CONTACT_COPY.eyebrow}</p>
            </SDiv>
            <SDiv {...rev(1)} anim={UP} className="mb-3 text-center">
              <h2 className={heading}>{CONTACT_COPY.title}</h2>
            </SDiv>
            <SDiv {...rev(2)} anim={UP} className="mb-2 text-center">
              <p className={`${body} mx-auto max-w-xl`}>{"Raccontami di cosa hai bisogno:"}</p>
            </SDiv>
            <SDiv {...rev(3)} anim={RIGHT} className="mb-7 text-center font-contact italic short:mb-5">
              <p className={`${body} mx-auto max-w-xl`}>{"ti ricontatto per fissare un appuntamento."}</p>
            </SDiv>
            <SDiv {...rev(4)} anim={UP}>
              <ContactForm />
            </SDiv>
          </div>
        </div>
      </Section>

      {/* ── 5 · FORMAZIONE / CV ──────────────────────────────────────────────
          Chiude la pagina prima del footer, come chiesto ("alla fine di tutto",
          CLIENTE_TODO.md §4): chi è già convinto ha appena visto il form, chi vuole
          verificare le credenziali le trova qui. Le voci sono quelle vere del CV; il
          pannello le sfoglia invece di allungarsi (vedi CvSheets). */}
      <Section index={5} snap={SNAP} end={PANEL_END[5]}>
        <div className={`${shell} bg-mist`}>
          {/* Resta un sussurro, e diverso da quello dei contatti: questo pannello ha
              già il ritratto tondo, due immagini alla stessa voce si darebbero fastidio. */}
          <PanelTexture photo={PHOTOS.cervicaleLargo} />

          {/* Il ritratto (scatto #4 del brief, "chi sono") sul pannello del CV. Sta in
              un angolo in assoluto, come la figura del footer, perché questo pannello
              deve restare dentro 100svh: in flusso costerebbe altezza, qui costa zero.
              `xl:` e non `lg:` — sotto i 1280 il margine laterale non basta e finirebbe
              sopra la timeline. */}
          <SDiv
            {...rev(2)}
            anim={UP}
            className="pointer-events-none absolute bottom-12 right-10 hidden xl:block"
          >
            <Image
              src={PHOTOS.ritrattoTondo.src}
              alt={PHOTOS.ritrattoTondo.alt}
              width={PHOTOS.ritrattoTondo.width}
              height={PHOTOS.ritrattoTondo.height}
              sizes="9rem"
              className="size-36 rounded-full object-cover ring-4 ring-white/70"
            />
          </SDiv>

          <div className="relative z-10 w-full max-w-4xl">
            <SDiv {...rev(0)} anim={UP} className="mb-4 text-center">
              <p className={eyebrow}>{FORMAZIONE.eyebrow}</p>
            </SDiv>
            <SDiv {...rev(1)} anim={UP} className="mb-4 text-center">
              <h2 className={heading}>{FORMAZIONE.title}</h2>
            </SDiv>
            <SDiv {...rev(2)} anim={UP} className="mb-7 text-center short:mb-4">
              <p className={`${body} mx-auto max-w-2xl`}>{FORMAZIONE.intro}</p>
            </SDiv>
            {/* I quattro fogli del CV, che si sovrappongono scorrendo. Un CV più lungo
                aggiunge PAGINE, non altezza: il pannello deve stare in 100svh. */}
            <SDiv {...rev(3)} anim={UP}>
              <CvSheets pages={FORMAZIONE.pages} />
            </SDiv>
          </div>
        </div>
      </Section>

      {/* ── 6 · FOOTER ───────────────────────────────────────────────────── */}
      <Section index={6} snap={SNAP}>
        <div className={`${shell} bg-primary text-white`}>
          <Corners color="rgba(255,255,255,0.35)" topLeft={false} />

          {/* The line figure signs off here (it left the hero to the photo).
              `draw={false}` — the on-load stroke-in would be long over by the time you
              scroll this far, so it just fades up with the panel. */}
          <SDiv
            {...rev(2)}
            anim={UP}
            className="pointer-events-none absolute bottom-10 right-8 hidden w-24 sm:block lg:w-32"
          >
            <HeroFigure className="h-auto w-full" draw={false} stroke="rgba(255,255,255,0.45)" />
          </SDiv>
          <div className="w-full max-w-3xl text-center">
            <SDiv {...rev(0)} anim={UP} className="mb-5 flex justify-center">
              <Logo size={56} color="#ffffff" />
            </SDiv>
            <SDiv {...rev(1)} anim={UP} className="mb-1">
              <h2 className="font-display text-4xl font-semibold sm:text-5xl">{CONTACT.name}</h2>
            </SDiv>
            <SDiv {...rev(2)} anim={UP} className="mb-8">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/80">{CONTACT.role}</p>
            </SDiv>
            {/* Contact table — the clipped parent; SMask spotlights it open as we scroll to the end. */}
            <div className="relative mx-auto grid max-w-3xl overflow-hidden rounded-2xl border border-white/25 font-contact text-base text-white/90 sm:grid-cols-2 sm:text-left sm:text-lg">
              <SMask invert start={MASK_START} end={MASK_END} anim={tableReveal} />
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex min-w-0 items-center gap-3 border-b border-white/15 px-7 py-5 transition-colors hover:text-secondary sm:border-r"
              >
                <MailIcon className="h-5 w-5 shrink-0" /> {CONTACT.email}
              </a>
              <a
                href={`tel:${CONTACT.phoneHref}`}
                className="flex min-w-0 items-center gap-3 border-b border-white/15 px-7 py-5 transition-colors hover:text-secondary"
              >
                <PhoneIcon className="h-5 w-5 shrink-0" /> <span className="break-words">{CONTACT.phoneDisplay}</span>
              </a>
              <span className="flex min-w-0 items-start gap-3 px-7 py-5 sm:col-span-2">
                <PinIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  {CONTACT.address.line1}, {CONTACT.address.line2} — {CONTACT.address.city}
                </span>
              </span>
            </div>

            {/* Pill + copyright keep the normal fade-in. */}
            <SDiv {...rev(3)} anim={UP}>
              <div className="mt-8 inline-block rounded-full bg-white/10 px-4 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-secondary">
                {CONTACT.note}
              </div>
              <p className="mt-10 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/60">
                © {year} {CONTACT.name} · Fisioterapia · Padova
              </p>
            </SDiv>
          </div>
        </div>
      </Section>

      {/* Always-visible quick-contact badge (portaled to body). */}
      <ContactBar />

      {process.env.NODE_ENV === "development" && <DevHud />}
    </ScrollShell>
  );
}
