"use client";

import { Section } from "./_scroll";
import { easeInCubic, easeOutCubic } from "./_scroll/easing";
import ScrollShell from "./ScrollShell";
import SDiv from "./widgets/SDiv";
import SMask from "./widgets/SMask";
import DevHud from "./widgets/DevHud";

import { CONTACT, CONTACT_COPY, HERO, HOME_RADIUS_KM, SERVICES } from "./site/data";
import Logo from "./site/Logo";
import HeroFigure from "./site/HeroFigure";
import PadovaMap from "./site/PadovaMap";
import ContactForm from "./site/ContactForm";
import ContactBar from "./site/ContactBar";
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

const shell =
  "relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6 py-24 sm:px-10";
const eyebrow = "font-mono text-sm uppercase tracking-[0.22em] text-primary";
const heading = "font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl lg:text-6xl";
const body = "text-lg leading-relaxed text-ink/90 sm:text-xl";

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

/** Decorative corner brackets (the biglietto da visita motif). */
function Corners({ color = "rgba(255,255,255,0.6)" }: { color?: string }) {
  const c = "pointer-events-none absolute h-10 w-10";
  return (
    <>
      <span className={`${c} left-6 top-6 border-l-2 border-t-2`} style={{ borderColor: color }} />
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
      <Section index={0} end={600 + DWELL}>
        <div className={`${shell} bg-secondary`}>
          <Corners color="rgba(255,255,255,0.7)" />
          <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            {/* figure — draws in on load, gentle scroll parallax */}
            <SDiv
              start={0}
              budget={600}
              anim={[
                { at: 0, y: 0, opacity: 1 },
                { at: 1, y: -34, opacity: 0.9 },
              ]}
              className="order-1 mx-auto w-40 sm:w-52 lg:order-none lg:w-64"
            >
              <HeroFigure className="h-auto w-full" stroke="var(--brand-primary)" />
            </SDiv>

            <div className="text-center lg:text-left">
              <p className="fisio-rise font-mono text-sm uppercase tracking-[0.28em] text-primary/80" style={{ animationDelay: "0.05s" }}>
                {HERO.kicker}
              </p>
              <h1 className="fisio-rise mt-3 font-display text-5xl font-semibold leading-[1.05] text-primary sm:text-6xl lg:text-7xl" style={{ animationDelay: "0.15s" }}>
                {HERO.name}
              </h1>
              <p className="fisio-rise mt-2 font-display text-2xl italic text-primary/90 sm:text-3xl" style={{ animationDelay: "0.28s" }}>
                {HERO.role}
              </p>
              <p className="fisio-rise mx-auto mt-5 max-w-lg text-lg text-primary/90 sm:text-xl lg:mx-0" style={{ animationDelay: "0.42s" }}>
                {HERO.tagline}
              </p>
              <div className="fisio-rise mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start" style={{ animationDelay: "0.56s" }}>
                <ContattamiButton className="bg-primary text-white shadow-lg shadow-primary/20" />
                <a href={`tel:${CONTACT.phoneHref}`} className="font-sans text-sm font-medium text-primary underline-offset-4 hover:underline">
                  oppure chiama {CONTACT.phoneDisplay}
                </a>
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

      {/* ── 1 · MUSCOLOSCHELETRICO ───────────────────────────────────────── */}
      <Section index={1} snap={SNAP} end={holdEnd(3)}>
        <div className={`${shell} bg-white`}>
          <div className="grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <SDiv {...rev(0)} anim={UP} className="mb-4">
                <p className={eyebrow}>{SERVICES.muscolo.eyebrow}</p>
              </SDiv>
              <SDiv {...rev(1)} anim={UP} className="mb-6">
                <h2 className={heading}>{SERVICES.muscolo.title}</h2>
              </SDiv>
              <SDiv {...rev(2)} anim={UP}>
                <p className={body}>{SERVICES.muscolo.body}</p>
              </SDiv>
            </div>
            <SDiv {...rev(3)} anim={UP}>
              <div className="rounded-3xl border-l-4 border-secondary bg-mist p-8 shadow-sm sm:p-9">
                <Points items={SERVICES.muscolo.points} />
              </div>
            </SDiv>
          </div>
        </div>
      </Section>

      {/* ── 2 · SPORTIVI / GIOVANI (+ Olimpiadi berry slab, enters from right) ─
          Sport text reveals on the left; then a full-height berry (emphasis)
          container slides in from the right (~55% on desktop, full-width on
          mobile) and holds. `end` gives the landed slab reading dwell before
          handing off. */}
      <Section index={2} snap={SNAP} end={1700 + DWELL}>
        <div className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-mist px-6 py-24 sm:px-10">
          {/* Sport, left */}
          <div className="relative z-10 w-full max-w-2xl">
            <SDiv {...rev(0)} anim={UP} className="mb-4">
              <p className={eyebrow}>{SERVICES.sport.eyebrow}</p>
            </SDiv>
            <SDiv {...rev(1)} anim={UP} className="mb-6">
              <h2 className={heading}>{SERVICES.sport.title}</h2>
            </SDiv>
            <SDiv {...rev(2)} anim={UP} className="mb-6">
              <p className={body}>{SERVICES.sport.body}</p>
            </SDiv>
            <SDiv {...rev(3)} anim={UP}>
              <Points items={SERVICES.sport.points} />
            </SDiv>
          </div>

          {/* Olimpiadi — full-height berry container sliding in from the right.
              `x: "100%"` on a right-0 box = fully off-screen right → 0 = home. */}
          <SDiv
            start={960}
            budget={340}
            anim={[
              { at: 0, x: "100%" },
              { at: 1, x: 0, ease: easeOutCubic },
            ]}
            className="absolute inset-y-0 right-0 z-20 flex w-full flex-col justify-center overflow-hidden bg-emphasis px-8 py-16 text-white shadow-2xl sm:px-12 lg:w-[55%] lg:pl-24 lg:pr-16 lg:[clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)]"
          >
            <div className="max-w-md">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-white/80">
                {SERVICES.sport.olimpiadi.eyebrow}
              </p>
              <h3 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
                {SERVICES.sport.olimpiadi.title}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-white/90">
                {SERVICES.sport.olimpiadi.body}
              </p>
            </div>
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-4 font-display text-[11rem] leading-none text-white/10">
              ◎
            </span>
          </SDiv>
        </div>
      </Section>

      {/* ── 3 · PAVIMENTO PELVICO / POST PARTO ───────────────────────────── */}
      <Section index={3} snap={SNAP} end={holdEnd(3)}>
        <div className={`${shell} bg-white`}>
          <div className="grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <SDiv {...rev(0)} anim={UP} className="mb-4">
                <p className={eyebrow}>{SERVICES.pelvico.eyebrow}</p>
              </SDiv>
              <SDiv {...rev(1)} anim={UP} className="mb-6">
                <h2 className={heading}>{SERVICES.pelvico.title}</h2>
              </SDiv>
              <SDiv {...rev(2)} anim={UP}>
                <p className={body}>{SERVICES.pelvico.body}</p>
              </SDiv>
            </div>
            <SDiv {...rev(3)} anim={UP}>
              <div className="rounded-3xl border-l-4 border-emphasis/60 bg-mist p-8 shadow-sm sm:p-9">
                <Points items={SERVICES.pelvico.points} />
              </div>
            </SDiv>
          </div>
        </div>
      </Section>

      {/* ── 4 · ANZIANI / DOMICILIARE (+ Padova radius map) ──────────────── */}
      <Section index={4} snap={SNAP} end={holdEnd(3)}>
        <div className={`${shell} bg-mist`}>
          <div className="grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
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
            </div>
            <SDiv {...rev(2)} anim={UP}>
              <PadovaMap />
            </SDiv>
          </div>
        </div>
      </Section>

      {/* ── 5 · CONTATTAMI ───────────────────────────────────────────────── */}
      <Section index={5} snap={SNAP} end={holdEnd(3)}>
        <div className={`${shell} bg-white`}>
          <div className="w-full max-w-3xl">
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

      {/* ── 6 · FOOTER ───────────────────────────────────────────────────── */}
      <Section index={6} snap={SNAP}>
        <div className={`${shell} bg-primary text-white`}>
          <Corners color="rgba(255,255,255,0.35)" />
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
                href={`tel:${CONTACT.phoneHref}`}
                className="flex min-w-0 items-center gap-3 border-b border-white/15 px-7 py-5 transition-colors hover:text-secondary sm:border-r"
              >
                <MailIcon className="h-5 w-5 shrink-0" /> {CONTACT.email}
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
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
