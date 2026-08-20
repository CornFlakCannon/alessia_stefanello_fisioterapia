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

**The real studio photos are in.** They live in the coloured focus slabs, filtered with
the section colour (see «Photos» below). The only service still without one is
*pavimento pelvico* — no such shot exists, so that slab keeps its drawn `Bridge.lottie`.

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
- `npm run photos` — rebuild every image derivative from the originals (see «Photos»).
  Only needed when a crop changes or a new original arrives; the outputs are committed.
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

The camera originals (13 JPG at 6000x4000, plus the 4K studio video) are **not in the
repo**: they sit in `FOTO_ORIGINALI/`, which is gitignored. What ships is derivatives:

- `public/foto/*.webp` — hand-cropped stills, ~1200x1600 (the two full-panel textures are
  wider, 2200px), 75-190 KB each. Built by `scripts/crop-photos.mjs` (sharp). The
  originals are landscape and the slabs are tall and narrow, so **the crop is chosen by
  hand there, per photo**, rather than left to `object-cover` to guess — that is the whole
  point of the script. One `crop` line per photo is the only thing to touch when a
  framing is wrong.
- `public/hero/alessia.webm` + `alessia.mp4` + `poster.webp` — the hero video, 1080x1440.
  Built by `scripts/hero-video.sh` (ffmpeg) from `FOTO_ORIGINALI/V1.mp4`. Two encodes of
  one crop; the browser downloads whichever `<source>` it can play, never both.

  **This used to be a 27-frame `ImageSequence`, and the swap is the point.** Measured on
  the same source, same crop, same 1080x1440:

  | | frames | weight | requests |
  |---|---|---|---|
  | 27 stepped `.webp` | 27 | 1008 KB | 27 |
  | VP9 / WebM crf32 | **81 @ 25fps** | **361 KB** | 1 |
  | H.264 / MP4 crf23 (fallback) | 81 @ 25fps | 573 KB | 1 |

  Three times the frames at a third of the weight, because a video codec compresses along
  time and independent stills cannot. `ImageSequence` is the right widget for a sequence
  **scrubbed by scroll**; this animation runs on a clock, so it is not that.

  It also deletes a bug class. `ImageSequence` takes a hand-written `frames` count with no
  runtime check, and assigning a 404 URL to its live `<img>` **discards the good frame
  that was showing** and renders the broken-image icon. When `frames` said 41 and disk had
  27, the last third of the hero was a broken image — on the panel that sells the site.
  A video has no such number.

  Flags that are load-bearing in the script: `-an` (browsers only autoplay MUTED video —
  a stray audio track plus a missing `muted` attribute means it silently never starts),
  `+faststart` on the mp4 (moov atom first, so playback can begin mid-download), and
  `format=yuv420p` for decoder compatibility.

  **The background, and why it is baked in rather than shipped as alpha.** The script has
  a second branch: drop an AI matte at `FOTO_ORIGINALI/V1-alpha/` (PNG sequence) or
  `V1-alpha.mov` and it composites the subject onto the brand gold **at build time**, so
  what ships is still an ordinary opaque video. Two reasons, both checked rather than
  assumed:

  - *Don't try to key the wall.* It is a grey-green GRADIENT (`#c9cdc9` at the top down to
    `#a7a89e`) and her white trousers measure `#adacb4` — **inside that range**. A
    `colorkey` deletes the trousers outright and punches holes in her face; I ran it. Only
    an AI matte (Runway, AE Roto Brush, RVM/BiRefNet) separates her.
  - *A green screen (`V1-green.*`) is the preferred route, and it is self-tuning.* The key
    colour is **measured off the file every run** (`scripts/probe-bg.mjs`), because a
    "green screen" out of an editor is not `#00ff00`: the one that arrived measures
    `#259029`, a dark green with a gradient, and keying nominal pure green against it does
    nothing at all. The tolerances are `0.07:0.005` and they are tight **on purpose** —
    counter-intuitively, `blend` here is not edge softness but subject transparency: at
    `0.10` she visibly washes out into the gold, and by similarity `0.18` the subject is
    gone entirely (0.01% of the frame left). Measured sweep; widen them and you fade her,
    not the fringe. Result: zero green pixels in 7.8M, background within 1 level of the
    slab.
  - *A repainted background (`V1-gold.*`) is used **straight** by default* — crop, scale,
    encode, nothing else. It keeps whatever background the tool painted, and on the clip
    that came back that is `#b68534` **with a gradient** (the tool tinted the wall rather
    than replacing it), i.e. 55-69 levels off `#edab39`: the video reads as a darker
    rectangle on the band. That is a known, measured, accepted trade — `check-gold` prints
    the number on every run, and being out of tolerance is expected on this route, not a
    fault. Three levers if the rectangle is not wanted: `HERO_MATTE=1` (below), a
    `mask-image` feather on the video's edges site-side, or a green copy to key.
  - *`HERO_MATTE=1` uses that same file as a **matte donor** instead.* It cannot be keyed —
    her skin and hair are chromatically inside that gold (min subject-background distance
    45; `chromakey` at its *lowest* tolerance already deletes her entire head). But the
    subject is identical in both files, so **where the two agree there is her and where
    they differ there is background** — a matte, with no key. Applied to the 4K original
    with our own gold behind it, the wrong colour and the halved resolution both go away.
    Two steps make it work and must not be "simplified" away: **blur both before
    differencing** (fine detail encodes differently in the two files and punched gold holes
    through her eyes) and **flood-fill the interior holes** afterwards
    (`scripts/fill-matte.mjs` — one blob outlived the blur, sitting across an eyebrow).
  - *If the tool can only paint a solid colour, ask for gold and **never black**.* Minimum
    RGB distance from each candidate background to the nearest of ~69k sampled subject
    pixels (skin, hair, navy uniform, white trousers):

    | background | min distance | verdict |
    |---|---|---|
    | black `#000000` | **0** — 47% of subject pixels inside key tolerance | never |
    | gold `#edab39` | 77 | keyable but tight (warm skin/hair are the near miss) |
    | green `#00b140` | 126 | safe |
    | green `#00ff00` | 204 | safest |

    Her uniform is navy, i.e. near-black — keying black would delete her the way keying
    the grey wall deleted her trousers. Gold direct is best (no key at all, no generation
    loss); a green copy is the insurance in case the tool's gold is off.
  - *Don't ship transparency to the browser.* VP9+alpha in WebM works in Chrome/Firefox/
    Edge but **not Safari**, which wants HEVC+alpha in mp4 — an Apple-only encode. Half
    this site's visitors are on iPhone, so Safari cannot be the degraded case. And it buys
    nothing: what sits behind her is a flat colour we control. The obvious risk of baking
    is a seam where the video's flat gold meets the identical CSS gold, so I measured it —
    a solid `#edab39` survives both encodes to **within one level per channel**
    (237,170,56 vs 237,171,57), which is invisible. Tagging full-range bt709 explicitly
    made it *worse* (−2), which is why the script sets no colour tags. `GOLD` in the
    script must stay equal to `--brand-secondary`.

  Whenever the background is supposed to BE the slab, `scripts/check-gold.mjs` samples the
  output's four corners and reports the drift, failing past `GOLD_TOLERANCE` (2 levels).
  That number exists so nobody has to judge a 3-level seam by eye on an uncalibrated
  screen: under it the rectangle is invisible, over it the fix is the green copy.

  `fill-matte.mjs` reports a second number, for the failure mode a still cannot show: a
  difference matte can make the outline *flicker*. The obvious metric is wrong —
  frame-to-frame change in silhouette area is dominated by her actually moving (39% → 48%
  of the frame as she crosses her arms). What separates them is the SIGN: real motion
  drifts coherently, flicker oscillates. This footage inverts sign 30% of the time; pure
  jitter would sit near 50%, and `FLICKER_LIMIT` is 35%.

  The crop is written against the input (`crop=ih*CROP_RATIO:ih:(iw-ih*CROP_RATIO)*CROP_BIAS:0`),
  not in absolute pixels, because these tools return whatever resolution they like — the
  first one halved it, and hard-coded numbers simply crash. Only valid while the source is
  16:9; `check_aspect` says so if it is not.

  **`CROP_BIAS` is 0.50 because it was measured**, not eyeballed: across all 81 frames she
  spans 1200..2656 of the 3840-wide frame, i.e. centred on 1928 — the frame's own centre.
  It shipped once as 0.5473, which started the window 15px past her left edge while
  wasting 179 on the right. That clipped her arm, but **only in the last third**, because
  that is where she crosses her arms and gets wider — an off-centre crop always fails late,
  which is why the script now checks the subject's box against the frame on every frame
  instead of trusting the number.

  **`CROP_RATIO` (0.75) is the output's shape**, and it is the answer to "make the crop
  wider": from a 1080-tall frame the widest 3:4 column is 810px, full stop — more air means
  a different ratio, not a wider window. Note the catch before reaching for it: the hero's
  size cap is on HEIGHT, so a wider ratio at the same cap buys background, not subject —
  she ends up smaller, not better framed. Changing it also means updating
  `HERO_VIDEO.width/height`.

  Output size is computed in the shell (`geometry`), not by an expression inside the filter
  graph, because the compositing branches lay the subject over a `color` plate that must be
  exactly the same size. When the scale was an in-graph `min(W,iw)` and the plate a fixed
  `WxH`, an 810-wide foreground landed top-left on a 1080-wide plate and the output carried
  270px of dead gold down one side. `W` is a ceiling, not a target: a 1080p source crops to
  810 and stays there rather than being upscaled into bytes with no detail. `HERO_MATTE=1`
  pins both its inputs to the original's geometry instead, since `blend` refuses inputs of
  differing dimensions.

  This is why `HERO_VIDEO.width/height` in `photos.ts` are the **3:4 ratio** and not the
  encode's pixel size: they only reserve the box for `<video>`, the ratio is invariant, and
  reading them as a claim about the file would mean editing them every time a source
  changes resolution.

`app/site/photos.ts` is the manifest: `src`/`width`/`height`/`alt`/`position` per photo,
plus `HERO_VIDEO`. **All thirteen stills are built, not just the ones used** — swapping
which photo a section wears is a one-line change there.

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
| `bg-secondary` (domicilio) | `text-primary` | `screen` | the mirror. Gold **multiplied** by a photo goes brown and takes dark blue to ~1:1 — invisible. Screened it floors at 4.25:1 vs the flat gold's own 4.22:1. |

Get it backwards and the page still looks right in the light frames and goes unreadable
in the dark ones — a bug a cross-fading slideshow hides, because the bad frame is only on
screen for part of the scroll. Re-measure before changing a slab's text colour.

For the two text panels (contatti, formazione) the dose is NOT `intensity`: their grounds
are light, so `PanelTexture` in `page.tsx` fades the whole layer over the ground instead
of piling more colour on top — which would paint a solid rectangle across the panel. Its
`opacity` prop is that dose, and it is a **contrast budget**: contatti runs the studio
shot at `0.22`, which is the last value where every piece of text on that panel still
clears 4.5:1 (the heading is the first to fail, at ~0.25). Formazione stays at the `0.08`
default on purpose — it already has the round portrait, and two images at the same volume
fight. The measured table is in `PanelTexture`'s own docblock; re-measure rather than
nudging the number by eye.

That photo is also why `ContactForm`'s `inputBase` carries `placeholder:text-ink/70` and
`border-ink/30` rather than the `/40` and `/20` it shipped with: the fields are
box-less — transparent inputs whose only label IS the placeholder — so a ground with
structure in it needed both faint values raised. Both now measure better than they did on
the old plain white (the placeholder was already under 4.5:1 there). The underline is
still under the 3:1 WCAG wants of an input border; that is a recorded compromise, since
fixing it properly means a visibly heavier form than the one signed off.

### `PhotoSlab` and the scroll budget

`PhotoSlab` stacks N `DuotonePhoto`s in one scroll window and each **only fades in** —
none fades out. A photo at full opacity covers the one beneath, so there is never a frame
where two half-transparent layers let the slab colour show through as a brightness dip.

Its window on the muscolo panel is **exactly the one the athlete `ScrollLottie` used to
occupy** (`FIGURE_IN`..`FIGURE_OUT`). That is deliberate: `PANEL_END` feeds `JOURNEY` via
prefix sums, so shrinking a panel because its figure went away would silently re-time the
`TravellingFigure` mascot down the whole page. Reuse the budget; don't reclaim it.

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

- `data.ts` — all copy + contact + `SECTION` indices + `HERO_INDEX` + `FORMAZIONE` +
  `HOME_RADIUS_KM`. **`FORMAZIONE.items` are placeholders**, not Alessia's real
  qualifications — they must be replaced before this goes live.
- `page.tsx` — the 7 panels, composed from `<Section>`/`<SDiv>`:
  Hero *(video in autoplay)* · Muscolo *(focus sport: 3 foto + Olimpiadi)* · Pelvico *(focus post
  parto, ancora disegnato)* · Domiciliare *(focus: 2 foto + mappa in inserto)* ·
  Contatti *(texture)* · Formazione *(texture + ritratto)* · Footer.
  `PanelTexture` (local to this file) is the faint full-panel photo ground used by the
  two text panels — absolute, so it costs no height in a `100svh` budget.
  The order and the "focus a destra" on each service are the client's own sequencing
  (`CLIENTE_TODO.md` §2) — sport is **not** a panel, it's the muscolo panel's focus.
- `FocusPanel.tsx` — that device, extracted: the explanation reveals centred, then a
  full-height coloured slab slides in from the right with a sub-beat while the text
  slides left. Both motions share one window (`FOCUS_IN`/`FOCUS_SPAN`). A panel using
  it needs `end` past `FOCUS_LANDED` + dwell, or the slab never finishes arriving.
- `panelBox.ts` — `PANEL_BOX`, the one full-viewport box string, shared by `page.tsx`'s
  `shell` and by `FocusPanel` so the 100svh budget can only be tuned in one place.
- `photos.ts` — the photo manifest + `HERO_VIDEO` (see «Photos» above).
- `DuotonePhoto.tsx` — one photo filtered with a section colour. `blend` is a contrast
  decision — read the table above before touching it.
- `PhotoSlab.tsx` — N duotone photos cross-fading with a ken-burns inside a `FocusPanel`
  slab. Renders `absolute inset-0 z-0`, so the slab's own children need `relative z-10`.
- `HeroPortrait.tsx` — the photo, **dead straight** (the client asked for it), surfacing
  from a drawn horizontal rule that is really the bottom edge of its clip box
  (`.fisio-line` / `.fisio-emerge`). It is a **`<video>` that plays itself once**, not a
  still and not a scroll-scrubbed sequence: `PLAY_DELAY` (1400ms) after mount she crosses
  her arms, then it stops on the last frame and stays there. That delay is where
  `.fisio-emerge` ends, so the beats queue — line, then surface, then move — instead of
  colliding. It calls `play()` from an effect rather than using the `autoplay` attribute
  precisely so that timing is ours; `muted` is what makes a scripted play legal.
  `PLAY_DELAY` is 1000ms and the number is load-bearing: the clip's own first **400ms is
  her standing still** (measured — the arms start at frame 10 of 25fps), and
  `.fisio-emerge` runs 500→1400ms. Starting at 1400 therefore meant she surfaced, held
  motionless for 400ms, then moved. At 1000 the video's still opening covers the tail of
  the rise and her arms begin at 1000+400 = 1400, the exact instant she is fully up.
  This follows the panel's own rule: the hero is on screen at scroll 0, so its motion is
  authored **on load**. `prefers-reduced-motion` is honoured at the call site (nothing in
  `app/_scroll` or `app/widgets` looks at that query) by parking on the LAST frame — the
  composed pose, not an interrupted one.

  Its size is capped in `page.tsx` as `lg:w-[min(34rem,60svh,38vw)]`. The `60svh` is the
  one that usually binds — **viewport HEIGHT is the real constraint**, because a 3:4
  portrait is 1.33x as tall as it is wide and the panel owes 100svh. That is also the
  standing answer to "make it as big as the gold half": at the band's full width it would
  be ~1155px tall on a 904px window, i.e. permanently clipped and unreachable. The `38vw`
  guards the other axis — the band is `46vw`, and without that term a 1024x768 window
  resolves `60svh` to 461px inside a 471px band, glued to both edges. Raise the `60svh` to
  grow her, then re-check at 768px tall. The hero's gold is a **slab**, not the whole panel:
  a right-hand slab on desktop, a band hanging off the photo on phones. Two elements,
  one per viewport, both `absolute` — an abspos child resolves against the padding box,
  so the panel's own padding never insets them.
  The **gold is this element's own background**, and the portrait is centred inside it —
  one box, not two. It used to be a `<span>` hung off the photo's grid cell bleeding
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
  right — that asymmetry is what "the space is badly distributed" meant, twice.

- `ServiceIndex.tsx` — the hero's index of the four services; each entry scrolls to its
  panel via `useSectionJump` (see seam 1 below).
- `HeroFigure.tsx` — hand-authored SVG line figure (approximation of the biglietto da
  visita; swap for the real asset when available).
- `PadovaMap.tsx` — a Google Maps `<iframe>` embed (no library, no API key) with the
  home-visit radius drawn over it. Since the gold slab now wears a photo it is sized down
  to an **inset card** (`max-w-[15rem]`) with a shadow, not the slab's main event. The iframe is `pointer-events-none` on purpose: a
  gesture inside an iframe never reaches `ScrollShell`. `revealAt` moves the ring's
  reveal — it rides in on the domiciliare slab, so the default would play off-stage.
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
