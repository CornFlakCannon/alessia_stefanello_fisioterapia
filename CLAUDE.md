# CLAUDE.md

Guidance for working in this repo.

## What this is

A **single-page marketing site for Alessia Stefanello, fisioterapista (Padova)**,
built on an **in-house scroll-driven animation engine** (`app/_scroll` + `app/widgets`)
authored by the studio. Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 ·
TypeScript. One responsive page (`app/page.tsx`) covers mobile + desktop.

Services presented, in the client's own order: muscoloscheletrico (+ *ritorno allo sport*
and the *Olimpiadi* signature as its focus) · pavimento pelvico/post parto (+ *post parto*
focus) · anziani & fisioterapia a domicilio, Padova centro (+ *mappa* focus). Then the
contact form, a *formazione/CV* panel, and the footer.

`CLIENTE_TODO.md` holds the client's own notes and, under each, what was actually done —
read it before changing the page's structure. `FOTO_BRIEF.md` is the shooting brief for
the studio photos, written to be forwarded to Alessia as-is.

**The real studio photos are in**, in every slab — filtered with the section colour (see
«Photos» below). Nothing on the page is a drawn placeholder any more: the athlete and the
bridge Lotties are gone, and so is the travelling mascot the client asked to remove.
`NUOVA_TODO.md` is the second round of client notes and the source of most of the current
shape; read it with `CLIENTE_TODO.md`.

### Brand & contact (single source of truth: `app/site/data.ts`)

- Colors — primary `#004E8F`, secondary `#E79E33`, emphasis `#B31270` (the Milano
  Cortina ground, so the logo sits on the berry slab with no visible box)
  (exposed as Tailwind tokens `primary`/`secondary`/`emphasis`/`ink`/`mist` via
  `app/globals.css` `@theme inline` — that file is the real source for the values).
- Alessia Stefanello · +39 342 752 2370 · alessiastefanello.fisio@gmail.com ·
  Viale della Navigazione Interna 51, scala 8, 3° piano, Padova (PD) · *solo su prenotazione*.
- Logo = a **filled blue circle placeholder** (`app/site/Logo.tsx`) — swap for the real
  round logo there and every usage updates. (The top-left badge no longer uses it: at 32px
  a face is recognised and a mark is not, so it wears `PHOTOS.ritrattoTondo`.)
- ⚠️ **The CV gives a different email** (`alessiastefanello@gmail.com`) from the one the
  site publishes. One of the two is wrong — see the ⚠️ block on `FORMAZIONE` in `data.ts`.

## Commands

- `npm run dev` — dev server (http://localhost:3000; falls back to 3001 if busy).
- `npx tsc --noEmit` — typecheck. `npx eslint .` — lint.
- `npm run photos` — rebuild every image derivative from the originals (see «Photos»):
  `crop-photos.mjs` for the camera stills, then `hero-cutout.mjs` for the hero's alpha
  cut-out. Only needed when a crop changes or a new original arrives; outputs are committed.
- `node scripts/check-contrast.mjs` — WCAG ratios of the text over a photographic ground,
  worst pixel. Run it after changing any dose on the contatti panel and paste the table
  into `PanelTexture`'s docblock. `--sweep` prints a grid of texture × card opacities.
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

## Photos

### Where the bytes live

The camera originals (15 JPG at 6000x4000, the hero PNG, plus the 4K studio video) are
**not in the repo**: they sit in `FOTO_ORIGINALI/`, gitignored. What ships is derivatives:

- `public/foto/*.webp` — hand-cropped stills, ~1200x1600 (the two full-panel textures are
  wider, 2200px), 75-190 KB each. Built by `scripts/crop-photos.mjs` (sharp). The
  originals are landscape and the slabs are tall and narrow, so **the crop is chosen by
  hand there, per photo**, rather than left to `object-cover` to guess — that is the whole
  point of the script. One `crop` line per photo is the only thing to touch when a
  framing is wrong.
- `public/foto/hero.webp` + `hero-mobile.webp` — the hero portrait, a **cut-out with a
  real alpha channel**, 1100x1467 (3:4) and 800x1000 (4:5). Built by
  `scripts/hero-cutout.mjs` (sharp) from `FOTO_ORIGINALI/HERO_PHOTO.png`.

  **The source only pretends to have transparency.** It looks like a
  background-removal export — her on a checkerboard — and is in fact **100% opaque**,
  with the checkerboard *painted in* as two flat neutral greys. Shipped as-is, the hero
  wears a grey checkerboard rectangle on the gold slab. So the alpha is keyed back out.

  **And here that is safe, where the video's wall was not.** `hero-video.sh`'s docblock
  records why you cannot key the studio's grey-green wall: her white trousers measure
  *inside* the wall's range, so a key eats them. This plate is a different animal, and
  the separation is on two axes at once, not one:

  | | mean saturation | luma |
  |---|---|---|
  | the painted checkerboard | 0.31 | 235 and 255 |
  | her white trousers | 19.05 | 168 – 229 |

  The test is `saturation <= 6` **AND** `luma >= 226`, and the trousers fail *both*
  halves. A luma-only key at 226 would still take their highlights.

  **It is a flood fill from the border, not a colour key**, and that is the second half
  of the safety: a pixel counts as background only if it is pale, neutral *and reachable
  from the edge without crossing her*. That keeps ~11k pale pixels **inside** the
  trousers, which a global key would have punched into holes. The count is printed on
  every run, because it is precisely the number that would go wrong silently. `ERODE`
  then drops the boundary pixels (part her, part plate — they would ship as a pale halo)
  and `FEATHER` softens what is left.

  **Two derivatives, because the phone needs a different picture.** She is tall and
  narrow, so the desktop 3:4 and the phone's **square bust** are not two crops of one frame
  — the phone's throws away ~75% of the height. That is art direction, which `next/image`
  cannot express, so `HeroPortrait` uses a `<picture>` with two `<source>`s and exactly one
  is ever fetched. Both `<source>` and `<img>` carry `width`/`height`, since the two ratios
  differ and otherwise the desktop branch reserves the phone's box. Vertical tightness is
  what makes her big — rendered height is `(subject_height / crop_height) * box_height` —
  so trimming rows buys size while side margin costs nothing (it is transparent, and
  `drop-shadow` follows the silhouette, not the box). Cutting the phone frame from 1695
  rows to 1122 is what takes her head from 84px to ~290px on a 390x844 phone.

  **The phone crop is SQUARE, and that is load-bearing, not a taste.** It is no longer laid
  out at its own ratio: the phone box has a fixed height (a 74svh full-bleed band) and the
  image fills it with `object-cover`. Cover crops whichever axis the container has to spare,
  so a container **wider than it is tall** crops the HEIGHT — her skull. Below `lg` that is
  not hypothetical: tablets live there, and so does a 900x600 desktop window (ratio 2.03).
  The guarantee is arithmetic and it is **split across two files**: the source is 1:1
  (`MOB_RATIO`) and the box is capped at `w-[min(100vw,74svh)]` in `page.tsx`, i.e. never
  wider than tall. Container ratio ≤ source ratio ⇒ cover can only eat WIDTH — the shoulders,
  which is the point. Change either half alone and she is decapitated on some device.

  `HEAD_ROOM` (desktop) and `MOB_HEAD_ROOM`/`MOB_BOTTOM` (phone) are the framing knobs. Every
  crop is still measured against the subject before it is written, but the phone frame now
  *wants* a clip, so the check is **budgeted rather than absolute**: `MOB_BLEED` is how much
  may run off per side and `MOB_FACE_GUARD` is the row above which nothing may be cut at all,
  so a budget meant for shoulders can never be spent on her head. The measured bleed is
  printed on every run — a clip is invisible by eye at phone size, which is why any of this
  exists.

  **She stands on WHITE, and that is why the gold moved to the text half.** The cut-out
  first shipped on the gold slab and wore a pale halo around the hair. The obvious reading
  is "erode harder"; measured, that is wrong. Those pale pixels are the ~11k the flood fill
  deliberately KEEPS inside her, and the count barely moves between 0 and 3 erosion passes
  (10923 → 10824) because they are nowhere near the boundary — you cannot trim them without
  eating the subject. What decides whether they read as a halo is the ground: composited on
  gold the palest of them lands **83 levels above** it, on white **29 below**, i.e.
  invisible. So it is not a threshold to tune, it is a ground to change. `ERODE` is 1 and
  only removes the single hard-contaminated ring.

  **What this replaced, and why it is simpler.** The hero was a `<video>` that played
  once on load, and before that a 27-frame `ImageSequence`. Both existed to solve a
  problem that has now evaporated: the source was a clip on an unkeyable wall, so the
  background had to be composited at build time and then *made to agree* with
  `--brand-secondary` to within a level or two — hence `check-gold.mjs`, `probe-bg.mjs`,
  `fill-matte.mjs` and the whole matte branch of `hero-video.sh`. With a real alpha
  channel there is no background in the file at all: what sits behind her is the panel's
  own white. Nothing to match, no seam to measure.

  Those scripts **stay on disk**, with their docblocks — the measurements in them are
  hard-won and the video may come back — but they are out of `npm run photos`, and
  `hero-video.sh` still carries `GOLD=0xEDAB39` from before the brand gold moved to
  `#e79e33`. Fix that before ever running it again.

`app/site/photos.ts` is the manifest: `src`/`width`/`height`/`alt`/`position` per photo,
plus `HERO_PHOTO` (the two cut-out framings). **Every still is built, not just the ones
used** — swapping which photo a section wears is a one-line change there.


### The duotone, and the one rule about it

`DuotonePhoto` desaturates the photo and lays the section colour over it with a blend
mode, plus a flat layer of the same colour whose opacity (`intensity`) is the dose. This
is what `FOTO_BRIEF.md` promised the client: the brand colour as passe-partout, holding
shots taken in different light together.

**`blend` is a contrast decision, not a taste one**, and it follows the colour of the
text that sits on top:

| slab | text | blend | why |
|---|---|---|---|
| `bg-emphasis` (sport) | white | `multiply` | multiply only darkens ⇒ white text can never drop below its contrast against the flat slab. Measured floor 6.49:1, same as the bare colour. |
| `bg-primary` (pelvico) | white | `multiply` | same argument, same direction. |
| `bg-secondary` (domicilio) | `text-primary` | `screen` | the mirror. Gold **multiplied** by a photo goes brown and takes dark blue to ~1:1 — invisible. Screened it floors at 4.25:1 vs the flat gold's own 4.22:1. |

Get it backwards and the page still looks right in the light frames and goes unreadable
in the dark ones — a bug a cross-fading slideshow hides, because the bad frame is only on
screen for part of the scroll. Re-measure before changing a slab's text colour.

For the two text panels (contatti, formazione) the dose is NOT `intensity`: their grounds
are light, so `PanelTexture` in `page.tsx` fades the whole layer over the ground instead
of piling more colour on top — which would paint a solid rectangle across the panel.

**The contatti panel is the cautionary tale.** With text sitting directly on the photo,
that `opacity` was a contrast budget with a ceiling of `0.22` — and the panel shipped at
`0.40`, where `text-primary` measures **1.97:1** against the photo's darkest pixel. It
looked fine and had simply stopped being readable. The client then asked for the photo to
be *more* visible, which under that arrangement is impossible.

The way out was structural, not numerical: **stop asking the photo to be a text ground.**
The copy and the form now sit on a `bg-white/85 backdrop-blur-md` card, so contrast is
measured against near-white and the texture is free to run at `0.75`. Measured with
`scripts/check-contrast.mjs` — which rebuilds the exact stack the browser composites and
reports the *worst pixel*, the only honest number on a photographic ground:

| | on the card | bare panel |
|---|---|---|
| `text-primary` heading | 6.63:1 | 1.97:1 |
| `text-ink/70` placeholder | 5.39:1 | — |

The sweep is the real argument: **with the card, every dose from 0.45 to 0.85 is
comfortably AA; without it, none is.** That is why this is a card and not a number someone
guessed well. Formazione has no card and stays at the `0.08` default — it already carries
the round portrait, and two images at the same volume fight.

`ContactForm`'s `inputBase` still carries `placeholder:text-ink/70` and `border-ink/30`
(up from `/40` and `/20`) because the fields are box-less — transparent inputs whose only
label IS the placeholder. It also runs at `text-lg`: the client asked, and the reason
holds independently — contrast ratio is measured on a solid glyph, and thin strokes at
14px on a busy ground have less of one. The underline is still under the 3:1 WCAG wants of
an input border; a recorded compromise, since fixing it properly means a visibly heavier
form than the one signed off.

### `PhotoSlab` and the scroll budget

`PhotoSlab` stacks N `DuotonePhoto`s in one scroll window and each **only fades in** —
none fades out. A photo at full opacity covers the one beneath, so there is never a frame
where two half-transparent layers let the slab colour show through as a brightness dip.

Its window used to be squeezed into whatever a scrubbed figure left over, starting only at
1360. It now runs `photoWindow(PANEL_END[i])` — from the moment the panel is seated
(`SNAP`) to a beat before it hands off — because on desktop the slab is already home when
the panel lands, so the photos ARE what it wears from the first frame ("teniamola già in
view e cicliamo solamente le foto con lo scroll").

`PHOTO_CYCLE` in `page.tsx` is how much scroll a panel keeps *after* its focus has landed:
the dissolve's pace, and the reason those panels are long. It is now free to change —
`PANEL_END` used to feed the mascot's `JOURNEY` through prefix sums, so shortening one
panel silently re-timed the whole page. The mascot is gone and so is that coupling; each
entry answers only to its own panel.

## The scroll engine — DO NOT MODIFY

`app/_scroll/*` and `app/ScrollShell.tsx` are treated as a **complete, external
library**. Build the site *with* it; do not edit it. If a feature needs an engine
change, write it up as a spec (see `JUMP_TO_FEATURE.md`) for the library's own repo
instead of patching here.

**There are exactly two exceptions, and both are marked in the files.**

**(1)** `handlePointerDown` in
`ScrollShell.tsx` carries `if (!e.isPrimary) return;` and a `try/catch` around
`setPointerCapture`, which throws `NotFoundError` when the pointer is no longer active —
a short tap, which is what the hero's index invites. It surfaced as an uncaught console
error on an ordinary interaction. Capture there is an optimisation, not a requirement
(the container already has `touch-action: none` and owns the move/up listeners), so
failing is harmless. Written up as seam 3 in `JUMP_TO_FEATURE.md`, where the slop
deferral would make the guard redundant.

**(2) Seam 4 — animations were abandoned mid-flight at a hand-off.** `advanceSection`
decides on the RAW scroll position while a widget's pose is drawn from a 90ms-smoothed
one, and `useSequenceProgress` used to `return` outright when its section went inactive —
so a fast scroll left every panel it passed frozen in a half-played pose, for good.
Patched in three places, all documented in-file and written up as seam 4:
`useSequenceProgress` now **eases to rest off-section** before going quiet (`settled` ref;
`auto` loops keep the old gate, and off-section reads go through `readPos` so an inactive
index can never integrate); `ScrollShell` bounds a frame's delta at `MAX_FRAME_DELTA` and
**carries** the remainder rather than discarding it; and the hand-off frame no longer
spends its delta twice on the incoming panel. Note the arithmetic recorded in the seam:
**more `DWELL` cannot fix this** — the smoother chases a moving target, so a residual gap
survives at any usable scroll speed. Only the settle is a guarantee.

Two is the limit. Don't take these as licence for a third.

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
  The **hero (index 0) is visible at scroll 0**, so its beats are on-load CSS animations
  (`.fisio-rise`, `.fisio-slide-in`, `.fisio-slide-left`, `.fisio-draw` — see
  `globals.css`), NOT scroll-gated reveals. Each animation must sit on **its own element**:
  a filled (`both`) CSS animation outranks inline styles permanently, so it would beat
  everything `SDiv` writes — which is also why the two cannot be stacked on one node.
  **The one deliberate exception**: on phones the hero's tail (address + index) reveals on
  scroll instead (`MOB_ADDRESS`/`MOB_INDEX` in `page.tsx`). Panel 0 owns 1100 units of
  scroll and on a phone nothing used them — the portrait drift and the scroll hint are both
  desktop-only — so scrolling through the hero felt like a delay before the page began. The
  trade is real and accepted: a visitor who lands and never scrolls does not see the address
  or the index; what stays above the fold is photo, name, role and the positioning line.
- Shared reveal presets (`UP`, `rev(i)`, `SNAP`) live at the top of `app/page.tsx`.
- **Everything else responsive is CSS** (`sm:`/`lg:`/`short:`) — with the deliberate
  exceptions in `app/site/useViewport.ts` (`useIsDesktop`, `useIsShort`). Each mirrors a
  Tailwind breakpoint exactly, so the JS branch and the CSS layout flip on the same pixel.
  Reach for them only for a decision CSS genuinely cannot express: whether an `SDiv`
  animation *runs at all* (its pose is an inline style no `lg:` class can override), or a
  count that depends on available room (`CvSheets`' entries per sheet). Never for layout.
- Respect `prefers-reduced-motion` (the CSS entrance animations already opt out).

## Site code (`app/site/`)

- `data.ts` — all copy + contact + `SECTION` indices + `HERO_INDEX`/`HERO_INDEX_EXTRA` +
  `FORMAZIONE`. `FORMAZIONE` now holds Alessia's **real** credentials, transcribed from
  the CV — with a ⚠️ block listing the two things still to confirm with her (a handful of
  probable typos in the PDF, and an email that disagrees with the one the site publishes).
- `page.tsx` — the 7 panels, composed from `<Section>`/`<SDiv>`:
  Hero *(cut-out + fascia oro che entrano da destra)* · Muscolo *(focus sport: 3 foto +
  Olimpiadi)* · Pelvico *(focus post parto: 2 foto)* · Domiciliare *(focus: 2 foto + mappa
  in inserto)* · Contatti *(texture + card)* · Formazione *(4 fogli di CV)* · Footer.
  `PanelTexture` (local to this file) is the full-panel photo ground used by the two text
  panels — absolute, so it costs no height in a `100svh` budget.
  The order and the "focus a destra" on each service are the client's own sequencing
  (`CLIENTE_TODO.md` §2) — sport is **not** a panel, it's the muscolo panel's focus.
- `FocusPanel.tsx` — that device. **It tells the story differently on the two viewports**,
  which is the current shape of the client's request: on desktop the slab is already home
  when the panel lands, wearing its photos, and the CONTENT arrives from the right; on
  phones the whole slab still slides in (asked for in capitals in `NUOVA_TODO.md`) with
  its content static inside. One window (`FOCUS_IN`/`FOCUS_SPAN`) drives either
  arrangement; the switch is `useIsDesktop`, because `SDiv`'s pose is an inline style that
  no `lg:` class can override. Two things break it if moved: the flex/gap/padding belong
  to the **inner wrapper** (leave them on the slab and the focus collapses into one flex
  item), and `backdrop` must stay **outside** that wrapper or the photos slide in with the
  text. A panel using it needs `end` past `FOCUS_LANDED` + dwell.
- `useViewport.ts` — `useIsDesktop` (`min-width: 1024px`, exactly where the slab becomes
  `lg:w-[55%]`) and `useIsShort` (`max-height: 740px`, the `short:` variant in JS). Both
  `useSyncExternalStore` over `matchMedia`, server snapshot `false`.
- `panelBox.ts` — `PANEL_BOX`, the one full-viewport box string, shared by `page.tsx`'s
  `shell` and by `FocusPanel` so the 100svh budget can only be tuned in one place.
- `photos.ts` — the photo manifest + `HERO_PHOTO` (see «Photos» above).
- `DuotonePhoto.tsx` — one photo filtered with a section colour. `blend` is a contrast
  decision — read the table above before touching it.
- `PhotoSlab.tsx` — N duotone photos cross-fading with a ken-burns inside a `FocusPanel`
  slab. Renders `absolute inset-0 z-0`, so the slab's own children need `relative z-10`.
- `CvSheets.tsx` — the formazione panel's sheets, dealt in from the right as you scroll
  (`x: 100%→0`, `scale: 1.2→1`, shadow fading out on its own layer because `box-shadow` is
  not an `anim.ts` channel). A longer CV buys **pages, not height**. No buttons: the page
  is told by scrolling, and a control in here would reopen the tap-vs-swipe seam.
  Three things it learned the hard way:
  **a sheet holds a NUMBER of entries, not a CV heading** — one-sheet-per-heading put five
  single-column entries on a phone and spilled off the panel, so headings are chunked to
  `PER_SHEET_DESKTOP`/`PER_SHEET_PHONE` and a heading that does not fit becomes
  "Esperienza · 1/2";
  **the box has no height** — the sheets stack with `grid` (all in `row-start-1
  col-start-1`), so the row is as tall as the fullest sheet and stretches the rest to
  match, instead of a `h-[min(…)]` guessed against desktop;
  **the panel's span is fixed and the step divides out of it** (`SHEETS_SPAN`), so the
  phone's six sheets — or a short phone's nine — deal faster than the desktop's four rather
  than needing a different `end`, which a `<Section>` cannot have, being authored once for
  all of them. Capacity is `PER_SHEET_DESKTOP` / `PER_SHEET_PHONE` / `PER_SHEET_SHORT`
  (6 / 3 / 2): two columns, one column, and one column on a screen that cannot afford three
  rows — the SE case, where the third entry's second line ran past the fold.
- `HeroPortrait.tsx` — the portrait, **dead straight** (the client asked for it) and now a
  **cut-out with a real alpha channel**, in a `<picture>` with two framings (desktop 3:4,
  phone a square bust — art direction `next/image` cannot express). There is no
  background in the file, so what sits behind her is the slab's own CSS gold: nothing to
  match, no seam. See «Photos» for how the alpha is recovered from a source that only
  pretends to have one.

  Its entrance is on load, like everything else in panel 0, and it is the leitmotiv of the
  service panels played once: at `0.10s` the **gold half** comes in from the left and the
  **berry blade** from the right; at `0.22s` the **white slab** carrying the photo covers
  the blade down to a ~50px strip, which lands exactly on the gold/white seam and so reads
  as a divider rather than an edge. The portrait itself carries no animation.

  It used to: `.fisio-lift` grew her to 1.1 and switched on a `drop-shadow`. Both are gone,
  and not only because the shadow was dropped — **a final overshoot is in direct conflict
  with a bottom-anchored portrait sized to fill its half**, since her resting size would
  have to be 10% under the space she is meant to occupy. Removing it is what paid for the
  extra 10%.

  **She is bottom-anchored** (`lg:items-end`, `lg:pb-0`): the source is cut across her
  thighs, and butting that cut against the fold turns a crop into a BASE — she continues
  past the frame instead of ending in mid-air. It is also why the scroll drift moves her
  DOWN (`y: 0 → 14`): lifting a bottom-anchored figure opens a strip of white under her
  feet, while sinking just pushes the cut past the fold where nothing shows.

  That drift is **desktop only** (`HERO_DRIFT` in `page.tsx`). On phones she does not move
  at all, for two reasons that agree: the motion in that half of the screen is already
  spoken for (the gold CARD rises over her — see below), and she has only ~55px of air over
  her crown there, so any upward travel, parallax included, shaves it off against the
  panel's `overflow-hidden`. One rule cannot serve both, which is why it is gated in JS.

  Her size is capped in `page.tsx` as `lg:w-[min(69svh,39vw)]`, and both terms are
  viewport-relative on purpose — the cap used to carry a `34rem` term and THAT is what
  bound, holding her to 544px inside an 883px slab on a 1920x1080 screen.
  - `69svh` is **height in disguise**: a 3:4 portrait is 1.33x as tall as it is wide, so
    69svh of width is ~92svh of height — full to the fold with ~8svh of air over her head.
    Raise it and you cut her head off (the panel is `overflow-hidden`).
  - `39vw` guards the other axis: the slab is `46vw`, so this leaves ~3.5vw of air per
    side. It is the term that binds below 16:9 — on 1024x768 it resolves to 399px inside a
    471px slab.

  **The gold is the TEXT's half now** — `left-0 w-[54vw]` on desktop. It swapped sides with
  the portrait for the halo reason above; before that it was on the right and, on phones,
  ran to the TOP of the viewport instead.

  **On phones the gold is not a band any more, it is a CARD that RISES.** The panel used to
  waste its viewport in two opposite ways at once: a 202x253 portrait (her head at 84px) and,
  under it, ~220px of empty gold, because the address and the index only fade in on scroll.
  Now the photo is a **74svh full-bleed band** at the top (`short:` 56svh) and the gold —
  rule, background, copy, address and index, all one group — sits below it and **translates
  up** as you scroll (`SHEET_RISE`/`SHEET_DY` in `page.tsx`), bringing its own tail into
  view. The berry rule is still the line she stands on at rest; by the end of the panel it
  has climbed to about her neck.

  Four things in that arrangement are not free-form:
  - **The band bleeds past the panel's padding** (`max-lg:-mt-8`, `w-[min(100vw,74svh)]`
    centred by `items-center`) and carries `shrink-0` — this column's main axis is vertical
    and it deliberately overflows, so without it the flex algorithm compresses the band to
    make the numbers work.
  - **The panel gets `max-lg:h-[100svh]`**, because `min-h-[100svh]` alone GROWS with its
    content, and a panel 1054px tall instead of 844 shifts every later panel's `offsetTop`
    while the engine pins `scrollTop` to it each frame. Definite height + the
    `overflow-hidden` `PANEL_BOX` already has: the tail exists, sits outside, and costs
    nothing. Also `max-lg:justify-start` — `justify-center` would split the overflow between
    top and bottom, i.e. shear her crown.
  - **`SHEET_DY` is the one knob, and it is read with a formula, not by eye.** The band shows
    all 1122 rows of the crop, so at the end of the rise `rows = 1122 * (1 - SHEET_DY/band)`
    of her are still visible, counted from source row 128. Landmarks: chin ~760, shoulder
    join 875. Raise it and the card climbs onto her chin; lower it and the index stays under
    the fold. It is also why `short:` uses a much lower band (56svh, not 70): on a 667px
    screen a tall band makes that ratio explode and the card cuts her across the face.
  - **The final photo height is decided by the card's content, not by the resting height** —
    `viewport − padding − content` either way. That is why "3/4 at rest" was free, and why
    the neck is where the card stops.

  `MOB_ADDRESS`/`MOB_INDEX` are still scroll windows but now carry **opacity only**: with
  `UP` their `y: 24 → 0` would run against the card's rise, two vertical motions at once.

  ⚠️ **The hero is the page's tightest panel on a phone** — portrait plus five blocks of
  copy plus the index — and `short:` (≤740px tall) does not help the case that actually
  fails, a 390x844-class phone. Its height budget is therefore trimmed on WIDTH:
  `max-lg:py-8` (against `PANEL_BOX`'s desktop-sized `py-24`), an `h1` on
  `clamp(1.7rem,8vw,2.6rem)` so "Alessia Stefanello" stays on ONE line (a wrap there costs a
  whole line of the budget), and the index at `0.8rem` below `sm` so its longest label stops
  wrapping. The scroll hint is `lg`-only: centred at the bottom, it lands exactly on the
  index.

  ⚠️ **Gold is a ground that eats the palette.** Measured against `--brand-secondary`:
  `text-secondary` is invisible by definition, `text-emphasis` is 2.88:1, and even full
  `text-primary` only reaches 3.75:1 — which buys large text (3:1) and nothing else. So on
  that half the hierarchy is carried by weights of `ink` (4.53 at `/75`, 7.26 at full), and
  the blue is spent only where it can be: the headline, which is large, and the rules
  beside the role, which are non-text and owe 3:1. `node scripts/check-contrast.mjs` prints
  the whole table — add a line there before adding a colour here.

  The **white slab is the wrapper's own background** and the portrait is centred inside it
  — one box, not two (and that background is also what covers the blade). It used to be a `<span>` hung off the photo's grid cell bleeding
  `-right-[50vw]` to the screen edge while the photo was centred in that cell: two
  reference frames for two things that must look concentric, which put the photo 164px
  left of the gold's centre on a 1883px window and got worse as the monitor grew. The old
  note here said the slab had to hang off the cell or a `vw` slab would drift away from
  the column — true while the photo was in the grid, impossible now that they are the same
  box. **Don't restore it.**

  The text half is the mirror of that: `lg:w-[54vw] lg:self-start`, with the copy
  `mx-auto` inside it, so it is centred in the WHITE half exactly as the portrait is
  centred in the gold one. It shipped once as `ml-auto` parking the text against the
  gold's edge, which on a 1895px window read as 520px of void on the left and 64 on the
  right — that asymmetry is what "the space is badly distributed" meant, twice. The copy
  itself is centred, the role hangs between two gold rules, and where the CTA and the
  phone number used to be there is now the **studio's address**: someone looking for a
  physiotherapist wants to know WHERE first, and call/email are one tap away in the badge.

- `ServiceIndex.tsx` — the hero's index, in **two groups**: the three services under
  "Lavoro in ambito:", and "La mia formazione" held apart under its own rule (it is not a
  service and was reading as a fourth one). Each entry scrolls to its panel via
  `useSectionJump` (seam 1 below) — `e.currentTarget` is load-bearing there, and the hook
  is called ONCE in the parent, since it keeps "at most one jump in flight" in a ref.
- `HeroFigure.tsx` — hand-authored SVG line figure (approximation of the biglietto da
  visita; swap for the real asset when available). Only the footer uses it now.
- `PadovaMap.tsx` — a Google Maps `<iframe>` embed (no library, no API key), an **inset
  card** on the gold slab rather than the slab's main event. **No radius any more**: the
  dashed ring forced the camera to frame ~120 km of Veneto to fit, and at that zoom
  nothing on the map was legible — "non si vede dove punta". It now uses the
  `?q=<address>&output=embed` form, which geocodes and drops a real pin on the studio's
  door (`CONTACT.mapsQuery`, shared with the "apri in Google Maps" link so the two can
  never disagree); how far she travels is said in words on the panel. The iframe is
  `pointer-events-none` on purpose: a gesture inside an iframe never reaches `ScrollShell`.
  The embed's own controls cannot be hidden, so decluttering the phone means **not
  shrinking the card** (`short:max-w-[16rem]`, was 12rem) and keeping our own pill above
  `sm`.
- `ContactForm.tsx` — **one minimal 3-field form** (Nome · Telefono · Messaggio), same on
  every viewport; submit opens a prefilled `mailto:` (no backend, see `contact.ts`). The
  wider 7-field shape survives only as `AppointmentFields` in `contact.ts`, which
  `appointmentMailto` composes and filters — add a field to the form and the email picks
  it up with no other change. The form must stay short: panel 4 has to fit `100svh`.
- `ContactBar.tsx` — the quick-contact badge, **portaled to `<body>`** (like DevHud) so it
  escapes the panel layout while still living under the scroll context — and, being
  outside the shell's container, its pointer events never meet the wheel hijack. It is now
  **one motif on every viewport**: a pill (avatar, call, email, chevron) with the detail
  behind a disclosure. Call and email stay direct links whether it is open or shut —
  hiding a physiotherapist's phone number behind a click would be decluttering the wrong
  thing.

### Four engine seams the site works around (see `JUMP_TO_FEATURE.md`)

1. **No scroll-to-section API.** The hero's `ServiceIndex` jumps via
   **`app/site/useSectionJump.ts`** — a site-side workaround that drives the engine **from
   its own input**: a rAF loop dispatching synthetic `wheel` events on the clicked element
   (they bubble to the shell's container listener), watching the public
   `store.state.sectionIndex` until it reaches the target, then feeding `LAND` more units
   so the panel seats and its reveals play. No engine file is touched.
   Why not just write the positions (what the `JUMP_TO_FEATURE.md` patch does): the
   **global** scroll counter only advances from the accumulator, and every `rawAnim` is
   measured against it. Feeding the accumulator keeps section, snap glide, reveals and
   global counter in phase for free; setting per-index positions leaves the global counter
   behind. If that patch ever lands, it needs to move the global counter too.
   When the engine ships `useScrollNav().jumpTo(index)`, rewrite the **body of that hook**
   — callers don't change.
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

3. **`setPointerCapture` throws on a short tap.** One of the two places the engine is
   patched here — see «The scroll engine» above for the guard and why it is safe. The proper fix
   (capture on the first committed move, not at `pointerdown`) is written up in
   `JUMP_TO_FEATURE.md`; if it lands, delete the guard *and* `useTapVsSwipe`, since it
   settles seam 2 as well.

4. **Animations abandoned mid-flight at a hand-off.** The second place the engine is
   patched here — see «The scroll engine» above for what changed and why. `MAX_FRAME_DELTA`
   (`ScrollShell.tsx`) is the one knob a designer touches: it sets how much of a panel you
   see play when someone flings the page, and its docblock carries the table. Lower it if
   panels still flick past, raise it if a fast scroll feels sluggish. It does NOT control
   whether animations finish — that is unconditional now.
