# CLAUDE.md

Guidance for working in this repo.

## What this is

A **single-page marketing site for Alessia Stefanello, fisioterapista (Padova)**,
built on an **in-house scroll-driven animation engine** (`app/_scroll` + `app/widgets`)
authored by the studio. Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 ·
TypeScript. One responsive page (`app/page.tsx`) covers mobile + desktop.

Services presented: muscoloscheletrico · sportivi/giovani (+ *Olimpiadi* beat) ·
pavimento pelvico/post parto · anziani & fisioterapia a domicilio (Padova centro).

### Brand & contact (single source of truth: `app/site/data.ts`)

- Colors — primary `#004E8F`, secondary `#EDAB39`, emphasis `#B31270` (the Milano
  Cortina ground, so the logo sits on the berry slab with no visible box)
  (exposed as Tailwind tokens `primary`/`secondary`/`emphasis`/`ink`/`mist` via
  `app/globals.css` `@theme inline` — that file is the real source for the values).
- Alessia Stefanello · +39 342 752 2370 · alessiastefanello.fisio@gmail.com ·
  Viale della Navigazione Interna 51, scala 8, 3° piano, Padova (PD) · *solo su prenotazione*.
- Logo = a **filled blue circle placeholder** (`app/site/Logo.tsx`) — swap for the real
  round logo there and every usage updates.

## Commands

- `npm run dev` — dev server (http://localhost:3000; falls back to 3001 if busy).
- `npx tsc --noEmit` — typecheck. `npx eslint .` — lint.
- In dev, a **DevHud** overlay (top-right) shows fps + the live `scroll` (per-section)
  and `global` (whole-page) scroll integrals — read a value off it to author a keyframe
  `at`. Click anywhere to copy `x,y`; Alt-click to copy an element's `width,height`.

## Visual checks are the user's job

**Never ask to install/use the Claude in Chrome extension** (or any browser-driving
tool) on this project. Matti runs the site and looks at it himself. Verify what you
can headlessly — `npx tsc --noEmit`, `npx eslint .`, `npm run build`, `curl` the dev
server and inspect the served markup — then hand over a short, concrete list of what
to eyeball and which constant to tune if something looks off.

## Dev performance (keep the machine cool)

`next dev` (Turbopack HMR + file-watching) is inherently heavy; `next start` is light.
- **Run one dev server at a time.** Multiple `next dev` instances (across projects) stack
  up fast — each can hold 100 MB–1 GB+. `pgrep -af next-server` to see what's running.
- **The Turbopack root is pinned** in `next.config.ts` (`turbopack.root`). Do NOT remove
  it: without it, a stray `/home/matti/package-lock.json` + a sibling `my_artisia` checkout
  make Turbopack watch all of `/home/matti`, which is what blew a dev server up to ~1.2 GB.
- **For a light preview** (no live editing), use `npm run build && npm run start` instead
  of `dev`.
- **Restart `dev` periodically** — long dev sessions leak memory over time.

## The scroll engine — DO NOT MODIFY

`app/_scroll/*` and `app/ScrollShell.tsx` are treated as a **complete, external
library**. Build the site *with* it; do not edit it. If a feature needs an engine
change, write it up as a spec (see `JUMP_TO_FEATURE.md`) for the library's own repo
instead of patching here.

### Model

- `ScrollShell` hijacks wheel/touch, runs one rAF loop, and eases the container's
  `scrollTop` toward the active panel. Its children are top-level `<Section>`s.
- `<Section index={n} snap end/budget>` = one full-viewport **panel**. The engine
  advances one section at a time as its scroll integral crosses a threshold (its
  furthest child window end, or an explicit `end`/`budget`). `snap` (bool or number)
  makes the panel glide in over that many scroll units; content staggers past it via
  `start`. A **nested** `<Section start budget>` only shifts the scroll origin (staged
  beats within a panel) — it does not advance.
- `<SDiv anim={[{at,…}]} start budget end anchor className>` (`app/widgets/SDiv.tsx`)
  animates a div from its scroll progress. `anim` keyframes use **normalized `at ∈ [0,1]`**;
  channels: `x,y` (px translate), `scale`, `rotate`, `opacity`, `width,height` (px→scale),
  `rounding`, `blur`, `color`, `background` (`app/widgets/anim.ts`). `ease` on a keyframe
  shapes the transition *into* it. `rawAnim` is a second layer keyed to **absolute** scroll.
- `<SMask>` punches an animated clip-path hole (wipe reveals). `<ImageSequence frames
  frameSrc>` scrubs a PNG sequence (both `frames` and `frameSrc` are required).
- Progress is smoothed before it becomes style (`app/_scroll/smoothing.ts`).
- **Every panel must FIT inside `100svh`.** `sectionScrollTop` pins the container's
  `scrollTop` to the active panel's `offsetTop` on every frame, so a panel that grows
  taller than the viewport has its overflow **permanently unreachable** — you cannot
  scroll to it. Content centred inside an `overflow-hidden` box is worse: it's sheared at
  *both* ends. Budget vertical space with the `short:` variant (`@media (max-height:
  740px)`, defined in `globals.css`) rather than letting a panel grow — iPhone SE (667)
  and 1366x768 laptops are the cases that bite. `short:` keys off height alone, so where a
  class list already varies the same property by width, compose (`max-lg:short:gap-6`)
  instead of letting two variants race for precedence.

### Authoring conventions used on this site

- **One responsive page.** Lay out each panel with normal Tailwind flow (flex/grid),
  and wrap key elements in `<SDiv>` for **small, viewport-independent reveals**
  (`opacity 0→1`, `y: 24→0`, `easeOutCubic`), staggered with `start`. This is why the
  same code works on phone and desktop — no per-device coordinate sets.
- Panels 1-6 aren't active at load, so `at:0` = invisible reveals are fine there.
  The **hero (index 0) is visible at scroll 0**, so it uses on-load CSS animations
  (`.fisio-rise`, and the figure's `.fisio-draw` stroke-in — see `globals.css`),
  NOT scroll-gated opacity reveals. Keep that rule for any always-on-screen content.
- Shared reveal presets (`UP`, `rev(i)`, `SNAP`) live at the top of `app/page.tsx`.
- Respect `prefers-reduced-motion` (the CSS entrance animations already opt out).

## Site code (`app/site/`)

- `data.ts` — all copy + contact + `SECTION` indices + `HERO_INDEX` + `HOME_RADIUS_KM`.
- `page.tsx` — the 7 panels (Hero, Muscolo, Sport+Olimpiadi, Pelvico, Domiciliare+map,
  Contatti, Footer) composed from `<Section>`/`<SDiv>`.
- `HeroPortrait.tsx` — the photo, **dead straight** (the client asked for it), surfacing
  from a drawn horizontal rule that is really the bottom edge of its clip box
  (`.fisio-line` / `.fisio-emerge`). The hero's gold is a **slab**, not the whole panel:
  a right-hand slab on desktop, a band hanging off the photo on phones. Two elements,
  one per viewport, both `absolute` — an abspos child resolves against the padding box,
  so the panel's own padding never insets them.
- `ServiceIndex.tsx` — the hero's index of the four services; each entry scrolls to its
  panel via `useSectionJump` (see seam 1 below).
- `HeroFigure.tsx` — hand-authored SVG line figure (approximation of the biglietto da
  visita; swap for the real asset when available).
- `PadovaMap.tsx` — self-contained stylised map with an SDiv radius ring (no tiles/API).
- `ContactForm.tsx` — **one minimal 3-field form** (Nome · Telefono · Messaggio), same on
  every viewport; submit opens a prefilled `mailto:` (no backend, see `contact.ts`). The
  wider 7-field shape survives only as `AppointmentFields` in `contact.ts`, which
  `appointmentMailto` composes and filters — add a field to the form and the email picks
  it up with no other change. The form must stay short: panel 5 has to fit `100svh`.
- `ContactBar.tsx` — always-visible quick-contact badge, **portaled to `<body>`** (like
  DevHud) so it escapes the panel layout while still living under the scroll context.
- `ContattamiButton.tsx` — primary CTA.

### Two engine seams the site works around (see `JUMP_TO_FEATURE.md`)

1. **No scroll-to-section API.** So "Contattami" still opens a prefilled email.
   The hero's `ServiceIndex` does jump, via **`app/site/useSectionJump.ts`** — a
   site-side workaround that drives the engine **from its own input**: a rAF loop
   dispatching synthetic `wheel` events on the clicked element (they bubble to the
   shell's container listener), watching the public `store.state.sectionIndex` until it
   reaches the target, then feeding `LAND` more units so the panel seats and its reveals
   play. No engine file is touched.
   Why not just write the positions (what the `JUMP_TO_FEATURE.md` patch does): the
   **global** scroll counter only advances from the accumulator, and every `rawAnim` is
   measured against it — the travelling mascot above all. Feeding the accumulator keeps
   section, snap glide, reveals and global counter in phase for free; setting per-index
   positions leaves the global counter behind. If that patch ever lands, it needs to
   move the global counter too.
   When the engine ships `useScrollNav().jumpTo(index)`, rewrite the **body of that
   hook** (callers don't change) and switch `ContattamiButton` to
   `jumpTo(SECTION.CONTATTI)`.
2. **Scroll-jack vs. form input — tap vs. swipe.** `ScrollShell` sets `touch-action:none`
   and pointer-captures the container on the *first* `pointerdown`, before anyone can know
   whether that touch is a tap on a field or the start of a scroll. **Never resolve this by
   `stopPropagation`ing the pointerdown off a control**: the swipe then reaches neither the
   shell (no drag starts) nor the browser (`touch-action:none`), while the browser's own
   touch defaults — caret drag, selection magnifier, focus scroll-into-view — keep running
   and fight the shell's per-frame `scrollTop` write. That combination is what made the
   Contatti panel jitter. `ContactForm`'s `useTapVsSwipe` instead decides **by gesture,
   after the fact**: the pointerdown always reaches the shell (so swipes scroll normally),
   and only on `pointerup`, if the finger never travelled past `SLOP` (8px), does it focus
   the tapped field with `focus({ preventScroll: true })`. Clicks stay fully native. Its
   `pointermove`/`pointerup` listeners live on `window` **because** the shell's
   `setPointerCapture` retargets them off the form. A **site-side** fix, no engine change;
   `data-native` is still just a marker (nothing reads it yet).

   **The shell's `touch-action: none` does not reach every descendant.** A gesture
   intersects `touch-action` from the touched element only *up to the first containing
   scrolling element* — so any **scroll container** in the tree (a `<textarea>` is one by
   default; so is anything with `overflow:auto/scroll`) terminates the walk at itself, and
   the shell's value is never consulted. The browser then scrolls it natively and
   scroll-chains into the shell container, fighting the rAF loop's per-frame `scrollTop`
   write — a jitter that looks identical to the seam above but has a different cause. Any
   scrollable element inside a panel therefore needs `touch-none` **on itself**
   (`ContactForm`'s `inputBase` does this). Don't delete it as redundant with the shell's.
