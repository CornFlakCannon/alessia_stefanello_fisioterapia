"use client";

import Image from "next/image";

import { Section } from "./_scroll";
import { easeInCubic, easeInOutCubic, easeOutCubic } from "./_scroll/easing";
import ScrollShell from "./ScrollShell";
import SDiv from "./widgets/SDiv";
import SMask from "./widgets/SMask";
import DevHud from "./widgets/DevHud";

import { CONTACT, CONTACT_COPY, HERO, HOME_RADIUS_KM, SERVICES } from "./site/data";
import Logo from "./site/Logo";
import HeroFigure from "./site/HeroFigure";
import HeroPortrait from "./site/HeroPortrait";
import PadovaMap from "./site/PadovaMap";
import ContactForm from "./site/ContactForm";
import ContactBar from "./site/ContactBar";
import TravellingFigure from "./site/TravellingFigure";
import ScrollLottie from "./site/ScrollLottie";
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
/* UP without the fade — for items whose PARENT SDiv already owns the opacity
   (nested opacities multiply). Used inside the pelvico panel's swinging column. */
const LIFT = [
  { at: 0, y: 14 },
  { at: 1, y: 0, ease: easeOutCubic },
];

/* A slight overshoot for the muscolo panel's entrance. `Easing` is just
   `(t: number) => number`, so a site-side curve needs no engine change. Raise the
   coefficients for more bounce (1.70158/2.70158 is the textbook easeOutBack). */
const easeOutBack = (t: number) => 1 + 2.1 * (t - 1) ** 3 + 1.1 * (t - 1) ** 2;

/* Panel 1's entrance: everything sweeps in FROM THE LEFT, out of focus, and lands
   with a small bounce. The split at 0.7 is deliberate — channels have independent
   stop lists, and `easeOutBack` overshoots past 1: on `x` that's the bounce, but on
   `blur` it would emit `blur(-0.4px)`, an invalid declaration the browser drops
   whole (a one-frame flicker). Closing `blur`/`opacity` early on their own keyframe
   leaves the overshoot to `x` alone. */
const IN_LEFT = [
  { at: 0, opacity: 0, x: -90, blur: 8 },
  { at: 0.7, opacity: 1, blur: 0, ease: easeOutCubic },
  { at: 1, x: 0, ease: easeOutBack },
];
/** Staggered reveal window for the i-th item after the panel lands. */
const rev = (i: number) => ({ start: SNAP + 30 + i * 70, budget: 300 });
/** Section hand-off point for a snap panel whose furthest reveal is rev(lastRev):
 *  that reveal's window end + a DWELL buffer, so the panel holds fully revealed
 *  before snapping to the next. */
const holdEnd = (lastRev: number) => rev(lastRev).start + rev(lastRev).budget + DWELL;

/* Pelvico panel (index 3): the points card is uncovered by an SMask iris opening
   from its BOTTOM-LEFT corner — same grammar as the footer wipe below, rotated to a
   corner. `x`/`y` pin the circle's top-left, so keeping `x` at IRIS_LEFT and setting
   `y = cy - r` grows it from that corner without ever re-covering what it passed.
   The final radius overshoots the box on purpose: clip-path cuts on the border box,
   so anything short of full coverage would shave a corner off for good. */
const IRIS_START = 560;
const IRIS_END = 1000;
const IRIS_LEFT = -40; // circle left edge, just past the card's own left
const IRIS_RADIUS = 680; // final radius (px) — overshoots the card so it ends fully open
const IRIS_CY = 200; // circle centre, low in the card (px from its top ≈ its height)
const irisReveal = [
  { at: 0, x: IRIS_LEFT, y: IRIS_CY, width: 0, height: 0, rounding: 0 },
  { at: 1, x: IRIS_LEFT, y: IRIS_CY - IRIS_RADIUS, width: 2 * IRIS_RADIUS, height: 2 * IRIS_RADIUS, rounding: 9999, ease: easeInCubic },
];

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

/* Travelling mascot — a viewport-fixed stickman driven by a global-scroll `rawAnim`
   (see TravellingFigure). Its beats sit at each panel's global-scroll boundary. */

/** Per-panel scroll ceiling (each Section's hand-off threshold) — single source of
 *  truth shared by the <Section>s below and the figure's beats, so tuning a panel's
 *  budget keeps them in sync. Panel 6 has no `end`; its furthest child window
 *  (MASK_END) stands in for the boundary math only. */
const PANEL_END = [600 + DWELL, holdEnd(3), 1700 + DWELL, holdEnd(3), holdEnd(3), holdEnd(3), MASK_END] as const;
/** Global-scroll position where panel `i` begins — the prefix sum of prior ceilings. */
const boundAt = (i: number) => PANEL_END.slice(0, i).reduce((a, b) => a + b, 0);

/* The mascot's journey, keyed to ABSOLUTE global scroll (px translates around its
   fixed lower-left anchor). Starting values — fine-tune by eye with the DevHud
   `global` readout at each panel. */
const JOURNEY = [
  { at: 0, opacity: 0, y: 24, scale: 0.9, rotate: 0 },                                    // hero: hidden (the hero has its own figure)
  { at: boundAt(1) - 200, opacity: 0, y: 24, scale: 0.9 },                                // stay hidden until the hero hands off
  { at: boundAt(1), opacity: 1, y: 0, scale: 1, rotate: -2, ease: easeOutCubic },         // panel 1: fade + rise in
  { at: boundAt(2), opacity: 1, y: -8, scale: 1.04, rotate: 3, ease: easeInOutCubic },    // panel 2: little hop + lean
  { at: boundAt(3), opacity: 1, y: 0, scale: 1, rotate: -3, ease: easeInOutCubic },       // panel 3
  { at: boundAt(4), opacity: 1, y: -6, scale: 1.03, rotate: 2, ease: easeInOutCubic },    // panel 4
  { at: boundAt(5), opacity: 0.3, y: 10, scale: 0.85, rotate: 0, ease: easeInCubic },     // panel 5 (contact): duck back out of the way
  { at: boundAt(6), opacity: 0, y: 20, scale: 0.8, ease: easeInCubic },                   // panel 6 (footer): bow out
];

/* Every panel must FIT inside 100svh: the engine pins the container's scrollTop to the
   active panel's offsetTop every frame (sectionScrollTop, app/_scroll/sections.ts), so
   anything past the fold is unreachable — and anything centred in an overflow-hidden box
   is sheared at BOTH ends. Hence `short:` (see globals.css), which trims the fixed
   vertical budget on screens that can't afford it. `panel` is the bare box (panel 2 lays
   its children out in a ROW); `shell` is the same box stacked, used by every other panel. */
const panel =
  "relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-6 py-24 short:py-12 sm:px-10";
const shell = `${panel} flex-col`;
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
        <div className={`${shell} bg-secondary`}>
          <Corners color="rgba(255,255,255,0.7)" topLeft={false} />
          <div className="grid w-full max-w-6xl items-center gap-12 max-lg:short:gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            {/* portrait — surfaces through its line on load (.fisio-line/.fisio-emerge,
                inside HeroPortrait). This SDiv is only the whole-group base drift: the
                photo and the line each add their own departure on top of it (see
                HeroPortrait), and DOM nesting composes the two, so a part's travel ADDS
                to this. No opacity here — the parts own their own fades.
                It sits FIRST in the grid on every viewport (no `order-*`): on mobile the
                photo leads, above the name and the role. That order is also why it
                shrinks on short phones (`max-lg:short:w-40`, composed with the width
                variants so they don't race): the panel is centred inside an
                overflow-hidden box, so anything past 100svh is sheared at BOTH ends —
                and with the photo on top, the thing sheared off the top is her head. */}
            <SDiv
              start={0}
              budget={600}
              anim={[
                { at: 0, y: 0 },
                { at: 1, y: -14 },
              ]}
              className="mx-auto w-52 max-lg:short:w-40 sm:w-64 lg:w-80"
            >
              <HeroPortrait />
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

      {/* ── 1 · MUSCOLOSCHELETRICO (entra da sinistra) ───────────────────────
          The whole panel reads as ONE sweep left-to-right: the three text lines come
          in on IN_LEFT with the usual stagger, then the card follows on a shorter
          run so it trails the text instead of crossing it. */}
      <Section index={1} snap={SNAP} end={PANEL_END[1]}>
        <div className={`${shell} bg-white`}>
          <div className="grid w-full max-w-6xl gap-12 max-lg:short:gap-6 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <SDiv {...rev(0)} anim={IN_LEFT} className="mb-4">
                <p className={eyebrow}>{SERVICES.muscolo.eyebrow}</p>
              </SDiv>
              <SDiv {...rev(1)} anim={IN_LEFT} className="mb-6">
                <h2 className={heading}>{SERVICES.muscolo.title}</h2>
              </SDiv>
              <SDiv {...rev(2)} anim={IN_LEFT}>
                <p className={body}>{SERVICES.muscolo.body}</p>
              </SDiv>
            </div>
            {/* The card's own box IS this SDiv: `rounding` writes borderRadius inline,
                which an inner div's `rounded-3xl` class would never see. It lands on
                24px — exactly `rounded-3xl` — so the class and the inline value agree
                once the run is over. */}
            <SDiv
              {...rev(3)}
              anim={[
                { at: 0, opacity: 0, x: -40, rounding: 96 },
                { at: 1, opacity: 1, x: 0, rounding: 24, ease: easeOutCubic },
              ]}
              className="rounded-3xl border-l-4 border-secondary bg-mist p-8 shadow-sm sm:p-9"
            >
              <Points items={SERVICES.muscolo.points} />
            </SDiv>
          </div>
        </div>
      </Section>

      {/* ── 2 · SPORTIVI / GIOVANI (+ Olimpiadi berry slab, enters from below) ─
          Sport text reveals CENTRED; then a FULL-SCREEN berry (emphasis) container
          rises from the bottom and takes the whole panel over. `end` gives the landed
          slab reading dwell before handing off. */}
      <Section index={2} snap={SNAP} end={PANEL_END[2]}>
        <div className={`${panel} bg-mist`}>
          {/* Sport — centred, and slipping gently upward as the slab climbs over it
              (same start/budget), so the two reads move together rather than one
              simply being covered. It's fully hidden by the time the slab lands. */}
          <SDiv
            start={960}
            budget={340}
            anim={[
              { at: 0, y: 0 },
              { at: 1, y: -28, ease: easeOutCubic },
            ]}
            className="relative z-10 flex w-full justify-center"
          >
            <div className="w-full max-w-2xl">
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
          </SDiv>

          {/* Olimpiadi — full-screen berry container rising from the bottom.
              `y: "100%"` on an inset-0 box = a full panel-height below (CSS resolves a
              translate `%` against the element's OWN height, and this one is as tall as
              the panel) → 0 = home. It covers the panel edge to edge on every viewport,
              so it needs no width/clip-path of its own. */}
          <SDiv
            start={960}
            budget={340}
            anim={[
              { at: 0, y: "100%" },
              { at: 1, y: 0, ease: easeOutCubic },
            ]}
            className="absolute inset-0 z-20 flex w-full flex-col items-center justify-center gap-8 overflow-hidden bg-emphasis px-8 py-16 text-center text-white shadow-2xl short:gap-4 short:py-8 sm:px-12"
          >
            {/* Milano Cortina 2026 — the JPEG's own ground is exactly --brand-emphasis
                (see globals.css), so it sits on the slab with no visible box. */}
            <Image
              src="/olimpiadi_cortina.jpeg"
              alt="Milano Cortina 2026"
              width={399}
              height={501}
              className="h-28 w-auto"
            />

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

            {/* Athlete — white, scrubbed by scroll over the slab's LANDED window: the
                slab lands at ~1300 (start 960 + budget 340) and section 2 ends at 2200
                (PANEL_END[2]). Tune start/end with the DevHud `scroll` readout on index 2.
                Size: below `md` it scales with the viewport instead of sitting at a fixed
                600px — 125vw/-18vw is the SAME ratio the old `w-150 -ml-25` had against a
                375px phone, so the left-bleed reads identically while costing ~65px less
                height (the slab is overflow-hidden and centred: overspill shears the LOGO
                off the top). `md:` restores the fixed desktop values. */}
            <ScrollLottie
              src="/Athlete.lottie"
              white
              start={1360}
              end={2050}
              className="w-[125vw] -ml-[18vw] md:w-150 md:ml-0 rotate-y-180"
            />

            <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-4 font-display text-[11rem] leading-none text-white/10">
              ◎
            </span>
          </SDiv>
        </div>
      </Section>

      {/* ── 3 · PAVIMENTO PELVICO / POST PARTO ───────────────────────────────
          The panel's own entrance, in three overlapping beats: a berry wash that
          burns off, the copy swinging open on its bottom-left corner, and the points
          card uncovered by an iris opening from that same corner. */}
      <Section index={3} snap={SNAP} end={PANEL_END[3]}>
        <div className={`${shell} isolate bg-white`}>
          {/* The wash — the `background` channel interpolating a bare two-stop
              linear-gradient (anim.ts mixes it stop by stop in oklab). It arrives
              tinted and clears to nothing while the copy settles, so the panel warms
              up on entry instead of just being white. First child, so the Bridge
              below paints over it inside the same `isolate`. */}
          <SDiv
            start={SNAP}
            budget={700}
            anim={[
              { at: 0, background: "linear-gradient(rgba(179,18,112,0.16), rgba(179,18,112,0))" },
              { at: 1, background: "linear-gradient(rgba(179,18,112,0), rgba(179,18,112,0))", ease: easeOutCubic },
            ]}
            className="pointer-events-none absolute inset-0 -z-10"
          />

          {/* Bridge exercise — half-page background figure bleeding off the bottom-right
              corner (the shell's overflow-hidden clips it). `isolate` on the panel is what
              makes `-z-10` land ABOVE the bg-white and below the content; without a stacking
              context here it would sink behind the background and vanish. The 50% opacity
              lives on the ScrollLottie, not this SDiv — SDiv writes `opacity` inline every
              frame for the reveal and would override a class. The width belongs on this
              (absolute) wrapper, where % resolves against the panel; a % width inside a
              shrink-to-fit box is circular. Scrubbed over this panel's landed window (it
              ends at holdEnd(3) = 1360), native colours — this panel is white. */}
          <SDiv
            {...rev(2)}
            anim={[
              { at: 0, opacity: 0, scale: 1.12, rotate: 3 },
              { at: 1, opacity: 1, scale: 1, rotate: 0, ease: easeOutCubic },
            ]}
            className="pointer-events-none absolute -bottom-10 -right-10 -z-10 w-3/4 sm:w-1/2"
          >
            <ScrollLottie
              src="/Bridge.lottie"
              start={520}
              end={1300}
              className="aspect-[12/11] w-full opacity-50"
            />
          </SDiv>

          <div className="grid w-full max-w-6xl gap-12 max-lg:short:gap-6 lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* The copy swings open like a page: `anchor` pins transform-origin to the
                bottom-left corner (written once, never per frame), so the rotate and
                scale hinge there instead of around the centre. This wrapper owns the
                fade and the blur for the whole column — the three lines inside keep
                only their stagger, because a second nested `opacity` would MULTIPLY
                with this one and leave the text washed out for most of the run. */}
            <SDiv
              start={SNAP + 10}
              budget={420}
              anchor={{ x: "start", y: "end" }}
              anim={[
                { at: 0, opacity: 0, x: -40, y: 36, rotate: -5, scale: 0.94, blur: 10 },
                { at: 1, opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, blur: 0, ease: easeOutCubic },
              ]}
            >
              <SDiv {...rev(0)} anim={LIFT} className="mb-4">
                <p className={eyebrow}>{SERVICES.pelvico.eyebrow}</p>
              </SDiv>
              <SDiv {...rev(1)} anim={LIFT} className="mb-6">
                <h2 className={heading}>{SERVICES.pelvico.title}</h2>
              </SDiv>
              <SDiv {...rev(2)} anim={LIFT}>
                <p className={body}>{SERVICES.pelvico.body}</p>
              </SDiv>
            </SDiv>

            {/* The card is uncovered by the iris, not by a fade — so this SDiv carries
                no opacity, only a settle. `shadow-sm` is gone on purpose: clip-path
                cuts on the border box, so the shadow would be eaten for the whole run
                and pop in at the end. */}
            <SDiv
              {...rev(3)}
              anim={[
                { at: 0, y: 16, scale: 0.96 },
                { at: 1, y: 0, scale: 1, ease: easeOutCubic },
              ]}
            >
              <div className="relative overflow-hidden rounded-3xl border-l-4 border-emphasis/60 bg-mist p-8 sm:p-9">
                <SMask invert start={IRIS_START} end={IRIS_END} anim={irisReveal} />
                <Points items={SERVICES.pelvico.points} />
              </div>
            </SDiv>
          </div>
        </div>
      </Section>

      {/* ── 4 · ANZIANI / DOMICILIARE (+ Padova radius map) ──────────────── */}
      <Section index={4} snap={SNAP} end={PANEL_END[4]}>
        <div className={`${shell} bg-mist`}>
          <div className="grid w-full max-w-6xl gap-12 max-lg:short:gap-6 lg:grid-cols-2 lg:items-center lg:gap-16">
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
      <Section index={5} snap={SNAP} end={PANEL_END[5]}>
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
          <Corners color="rgba(255,255,255,0.35)" topLeft={false} />

          {/* The line figure signs off here (it left the hero to the photo). Bottom
              RIGHT: the travelling mascot is fixed bottom-left. `draw={false}` — the
              on-load stroke-in would be long over by the time you scroll this far, so
              it just fades up with the panel. */}
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

      {/* Travelling mascot — a viewport-fixed stickman that follows the scroll (portaled to body). */}
      <TravellingFigure journey={JOURNEY} />

      {process.env.NODE_ENV === "development" && <DevHud />}
    </ScrollShell>
  );
}
