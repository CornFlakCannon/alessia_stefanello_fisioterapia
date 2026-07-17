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

- Colors — primary `#004E8F`, secondary `#EDAB39`, emphasis `#A10050`
  (exposed as Tailwind tokens `primary`/`secondary`/`emphasis`/`ink`/`mist` via
  `app/globals.css` `@theme inline`).
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

- `data.ts` — all copy + contact + `SECTION` indices + `HOME_RADIUS_KM`.
- `page.tsx` — the 7 panels (Hero, Muscolo, Sport+Olimpiadi, Pelvico, Domiciliare+map,
  Contatti, Footer) composed from `<Section>`/`<SDiv>`.
- `HeroFigure.tsx` — hand-authored SVG line figure (approximation of the biglietto da
  visita; swap for the real asset when available).
- `PadovaMap.tsx` — self-contained stylised map with an SDiv radius ring (no tiles/API).
- `ContactForm.tsx` — **full 7-field form on desktop, parallel 3-field UI on mobile**,
  submit opens a prefilled `mailto:` (no backend, see `contact.ts`).
- `ContactBar.tsx` — always-visible quick-contact badge, **portaled to `<body>`** (like
  DevHud) so it escapes the panel layout while still living under the scroll context.
- `ContattamiButton.tsx` — primary CTA.

### Two engine seams the site works around (see `JUMP_TO_FEATURE.md`)

1. **No scroll-to-section API.** So "Contattami" currently opens a prefilled email.
   When the engine ships `useScrollNav().jumpTo(index)`, switch `ContattamiButton` to
   `jumpTo(SECTION.CONTATTI)` — that's the single place to change.
2. **Scroll-jack vs. form input.** `ScrollShell` sets `touch-action:none` + captures
   touch, which fights form fields on mobile. `ContactForm` marks its scroll region
   `data-native` and attaches its own native `wheel`/`pointerdown` listeners that
   `stopPropagation` before the shell sees them (boundary-aware, so the panel still
   advances at the form's scroll edges) — a **site-side** fix, no engine change. If the
   engine later adds a `[data-native]` opt-out, delete that local hook.
