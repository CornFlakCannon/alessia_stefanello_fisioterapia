"use client";

import Image from "next/image";

import { Section } from "./_scroll";
import { easeInCubic, easeOutCubic } from "./_scroll/easing";
import ScrollShell from "./ScrollShell";
import SDiv from "./widgets/SDiv";
import SMask from "./widgets/SMask";
import DevHud from "./widgets/DevHud";

import { CONTACT, CONTACT_COPY, FORMAZIONE, HERO, HOME_RADIUS_KM, SERVICES } from "./site/data";
import FocusPanel, { FOCUS_LANDED } from "./site/FocusPanel";
import { PANEL_BOX } from "./site/panelBox";
import Logo from "./site/Logo";
import HeroFigure from "./site/HeroFigure";
import HeroPortrait from "./site/HeroPortrait";
import PadovaMap from "./site/PadovaMap";
import ContactForm from "./site/ContactForm";
import ServiceIndex from "./site/ServiceIndex";
import ContactBar from "./site/ContactBar";
import ScrollLottie from "./site/ScrollLottie";
import PhotoSlab from "./site/PhotoSlab";
import DuotonePhoto from "./site/DuotonePhoto";
import { PHOTOS, type Photo } from "./site/photos";
import { MailIcon, PhoneIcon, PinIcon } from "./site/ContactIcons";
import ContattamiButton from "./site/ContattamiButton";

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

/* The animated figure inside a focus slab (the athlete, the bridge) scrubs over the
   slab's LANDED window: it starts just after the slab is home (FOCUS_LANDED, see
   FocusPanel) and must finish before its panel hands off — hence the PANEL_END values
   below. Tune with the DevHud `scroll` readout on that panel's index. */
const FIGURE_IN = FOCUS_LANDED + 60;
const FIGURE_OUT = FIGURE_IN + 690;

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
  FIGURE_OUT + 150, // 1 muscolo + focus sport — the slab photos reuse the athlete's window
  FIGURE_OUT + 150, // 2 pelvico + focus post parto — same, for the bridge
  FOCUS_LANDED + DWELL, // 3 domiciliare + focus mappa — no scrubbed figure, just dwell
  holdEnd(4), // 4 contatti (rev(4) is the form)
  holdEnd(3), // 5 formazione
  MASK_END, // 6 footer
] as const;

/* The shared panel box (and why it's shared) lives in site/panelBox.ts — the focus
   panels are built on the same one. `shell` is that box stacked: every panel authored
   here uses it; the three service panels get theirs from <FocusPanel>. */
const shell = `${PANEL_BOX} flex-col`;
const eyebrow = "font-mono text-sm uppercase tracking-[0.22em] text-primary";
const heading = "font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl lg:text-6xl";
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
 * flow — panel 4 carries the form and panel 5 the timeline, and both have to fit inside
 * 100svh. So the photo goes behind everything, absolutely: it costs zero height and
 * nothing in the a11y tree.
 *
 * The dose lives HERE, not in `intensity`: these grounds are light, so the way to make a
 * duotone recede is to fade the whole layer OVER the ground, not to pile more colour on
 * top of it — that would paint a solid blue rectangle over the panel. It is a `style`
 * and not a Tailwind class because the value is now a prop, and Tailwind cannot generate
 * an arbitrary class from a runtime number.
 *
 * ## Choosing `opacity`
 * It is a contrast budget, not a taste slider, and the ceiling is set by the panel's
 * palest text. Measured pixel-by-pixel on `studio.webp` against the contatti panel:
 *
 *   | opacity | heading (text-primary) | body | placeholder (text-ink/70) |
 *   |    0.22 |                   5.16 | 7.98 |                      4.72 |
 *   |    0.28 |                   4.43 | 7.00 |                      4.34 |
 *   |    0.35 |                   3.67 | 5.94 |                      3.89 |
 *
 * 0.22 is the last value where everything clears 4.5:1. Past ~0.25 the heading is the
 * first thing to go under — and it goes under silently: the panel still looks good, it
 * just stops being readable for anyone who needs the contrast. Re-measure, don't guess.
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
      {/* ── 0 · HERO ─────────────────────────────────────────────────────── */}
      <Section index={0} end={PANEL_END[0]}>
        <div className={`${shell} bg-white lg:px-0`}>
          {/* was white-on-gold; on the white ground white brackets would vanish */}
          <Corners color="rgba(0,78,143,0.22)" topLeft={false} />

          {/* THE PORTRAIT AND ITS GOLD — deliberately ONE box, not two.
              The gold used to be a `<span>` hung off the photo's grid cell, bleeding
              `-right-[50vw]` to the screen edge, while the photo was centred inside the
              cell (capped at max-w-6xl). Two reference frames for two things that have to
              look concentric: on a 1883px window the photo sat 164px left of the gold's
              centre, and the gap grew with the monitor.

              Now the gold IS this element's background and the photo is centred in it, so
              they are concentric by construction at every width — there is no number to
              keep in agreement. (The old comment here argued the slab had to hang off the
              cell or it would drift away from the photo on wide screens. That was true
              while the photo lived in the grid; it cannot happen once they are the same
              box. Don't restore it.)

              Mobile keeps its own device: a band whose `bottom-0` is exactly the
              portrait's own drawn line, so the rule doubles as the gold/white boundary. */}
          <div className="relative mb-10 w-full max-w-6xl max-lg:short:mb-4 lg:absolute lg:inset-y-0 lg:right-0 lg:mb-0 lg:flex lg:w-[46vw] lg:max-w-none lg:items-center lg:justify-center lg:bg-secondary lg:py-12 lg:short:py-6">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[-50vw] -top-8 bottom-0 bg-secondary lg:hidden"
            />
            {/* The whole-group base drift; the photo and the line each add their own
                departure on top of it, and DOM nesting composes the two.
                The desktop width is capped by `svh`, not by a fixed rem, because the
                binding constraint is HEIGHT: a 3:4 portrait is 1.33x as tall as it is
                wide, and the panel owes 100svh. 60svh of width = 80svh of height, inside
                a band that is the full panel height less `py-12`. Raise it to make her
                bigger, then re-check at 768px tall — that is where the margin runs out
                first.

                The `38vw` term guards the OTHER axis: the band is 46vw, and without it a
                1024x768 window resolves 60svh to 461px inside a 471px band — 5px of
                margin, visibly glued to both edges. 38vw keeps 4vw of air per side at
                every width, and never binds on wide screens (at 1895 it is 720px, so
                34rem still wins). The mobile branch (w-52 / sm:w-64) is untouched. */}
            <SDiv
              start={0}
              budget={600}
              anim={[
                { at: 0, y: 0 },
                { at: 1, y: -14 },
              ]}
              className="relative mx-auto w-52 max-lg:short:w-36 sm:w-64 lg:mx-0 lg:w-[min(34rem,60svh,38vw)]"
            >
              <HeroPortrait />
            </SDiv>
          </div>

          {/* THE TEXT — `self-start` because the panel is `flex-col items-center`, so the
              cross axis is horizontal: without it a 54vw box would be centred in the
              viewport and run under the gold.

              Inside, `mx-auto` centres the copy IN THE WHITE HALF, which is the mirror of
              the portrait being centred in the gold one: same air on both sides of each.
              It first shipped as `ml-auto` + a right pad, parking the text against the
              gold's edge — on a 1895px window that read as 520px of void on the left and
              64 on the right, which is what "the space is badly distributed" was. */}
          <div className="relative z-10 w-full max-w-6xl text-center lg:w-[54vw] lg:max-w-none lg:self-start lg:text-left">
            <div className="lg:mx-auto lg:max-w-[34rem] lg:px-10">
              <p className="fisio-rise font-mono text-xs uppercase tracking-[0.28em] text-primary/70 sm:text-sm" style={{ animationDelay: "0.05s" }}>
                {HERO.kicker}
              </p>
              <h1 className="fisio-rise mt-3 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-primary max-lg:short:text-4xl sm:text-6xl lg:text-7xl" style={{ animationDelay: "0.15s" }}>
                {HERO.name}
              </h1>
              {/* the role hangs off a short gold rule — the one place the gold reaches
                  into the text column, so the two halves read as one composition */}
              <p className="fisio-rise mt-3 flex items-center justify-center gap-3 font-display text-xl italic text-primary/90 short:mt-2 sm:text-2xl lg:justify-start" style={{ animationDelay: "0.28s" }}>
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-secondary sm:w-10" />
                {HERO.role}
              </p>
              <p className="fisio-rise mx-auto mt-5 max-w-md text-base leading-relaxed text-ink/85 short:mt-3 sm:text-lg lg:mx-0" style={{ animationDelay: "0.42s" }}>
                {HERO.tagline}
              </p>
              <div className="fisio-rise mt-7 flex flex-wrap items-center justify-center gap-4 short:mt-4 lg:justify-start" style={{ animationDelay: "0.56s" }}>
                <ContattamiButton className="bg-primary text-white shadow-lg shadow-primary/20" />
                <a href={`tel:${CONTACT.phoneHref}`} className="font-sans text-sm font-medium text-primary underline-offset-4 hover:underline">
                  oppure chiama {CONTACT.phoneDisplay}
                </a>
              </div>
              {/* the page's index — gives the panel a bottom edge and a hierarchy, and
                  each entry scrolls to its panel (see useSectionJump) */}
              <div className="fisio-rise mt-8 short:mt-5" style={{ animationDelay: "0.7s" }}>
                <ServiceIndex className="mx-auto max-w-md lg:mx-0" />
              </div>
            </div>
          </div>

          {/* scroll hint — visible at rest, fades as you begin */}
          <SDiv
            start={0}
            budget={200}
            anim={[
              { at: 0, opacity: 1, y: 0 },
              { at: 1, opacity: 0, y: 8 },
            ]}
            className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-primary/80"
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
          focus={
            <>
              {/* The slab's ground. It runs over exactly the window the athlete used to
                  scrub (FIGURE_IN..FIGURE_OUT), so PANEL_END[1] — and with it the
                  TravellingFigure's JOURNEY, built from prefix sums of PANEL_END —
                  never moves. Story order: valutazione, terapia manuale, ritorno al
                  gesto sportivo, closing on the Olimpiadi beat below. */}
              <PhotoSlab
                photos={[PHOTOS.spalla, PHOTOS.manuale, PHOTOS.equilibrio]}
                tint="emphasis"
                intensity={0.42}
                start={FIGURE_IN}
                end={FIGURE_OUT}
              />

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
                  className="h-20 w-auto short:h-14"
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
          focus={
            <>
              <div className="max-w-md">
                <p className={focusEyebrow}>{SERVICES.pelvico.postParto.eyebrow}</p>
                <h3 className={focusHeading}>{SERVICES.pelvico.postParto.title}</h3>
                <p className={focusBody}>{SERVICES.pelvico.postParto.body}</p>
              </div>

              {/* The bridge exercise used to be a decorative figure behind this panel's
                  text; the slab would have covered exactly where it sat, and it belongs
                  to this beat anyway (it IS a pelvic-floor exercise), so it moved onto
                  the slab as a white silhouette — same role the athlete plays for sport. */}
              <ScrollLottie
                src="/Bridge.lottie"
                white
                start={FIGURE_IN}
                end={FIGURE_OUT}
                className="aspect-[12/11] w-full max-w-md opacity-90 short:max-w-xs"
              />
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
          focus={
            <>
              {/* The only slab with DARK text on it, so it screens instead of multiplying
                  — gold multiplied by a photo goes brown and takes text-primary down to
                  ~1:1. Screened it floors at 4.25:1, which is the flat gold's own value,
                  and that is what buys the low `intensity`: the photo can carry the slab
                  here more than it does on the fuchsia one. Its window is what the panel
                  has spare after the slab lands — no scrubbed figure to share it with. */}
              <PhotoSlab
                photos={[PHOTOS.palla, PHOTOS.step]}
                tint="secondary"
                intensity={0.3}
                blend="screen"
                start={FOCUS_LANDED}
                end={PANEL_END[3]}
              />

              <div className="relative z-10 max-w-md">
                <p className={focusEyebrow}>{SERVICES.domiciliare.zona.eyebrow}</p>
                <h3 className={focusHeading}>{SERVICES.domiciliare.zona.title}</h3>
                <p className={focusBody}>{SERVICES.domiciliare.zona.body}</p>
              </div>

              {/* The map rides in ON the slab, so its ring must reveal AFTER the slab
                  lands — otherwise it plays off-stage and arrives already open. Now that
                  the slab wears a photo the map is an inset card, not the main event:
                  its light rounded box is what lifts it off the photo. */}
              <PadovaMap
                className="relative z-10 max-w-[25rem] shadow-xl shadow-primary/20 short:max-w-[12rem]"
                revealAt={FIGURE_IN}
              />
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
          <SDiv {...rev(3)} anim={UP}>
            <p className="font-mono text-sm text-primary">
              Domicilio nel raggio di ~{HOME_RADIUS_KM} km da Padova centro.
            </p>
          </SDiv>
        </FocusPanel>
      </Section>

      {/* ── 4 · CONTATTAMI ───────────────────────────────────────────────── */}
      <Section index={4} snap={SNAP} end={PANEL_END[4]}>
        <div className={`${shell} bg-white`}>
          {/* Lo studio dietro al form: "vieni qui" detto dall'ambiente invece che a
              parole. La dose è alta rispetto alla formazione — è la richiesta — ma è
              anche il tetto: vedi la tabella di contrasto su PanelTexture. */}
          <PanelTexture photo={PHOTOS.studio} opacity={0.40} />
          <div className="relative z-10 w-full max-w-3xl">
            <SDiv {...rev(0)} anim={UP} className="mb-4 text-center">
              <p className={eyebrow}>{CONTACT_COPY.eyebrow}</p>
            </SDiv>
            <SDiv {...rev(1)} anim={UP} className="mb-3 text-center">
              <h2 className={heading}>{CONTACT_COPY.title}</h2>
            </SDiv>
            <SDiv {...rev(2)} anim={UP} className="mb-3 text-center">
              <p className={`${body} mx-auto max-w-xl`}>{"Raccontami di cosa hai bisogno:"}</p>
            </SDiv>
            <SDiv {...rev(3)} anim={RIGHT} className="mb-8 text-center font-contact italic">
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
          verificare le credenziali le trova qui.
          ⚠️ Le voci in data.ts sono PLACEHOLDER — vanno riempite da Alessia prima di
          pubblicare (i titoli di studio di una persona reale non si inventano). */}
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
            <SDiv {...rev(2)} anim={UP} className="mb-10 text-center short:mb-6">
              <p className={`${body} mx-auto max-w-2xl`}>{FORMAZIONE.intro}</p>
            </SDiv>
            {/* Timeline: due colonne su desktop, una su telefono. Ogni voce è un filetto
                orizzontale + anno in mono + titolo — compatta perché il pannello deve
                stare in 100svh: un CV più lungo si accorcia, non allunga il pannello. */}
            <SDiv {...rev(3)} anim={UP}>
              <ul className="grid gap-x-12 gap-y-5 short:gap-y-3 sm:grid-cols-2">
                {FORMAZIONE.items.map(({ year, title, place }) => (
                  <li key={`${year}-${title}`} className="border-t border-primary/15 pt-3 short:pt-2">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-secondary">{year}</p>
                    <p className="mt-1 font-display text-lg leading-snug text-primary">{title}</p>
                    <p className="mt-0.5 text-sm text-ink/70">{place}</p>
                  </li>
                ))}
              </ul>
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
