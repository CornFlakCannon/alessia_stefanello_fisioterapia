"use client";

import Image from "next/image";

import { Section } from "./_scroll";
import { easeInCubic, easeOutCubic } from "./_scroll/easing";
import ScrollShell from "./ScrollShell";
import SDiv from "./widgets/SDiv";
import type { AnimSpec } from "./widgets/anim";
import SMask from "./widgets/SMask";
import DevHud from "./widgets/DevHud";

import { asset } from "./site/basePath";
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
import StepScroller from "./site/StepScroller";
import { Stop } from "./site/useStops";
import { useIsDesktop, useIsShort } from "./site/useViewport";
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
const holdEnd = (lastRev: number) => revEnd(lastRev) + DWELL;
/** Where the i-th reveal is fully played — what a stop (`<Stop>`) after it waits for. */
const revEnd = (i: number) => rev(i).start + rev(i).budget;

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
  1100, // 0 hero — TELEFONO: la card oro finisce di salire a 740 (SHEET_RISE) e tiene un poco. Su desktop vale HERO_END_DESKTOP, vedi la'
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
/* Il ritratto NON si muove allo scroll, su nessun viewport. C'era una deriva verso il basso
   (`y: 0 -> 14`, solo desktop) e se n'e' andata: un movimento di 14px senza un motivo
   narrativo spezzava il flusso della pagina e basta. Sul telefono era gia' ferma. */
const NO_DRIFT: AnimSpec = [];

/* SOLO TELEFONO: la coda dell'hero (indirizzo e indice) entra SCORRENDO invece che al
   caricamento.
   Il pannello 0 ha 1100 unita' di scroll da spendere e sul telefono non le spendeva per
   niente — nessuna animazione dal primo pixel all'ultimo, quindi lo scroll dentro l'hero
   si sentiva come un ritardo prima della pagina vera. Su desktop quel budget lo consumano
   la deriva del ritratto e lo scroll hint; sul telefono entrambi sono spenti.

   Questo va CONTRO la regola del pannello 0 ("e' a schermo a scroll 0, quindi niente
   reveal scroll-gated, o arriva vuoto") ed e' deliberato: qui la meta' bassa dell'hero
   diventa una rivelazione progressiva, non contenuto che deve esserci all'arrivo. Il
   prezzo, da sapere: chi atterra e non scorre non vede indirizzo e indice. Sopra la piega
   restano foto, nome, ruolo e la frase di posizionamento — cioe' tutto quello che serve a
   capire chi e' e cosa fa.

   Nel primo giro questi due erano l'UNICA cosa che si muoveva, e il risultato era il
   difetto opposto: sotto la foto restavano ~220px di oro vuoto a scroll 0. Ora quello
   spazio se lo prende la foto (74svh) e questi due stanno SOTTO la piega, portati in vista
   dalla salita della card (SHEET_RISE). Le finestre qui sotto servono ancora, ma solo a
   dosare l'opacita' DENTRO quella corsa: entrambe finiscono prima dei 740 in cui la card
   si ferma, cosi' nulla arriva ancora trasparente a corsa conclusa. */
const MOB_ADDRESS = { start: 200, budget: 300 };
const MOB_INDEX = { start: 420, budget: 320 };
/* Sul telefono l'unico movimento verticale e' quello della card (vedi sotto): questi due
   blocchi arrivano SOLO in dissolvenza. Con `UP` avrebbero un `y: 24 -> 0` che si sommerebbe
   alla salita, cioe' due cose che si muovono l'una contro l'altra nello stesso momento. */
const MOB_FADE: AnimSpec = [
  { at: 0, opacity: 0 },
  { at: 1, opacity: 1, ease: easeOutCubic },
];

/* SOLO TELEFONO: LA CARD ORO CHE SALE.
   A scroll 0 la foto e' una fascia alta 74svh e sotto resta l'oro con nome, ruolo e
   frase di posizionamento — il minimo che questo pannello deve avere sopra la piega. Il
   resto (indirizzo e indice) sta SOTTO la piega e ci arriva perche' la card sale.

   Perche' la foto sta ferma e sale solo la card: e' il modo di non muovere due cose insieme,
   e soprattutto lei ha ~55px di aria sopra il cranio: qualunque traslazione verso l'alto,
   anche una parallasse blanda, glielo rifila (il pannello e' overflow-hidden).

   ## SHEET_DY non e' una scelta di gusto, ed e' l'unica manopola da ritoccare a occhio
   Da sotto: la card deve finire la corsa con tutto il suo contenuto dentro la videata, quindi
   il minimo e' `banda + contenuto - (altezza - padding)`. Su un 390x844 fa 625 + ~442 - 812
   = 255, e 250 e' quello con un filo di respiro in meno sul fondo.

   Da sopra: quel numero decide DOVE la card la taglia, e la formula e' corta —
   la banda mostra tutte e 1217 le righe del ritaglio, quindi a fine corsa se ne vedono

       righe = 1217 * (1 - SHEET_DY / banda)

   contate dalla riga 158 del sorgente. I riferimenti sul suo corpo: mento 859, collo 887,
   attacco spalle 900. Con 250 su una banda di 625 vengono 730 righe, cioe' y=888: il collo,
   che e' l'assetto approvato ("testa e collo dietro la card"). Alzalo e sale sul mento;
   abbassalo e la coda dell'indice resta sotto la piega. Non guardarlo come px, guardalo con questa
   formula — e' il motivo per cui `short:` ha una banda molto piu' bassa (56svh e non 70): li'
   la videata e' 667 e con una banda alta il RAPPORTO dy/banda esplode, tagliandola in faccia.

   ATTENZIONE: 1217 e 158 non sono costanti di questo file — escono da `MOB_BOTTOM` in
   `scripts/hero-cutout.mjs`. Una foto nuova che la inquadra piu' stretta sposta l'atterraggio
   senza che qui cambi niente (e' successo: il sorgente del 2026-09 le inquadra la testa il 14%
   piu' grande, e con il vecchio ritaglio la card le finiva sulla mascella). Se cambi la foto,
   la manopola da ritoccare e' MOB_BOTTOM di la', non SHEET_DY di qua.

   Conseguenza aritmetica da tenere presente: l'altezza FINALE della foto la decide il
   contenuto della card, non l'altezza a riposo. "3/4 a riposo" e' quindi gratis. */
const SHEET_RISE = { start: 120, budget: 620 }; // finisce a 740, dentro i 1100 del pannello

/* DESKTOP: l'hero se ne va in UN colpo di rotella. Non ha piu' niente da raccontare allo
   scroll — la deriva del ritratto e' stata tolta e l'indirizzo e l'indice sono gia' a
   schermo — quindi tenerlo per 1100 unita' era un'attesa e basta ("non posso dover
   aspettare 1000 di scroll"). ScrollShell tronca ogni evento wheel a ±100, cioe' UNA tacca
   di un mouse classico vale 100 unita': con la soglia a 100 quella tacca dissolve lo
   "scorri" (stessa finestra, vedi sotto) e consegna al pannello 1. Sul telefono resta
   PANEL_END[0], perche' li' la card oro DEVE salire (SHEET_RISE) e ha bisogno della corsa.
   Un `end` diverso per viewport e' l'unico modo: Section lo registra in un effect che
   dipende dalla soglia, quindi il cambio al ridimensionamento viene raccolto. */
const HERO_END_DESKTOP = 100;
const SHEET_DY = 250; // telefono ~390x844, banda 74svh
const SHEET_DY_SHORT = 145; // short: (<=740px di altezza), banda 56svh — vedi la formula
const mobSheet = (dy: number): AnimSpec => [
  { at: 0, y: 0 },
  { at: 1, y: -dy, ease: easeOutCubic },
];

const shell = `${PANEL_BOX} flex-col`;
const eyebrow = "font-mono text-sm uppercase tracking-[0.22em] text-primary";
/* `xl:` and not `lg:` for the biggest step: from 1024 the service panels' text column is
   only the ~42% the focus slab leaves it (see FocusPanel), and a 48px heading in ~400px
   wraps into a tower that pushes the panel past its 100svh. It gets its full size once
   there is width to spend.
   One step down at every breakpoint (was 4xl/5xl/6xl): the client found the jump from
   title to body too dramatic, 60px over a 20px body. Now 30/36/48 over 18/20. */
const heading = "font-display text-3xl font-semibold leading-tight text-primary sm:text-4xl xl:text-5xl";
const body = "text-lg leading-relaxed text-ink/90 sm:text-xl";
/* Inside a focus slab the type is one step down from the panel's own (it's a sub-beat,
   not a second headline) and inherits the slab's colour, so it works on every ground.
   `short:` trims the heading: the slab is the tallest thing on those panels.
   It stepped down WITH `heading`: had it stayed at 3xl/4xl, on a 1024-1279 laptop the
   section title and the slab title would sit side by side at the same 36px. */
const focusEyebrow = "font-mono text-[0.72rem] uppercase tracking-[0.2em] opacity-80";
const focusHeading = "mt-2 font-display text-2xl font-semibold leading-tight short:text-xl sm:text-3xl";
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
  const desktop = useIsDesktop();
  const shortView = useIsShort();
  return (
    <ScrollShell>
      {/* ── 0 · HERO ───────────────────────────────────────────────────────
          Il leitmotiv delle sezioni — una fascia colorata che entra da destra — portato
          qui e suonato AL CARICAMENTO, non allo scroll: il pannello 0 è a schermo a
          scroll 0, quindi ogni sua entrata è una CSS animation (vedi globals.css). */}
      <Section index={0} end={desktop ? HERO_END_DESKTOP : PANEL_END[0]}>
        <StepScroller />
        {/* Stop: sul telefono la card oro sale (SHEET_RISE) — un blocco. Su desktop
            l'hero non ha niente da raccontare, e il primo gesto porta al pannello 1. */}
        {!desktop && <Stop at={SHEET_RISE.start + SHEET_RISE.budget} />}
        {/* Due override locali, e sono la stessa frase detta due volte: sul telefono questa
            colonna ECCEDE il pannello di proposito — la coda della card sta sotto la piega
            finche' la salita non la porta su.
              · `justify-start` perche' il `justify-center` di PANEL_BOX distribuirebbe
                l'eccedenza meta' sopra e meta' sotto, cioe' le taglierebbe il cranio;
              · `h-[100svh]` perche' `min-h-[100svh]` da solo CRESCE con il contenuto, e un
                pannello alto 1054 invece di 844 sposta l'offsetTop di tutti quelli dopo
                (l'engine ci aggancia lo scrollTop a ogni frame). Altezza definita, piu'
                l'overflow-hidden che PANEL_BOX ha gia': la coda esiste, sta fuori, e non
                conta. Gli item non si comprimono per starci dentro — `min-height:auto` li
                tiene alla loro altezza di contenuto, e la fascia ha comunque `shrink-0`.
            Locali qui e non su PANEL_BOX: e' questo pannello a essere diverso, non il box.
            Terzo override, su DESKTOP: `lg:py-16 lg:short:py-12` al posto del `py-24` del box.
            La meta' oro porta cinque blocchi piu' un indice a colonna unica (~615px a 1887x907)
            e su un 1366x768 con 96px di padding per lato ne restano 576: sfora. Con 64 ne
            restano 640. Il compound `lg:short:` e' emesso per ultimo da Tailwind, quindi su un
            desktop basso (<=740) vince `py-12` esattamente come gia' faceva `short:py-12`. Lo
            scroll hint sta a `bottom-8`, fuori dal flusso, e con il contenuto centrato non lo
            tocca (su 768 il contenuto finisce a ~700, l'hint comincia li'). */}
        <div className={`${shell} bg-white max-lg:h-[100svh] max-lg:justify-start lg:px-0 lg:py-16 lg:short:py-12`}>
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
              quasi tutta: quello che avanza è una barra verticale larga `--hero-blade`
              (globals.css — 36px, era 50 e il cliente l'ha voluta più sottile), che cade
              esattamente sulla cucitura oro/bianco e fa da divisore invece che da bordo.
              Solo da lg — è verticale per definizione. */}
          <span
            aria-hidden="true"
            className="fisio-slide-in pointer-events-none absolute inset-y-0 right-0 z-[1] hidden bg-emphasis lg:block lg:w-[calc(46vw_+_var(--hero-blade))]"
            style={{ animationDelay: "0.10s" }}
          />

          {/* LA FASCIA BIANCA E IL RITRATTO — deliberatamente UN box, non due.
              Il fondo era oro e ora è bianco, ma la regola non cambia: lo sfondo È di
              questo elemento e la foto è centrata dentro, quindi sono concentrici per
              costruzione a ogni larghezza. Prima erano due cose in due sistemi di
              riferimento diversi e su una finestra da 1883px la foto stava 164px a
              sinistra del centro dell'oro. Non tornare indietro.

              È anche ciò che copre la lama berry lasciandone la barra `--hero-blade`.

              SUL TELEFONO lo stesso box è una FASCIA a tutta videata, alta 74svh, che sborda
              il `px-6`/`py-8` del pannello (`w-[100vw]` centrato da `items-center`, più un
              `-mt-8` che annulla il padding alto). Tre cose da non toccare separatamente:
                · `shrink-0` — l'asse principale di questa colonna è VERTICALE e la colonna
                  eccede il pannello di proposito, quindi senza questo il flex comprime
                  proprio la fascia per far tornare i conti;
                · `min(100vw, 74svh)` — non è un vezzo, è metà della garanzia che
                  `object-cover` non le tagli il cranio: box mai più largo che alto, sorgente
                  quadrata (l'altra metà sta in hero-cutout.mjs). Vedi HeroPortrait. Su ogni
                  telefono vince `100vw` (74svh di 844 sono 625, ben più di 390) e la fascia è
                  a tutta larghezza; su uno schermo basso e largo vince l'altra e diventa un
                  quadrato centrato — che è la forma corretta lì, non un ripiego;
                · `short:` scende a 56svh, e NON per far stare le cose: su 667px di altezza
                  una banda alta fa esplodere il rapporto SHEET_DY/banda, che è ciò che decide
                  dove la card la taglia. Vedi la formula su SHEET_DY;
                · niente `mb`: la card oro comincia ESATTAMENTE sul bordo inferiore della
                  foto, altrimenti il filetto berry non è più la linea su cui lei poggia. */}
          <div
            className="fisio-slide-in relative z-[2] max-lg:-mt-8 max-lg:h-[74svh] max-lg:w-[min(100vw,74svh)] max-lg:shrink-0 max-lg:short:-mt-5 max-lg:short:h-[56svh] max-lg:short:w-[min(100vw,56svh)] lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:w-[46vw] lg:items-end lg:justify-center lg:bg-white lg:pb-0 lg:pt-12 lg:short:pt-6"
            style={{ animationDelay: "0.22s" }}
          >
            {/* Il ritratto sta FERMO: niente SDiv, e' una div. Se mai tornasse una deriva,
                verso il BASSO e non verso l'alto: lei poggia sul bordo inferiore della
                videata, e sollevarla aprirebbe una striscia bianca sotto ai piedi.

                Il cap non ha più un termine in rem — era `34rem` ed era LUI a legare, non
                l'altezza: su 1920x1080 la teneva a 544px in una fascia da 883. Ora i due
                termini sono entrambi relativi alla videata, e i numeri vengono dal RITAGLIO
                (public/foto/hero.webp, 1100x1467): il cranio sta alla riga 97, cioe' al 6.6%
                dell'altezza — quello e' l'unico margine che conta, non l'aria della box.
                  76svh  è l'ALTEZZA travestita da larghezza. 3:4 vuol dire 1.33x più alta
                         che larga, quindi 76svh di larghezza sono ~101svh di altezza: la box
                         sfora la videata in alto di ~1svh, ma sono righe TRASPARENTI sopra il
                         cranio, che resta a ~5svh dal bordo (~45px su 907). Era 69 (92svh di
                         altezza, cranio a ~14svh = 125px di aria: troppa). Alzalo ancora e le
                         tagli la testa (il pannello è overflow-hidden).
                  42vw   guarda l'altro asse: la fascia è 46vw, quindi le lascia 2vw di aria
                         per lato (38px a 1920). È il termine che lega sui 16:9 e sotto — su
                         1920x1080 risolve a 806px (alta 1075, cranio a ~76px), su 1366x768 a
                         574 (cranio a ~53px), su 1024x768 a 430 dentro 471 di fascia. Era 39,
                         e sui 16:9 legava GIA' lui: alzare solo il termine svh non l'avrebbe
                         ingrandita di un pixel su quegli schermi.
                Senza lo scale finale (vedi HeroPortrait) questi numeri sono la misura vera
                a schermo, non una misura a riposo da moltiplicare. */}
            <div className="relative mx-auto max-lg:h-full max-lg:w-full lg:mx-0 lg:w-[min(76svh,42vw)]">
              <HeroPortrait />
            </div>
          </div>

          {/* IL TESTO — `self-start` perché il pannello è `flex-col items-center`, quindi
              l'asse trasversale è orizzontale: senza, un box da 54vw finirebbe centrato
              nella viewport e sotto la fascia bianca.
              Dentro, tutto è CENTRATO (richiesta del cliente) e `mx-auto`: il testo sta al
              centro della metà ORO esattamente come il ritratto sta al centro di quella
              bianca. Aveva già avuto due giri di "lo spazio è distribuito male" da
              `ml-auto`. */}
          {/* `54vw - var(--hero-blade)` e non `54vw`: la colonna si ferma dove comincia la
              lama berry, così è centrata nell'oro VISIBILE. A 54vw pieni, su una finestra da
              1024 il bordo destro del testo finiva 5px sotto la lama. Gli underscore sono
              spazi: `calc` li vuole attorno a `+`/`-`, e `54vw-var(` è proprio il token che
              la spaziatura automatica di Tailwind potrebbe non spezzare. */}
          <SDiv
            {...SHEET_RISE}
            anim={desktop ? NO_DRIFT : mobSheet(shortView ? SHEET_DY_SHORT : SHEET_DY)}
            className="relative z-10 w-full max-w-6xl text-center lg:w-[calc(54vw_-_var(--hero-blade))] lg:max-w-none lg:self-start"
          >
            {/* SUL TELEFONO l'oro sta DIETRO AL TESTO e comincia a `top-0` — che, non
                essendoci margine sulla foto, È il suo bordo inferiore: lei POGGIA sulla
                linea invece di fluttuarci sopra. Stava nel wrapper della foto, con `top-full`
                a dire la stessa cosa; è passato di qua perché ora è questo gruppo a MUOVERSI
                (SHEET_RISE) e la fascia deve salire con il testo che contiene — è la card.
                Scende oltre la piega (`bottom-[-100svh]`, tagliato dall'overflow-hidden del
                pannello), il che è anche ciò che le dà la corsa: il contenuto sotto la piega
                è quello che la salita porta in vista. Il filetto berry in alto è la stessa
                lama del desktop girata di 90°, visto che qui le metà sono sopra/sotto. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[-50vw] bottom-[-100svh] top-0 z-0 border-t-4 border-emphasis bg-secondary lg:hidden"
            />
            {/* `xl:max-w-[40rem]`: l'indirizzo completo ("Viale … 3° piano — Padova (PD)") misura
                ~535px a text-base piu' il pin, e in 34rem meno il `px-10` (464px) andava a capo
                su "Padova (PD)". In 40rem ne restano 560: una riga. Solo da `xl` perche' fra
                1024 e 1279 l'oro visibile e' 503-641px e non c'e' spazio per la colonna larga:
                li' l'indirizzo va ancora a capo, e va bene cosi'. Niente `whitespace-nowrap`:
                se le metriche del font non tornano deve andare a capo, non uscire dall'oro. */}
            <div className="relative z-10 mx-auto max-w-[34rem] max-lg:pt-6 max-lg:short:pt-4 lg:px-10 xl:max-w-[40rem]">
              {/* l'unico blu su fondo oro, e può esserlo perché è testo GRANDE: 3.75:1
                  passa il minimo WCAG per il large text (3:1), non quello per il corpo */}
              {/* `clamp` e non due gradini: sotto sm il nome e' lungo 18 caratteri e il
                  costo di mandarlo a capo e' una riga intera del budget del pannello. Legato
                  alla LARGHEZZA sta su una riga da 320px in su, e il tetto e' la misura di
                  prima. */}
              <h1 className="fisio-rise font-display text-[clamp(1.7rem,8vw,2.6rem)] font-semibold leading-[1.02] tracking-tight text-primary sm:text-6xl lg:text-7xl" style={{ animationDelay: "0.15s" }}>
                {HERO.name}
              </h1>
              {/* il ruolo fra due stanghette, ora BLU: l'oro su oro sparirebbe. Un filetto
                  è un elemento non testuale, quindi la soglia è 3:1 e il blu la passa. */}
              <p className="fisio-rise mt-3 flex items-center justify-center gap-3 font-display text-xl italic text-ink short:mt-2 sm:text-2xl" style={{ animationDelay: "0.28s" }}>
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-primary sm:w-10" />
                {HERO.role}
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-primary sm:w-10" />
              </p>
              {/* `whitespace-pre-line`: la frase va a capo dove il cliente ha messo l'a capo
                  (dopo "ascolto"), non dove capita alla larghezza. La prima riga e' ~330px a
                  text-lg, quindi sta su una riga anche sul telefono. */}
              <p className="fisio-rise mx-auto mt-5 max-w-md whitespace-pre-line text-base leading-relaxed text-ink/85 short:mt-3 sm:text-lg" style={{ animationDelay: "0.42s" }}>
                {HERO.tagline}
              </p>
              {/* Dov'è lo studio, al posto del CTA + numero che stavano qui: chi arriva
                  sul sito di una fisioterapista vuole prima sapere DOVE. Telefono ed email
                  restano a un tap nella targhetta in alto a sinistra e nel footer. */}
              <SDiv
                {...MOB_ADDRESS}
                anim={desktop ? NO_DRIFT : MOB_FADE}
                className="mt-6 short:mt-4 lg:mt-8"
              >
                <div
                  className={`flex flex-col items-center gap-1.5${desktop ? " fisio-rise" : ""}`}
                  style={desktop ? { animationDelay: "0.56s" } : undefined}
                >
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
              </SDiv>
              {/* l'indice della pagina — dà al pannello un bordo inferiore e una gerarchia,
                  e ogni voce scorre fino alla sua sezione (vedi useSectionJump) */}
              <SDiv {...MOB_INDEX} anim={desktop ? NO_DRIFT : MOB_FADE} className="mt-6 short:mt-5 lg:mt-8">
                <div
                  className={desktop ? "fisio-rise" : undefined}
                  style={desktop ? { animationDelay: "0.7s" } : undefined}
                >
                  {/* `lg:max-w-sm`: su desktop l'indice e' una lista a colonna unica con le
                      righe allineate a sinistra (vedi ServiceIndex) — in 28rem le etichette
                      finiscono a ~220px e i filetti si fermano a 384, che e' un menu; a 448
                      le righe sembrano alla deriva sul lato sinistro di un blocco troppo largo.
                      Sotto lg servono le due colonne, e quindi i 28rem. */}
                  <ServiceIndex className="mx-auto max-w-md lg:max-w-sm" />
                </div>
              </SDiv>
            </div>
          </SDiv>

          {/* scroll hint — visible at rest, fades as you begin. Solo da lg: sul telefono
              e' centrato in basso esattamente dove finisce l'indice, e li' non c'e' un
              pixel da regalare. La fascia oro che esce dalla piega dice gia' "continua".

              Sta CENTRATO SULLA LAMA BERRY, non sulla videata: la lama e' la cucitura fra le
              due meta' (oro 54vw, bianco 46vw) e stava 25px a sinistra di 54vw — centrato
              sullo schermo il hint cadeva a 4vw dalla lama e sembrava messo li' a caso.
              Cavalcando la cucitura poggia su tre colori (oro, berry, bianco), ed e' per
              questo che ha un FONDO: una pillola bianca con ombra, cosi' il testo misura
              sempre contro il bianco e non contro quello che c'e' sotto.

              Tre elementi, uno per animazione — la regola del pannello 0:
                · il wrapper esterno POSIZIONA (`left` + `-translate-x-1/2`): nessuno gli
                  scrive un transform inline, quindi la classe regge;
                · la SDiv DISSOLVE allo scroll (scrive transform+opacity inline);
                · la pillola RIMBALZA (`.fisio-bounce`, CSS infinita — messa sulla SDiv
                  scavalcherebbe per sempre quello che SDiv scrive). */}
          <div className="pointer-events-none absolute bottom-8 left-[calc(54vw-25px)] z-10 hidden -translate-x-1/2 lg:block">
            <SDiv
              start={0}
              budget={HERO_END_DESKTOP}
              anim={[
                { at: 0, opacity: 1, y: 0 },
                { at: 1, opacity: 0, y: 8 },
              ]}
            >
              <div className="fisio-bounce flex flex-col items-center gap-1 rounded-full bg-white px-6 py-3 text-ink/85 shadow-lg shadow-ink/15">
                <span className="font-mono text-sm uppercase tracking-[0.22em]">{HERO.scrollHint}</span>
                <span aria-hidden="true" className="text-2xl leading-none">↓</span>
              </div>
            </SDiv>
          </div>
        </div>
      </Section>


      {/* ── 1 · MUSCOLOSCHELETRICO (+ focus sport, entra da destra) ───────────
          La sequenza dei servizi e il "focus a destra" sono richiesta del cliente
          (CLIENTE_TODO.md §2): la parte sportiva non è più un pannello a sé, è il
          focus di questo. Il device sta in FocusPanel — qui si autora solo il
          contenuto delle due metà. */}
      <Section index={1} snap={SNAP} end={PANEL_END[1]}>
        {/* Due blocchi: il testo, poi il focus con tutte e tre le foto. */}
        <Stop at={revEnd(3)} />
        <Stop at={photoWindow(PANEL_END[1]).end} />
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
                  src={asset("/olimpiadi_cortina.jpeg")}
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
        <Stop at={revEnd(3)} />
        <Stop at={photoWindow(PANEL_END[2]).end} />
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
        <Stop at={revEnd(3)} />
        <Stop at={photoWindow(PANEL_END[3]).end} />
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
        {/* Un blocco: tutto, form compreso. */}
        <Stop at={revEnd(4)} />
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
        {/* I blocchi di questo pannello sono i fogli del CV: li dichiara CvSheets. */}
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
        <Stop at={MASK_END} />
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
