#!/usr/bin/env bash
# The hero video: Alessia crosses her arms, once, when the page lands.
#
# Source is FOTO_ORIGINALI/V1.mp4 — 3840x2160, h264, 25 fps, 81 frames, 3.2 s, with audio.
# The hero box is a 3:4 portrait, so the landscape frame is cropped to a vertical column
# centred on her.
#
#   bash scripts/hero-video.sh
#
# ## Why a video and not a frame sequence
# This shipped first as 27 numbered .webp scrubbed by `ImageSequence`. Same crop, same
# 1080x1440, measured on this exact file:
#
#     27 stepped .webp   1008 KB   27 requests
#     VP9 / WebM         361 KB     1 request    81 frames @ 25fps
#     H.264 / MP4        573 KB     1 request    81 frames @ 25fps
#
# Three times the frames at a third of the weight, because a video codec compresses along
# time and 27 independent stills cannot. `ImageSequence` is the right widget for a
# sequence SCRUBBED BY SCROLL; once the animation runs on a clock, a video element is the
# right tool — and it removes a hand-maintained frame count that has to stay in step with
# what is on disk (getting that wrong is what broke the hero once already).
#
# ## Flags that are load-bearing
#   -an              strip audio. Browsers only autoplay MUTED video; a stray audio track
#                    plus a missing `muted` attribute means it silently never starts.
#   +faststart       (mp4) moves the moov atom to the front so playback can begin before
#                    the file has finished downloading.
#   -pix_fmt yuv420p maximum decoder compatibility, Safari included.
#
# ## The background
# The studio wall is a grey-green GRADIENT (#c9cdc9 at the top down to #a7a89e), and her
# white trousers measure #adacb4 — INSIDE that range. So `colorkey`/`lumakey`/`chromakey`
# cannot separate her: keying the wall deletes the trousers and punches holes in her skin.
# Measured, tried, confirmed. Don't reach for a key here.
#
# What works is an AI matte (Runway, After Effects Roto Brush, RVM/BiRefNet locally),
# exported as a PNG SEQUENCE WITH ALPHA or ProRes 4444 — never a "green screen" mp4, whose
# re-key loses the soft hair edges all over again.
#
# Drop the export at one of the paths below and this script does the rest. Whatever the
# route, what SHIPS is an ordinary opaque video with the gold already baked in:
#
#     FOTO_ORIGINALI/V1-alpha/%04d.png   PNG sequence with alpha        — best
#     FOTO_ORIGINALI/V1-alpha.mov        single file with alpha         — best
#     FOTO_ORIGINALI/V1-green.*          background solid green         — keyed here
#     FOTO_ORIGINALI/V1-gold.*           background repainted           — used STRAIGHT
#
# ## A repainted source (V1-gold) is used STRAIGHT by default
# Crop, scale, encode — nothing else. It keeps whatever background the tool painted.
# On the clip that came back that means #b68534 with a gradient, i.e. 55-69 levels off
# #edab39, so the video reads as a darker rectangle sitting on the CSS band. That is a
# known, measured, accepted trade: check-gold prints the number on every run.
#
# Two levers if that rectangle is not wanted:
#   HERO_MATTE=1     composite onto the exact brand gold — see below
#   mask-image       feather the video's edges site-side so no seam can show at all
#
# ## HERO_MATTE=1 — the repainted file as a MATTE DONOR instead
# The clip that came back also could not be keyed: her skin and hair are chromatically
# inside that gold (minimum subject-background distance 45; chromakey at its LOWEST
# tolerance already deletes her whole head). But the SUBJECT is identical in both files —
# only the background differs. So where the two agree there is her, where they differ
# there is background: a matte, obtained without keying anything. Applied to the 4K
# original with our own gold behind it, all three defects go at once — the cutout from the
# tool, the sharpness from V1.mp4, the colour from us.
#
# Two steps are what make that work, so don't "simplify" them away:
#   - BLUR BOTH before differencing. Fine detail (lashes, eyebrows) is encoded differently
#     in the two files and registered as difference in the middle of her face, punching
#     gold holes through her eyes. Blurred, only the real difference survives.
#   - FILL THE INTERIOR HOLES afterwards (scripts/fill-matte.mjs). One blob across an
#     eyebrow outlived the blur; a flood fill from the frame border removes every enclosed
#     false positive without a threshold to tune.
#
# ## If the tool can only paint a solid colour: ask for GOLD, and NEVER black
# Measured on ~69k subject pixels (skin, hair, navy uniform, white trousers), minimum RGB
# distance from each candidate background to the nearest subject colour:
#
#     black   #000000     0   <- 47% of subject pixels within key tolerance. NEVER.
#     gold    #edab39    77   <- keyable but tight; her warm skin/hair are the near miss
#     green   #00b140   126   <- safe
#     green   #00ff00   204   <- safest
#
# Her uniform is navy, i.e. nearly black: keying black would delete her exactly the way
# keying the grey wall deleted her white trousers. Gold direct is best (zero key, zero
# generation loss); green is the insurance copy in case the tool's gold is off — the
# V1-gold branch measures that for you and says so.
#
# Baking beats shipping transparency. Alpha video on the web is split down the middle —
# VP9+alpha in WebM works in Chrome/Firefox/Edge but NOT Safari, which wants HEVC+alpha in
# mp4 (an Apple-only encode). Half this site's visitors are on an iPhone, so Safari cannot
# be the degraded case. And it is unnecessary: what sits behind her is a flat colour we
# choose. Verified that the seam does not show — a solid #edab39 survives both encodes to
# within ONE level per channel (237,170,56 vs 237,171,57); explicitly tagging full-range
# bt709 made it WORSE (-2), which is why no colour tags are set below.
#
# GOLD must stay equal to --brand-secondary in app/globals.css. If the brand gold ever
# changes, re-run this.
#
# CROP_X is the only framing knob — the horizontal offset of the 1620px-wide column inside
# the 3840px frame. Her arms swing outward at the start, so leave margin on both sides.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=FOTO_ORIGINALI/V1.mp4
ALPHA_SEQ=FOTO_ORIGINALI/V1-alpha
ALPHA_MOV=FOTO_ORIGINALI/V1-alpha.mov
OUT=public/hero
# Largest per-channel difference from GOLD still considered seamless. 1 level is the
# encoder's own round-trip error (measured); past 2 a flat field starts to read as a
# rectangle against the identical CSS colour.
GOLD_TOLERANCE=2
# The crop is expressed against the INPUT, not in absolute pixels: sources come back from
# background-removal tools at whatever resolution they feel like (the first one halved it),
# and hard-coded numbers simply crash there. Only valid while the source is 16:9; the
# script checks and says so if it is not.
#
# CROP_RATIO is the output's shape (width / height). 0.75 is the 3:4 portrait the hero box
# expects — changing it is a composition decision, not a crop tweak, and it also means
# updating HERO_VIDEO.width/height in app/site/photos.ts, which encode that same ratio.
# NOTE the ceiling it implies: from a frame 1080 tall the widest 3:4 column is 810px (1620
# from a 2160-tall one). "Make the crop wider" past that is this constant, not the bias.
CROP_RATIO=0.75
# Where the column sits in the leftover width, 0 = hard left, 1 = hard right.
# MEASURED, not guessed: across all 81 frames she spans 1200..2656 of the 3840-wide frame,
# i.e. centred on 1928 — the frame's own centre. So 0.5. The first version of this was
# 0.5473, eyeballed, and it started the window 15px past her left edge while wasting 179 on
# the right: it clipped her arm, but only in the last third, because that is where she
# crosses her arms and gets wider. Anything off-centre here has that same delayed failure.
CROP_BIAS=0.50
W=1080        # renders at ~542 CSS px on desktop, so this is 2x density
H=1440
# ⚠️ STALE: --brand-secondary moved to #e79e33, and the hero is no longer a video at all
# (it is an alpha cut-out — see scripts/hero-cutout.mjs and CLAUDE.md «Photos»). This
# script is kept for its measurements, not for its output: fix this constant before ever
# running it again, or check-gold will fail on a difference that is real.
GOLD=0xEDAB39 # == --brand-secondary (was; see the note above)

rm -rf "$OUT"
mkdir -p "$OUT"

CROP="crop=ih*${CROP_RATIO}:ih:(iw-ih*${CROP_RATIO})*${CROP_BIAS}:0"

# Output size is computed HERE, in the shell, not left to an expression inside the filter
# graph. It has to be a known number because the compositing branches lay the subject over
# a `color` plate that must be exactly the same size: when the scale was the in-graph
# `min(W,iw)` and the plate was a fixed WxH, an 810-wide foreground landed top-left on a
# 1080-wide plate and the result carried 270px of dead gold down the right side.
# W is a CEILING, not a target — a 1080p source crops to 810 and stays there, because
# upscaling it would add bytes and not one pixel of detail.
geometry () {
  local src=$1 h
  h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$src")
  OUT_W=$(awk -v h="$h" -v r="$CROP_RATIO" -v cap="$W" 'BEGIN{w=int(h*r); if(w>cap)w=cap; printf "%d", int(w/2)*2}')
  OUT_H=$(awk -v w="$OUT_W" -v r="$CROP_RATIO" 'BEGIN{printf "%d", int(w/r/2)*2}')
  VF="${CROP},scale=${OUT_W}:${OUT_H},setsar=1"
  PLATE="color=c=${GOLD}:s=${OUT_W}x${OUT_H}:r=25"
}
# Default geometry from the original; each branch re-derives it from its own source.
geometry "$SRC"
# The difference route needs BOTH inputs at identical dimensions (blend refuses otherwise),
# and its two sources are different resolutions by definition — so there the scale is
# pinned to the geometry of the ORIGINAL rather than derived per input. Safe: that route's
# image comes from the 4K original, so this is a downscale for it, never an upscale.
VF_FIXED="${CROP},scale=${OUT_W}:${OUT_H},setsar=1"

# Warn once if a source is not 16:9 — the crop stays valid but the framing would need
# re-aiming, and that is a decision, not something to do silently.
check_aspect () {
  local f=$1 dims ratio
  dims=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$f")
  ratio=$(awk -F, '{printf "%.4f", $1/$2}' <<< "$dims")
  awk -v r="$ratio" 'BEGIN{exit !(r>1.76 && r<1.79)}' || \
    echo "  ATTENZIONE: $f e $dims (rapporto $ratio), non 16:9 — ritara CROP_BIAS"
}

# Pick the source, best route first. The plate-as-input-0 structure is shared by every
# compositing branch, so the crop reads [1:v] there and `shortest=1` stops the endless
# colour source with the clip.
MATTE_DIR=""
if [ -d "$ALPHA_SEQ" ]; then
  echo "matte: $ALPHA_SEQ (sequenza PNG) -> composito su $GOLD"
  INPUTS=(-f lavfi -i "$PLATE" -framerate 25 -i "$ALPHA_SEQ/%04d.png")
  GRAPH="[1:v]${VF}[fg];[0:v][fg]overlay=shortest=1,format=yuv420p[v]"
elif [ -f "$ALPHA_MOV" ]; then
  echo "matte: $ALPHA_MOV -> composito su $GOLD"
  geometry "$ALPHA_MOV"
  INPUTS=(-f lavfi -i "$PLATE" -i "$ALPHA_MOV")
  GRAPH="[1:v]${VF}[fg];[0:v][fg]overlay=shortest=1,format=yuv420p[v]"
elif GREEN_SRC=$(ls FOTO_ORIGINALI/V1-green.* 2>/dev/null | head -1) && [ -n "$GREEN_SRC" ]; then
  # Preferred route: a real green screen keys cleanly and the gold behind it is OURS, so
  # the result matches the CSS band exactly instead of carrying the tool's own gold.
  #
  # The key colour is MEASURED off the file, not assumed: the export that came back is
  # #259029, a dark green with a gradient (#197119..#29892c), nowhere near the nominal
  # #00FF00 — keying pure green against it does nothing.
  #
  # The two tolerances are tight ON PURPOSE, and this is the part that surprises:
  # `blend` is edge SOFTNESS, and a generous one does not soften the edge here, it makes
  # HER semi-transparent — at 0.10 she visibly washes out into the gold, and by
  # similarity 0.18 the subject is gone entirely (0.01% of the frame left). Measured
  # sweep: 0.07/0.005 is the only pair that removes every green pixel while leaving her
  # fully opaque. Widen them and you fade the subject, not the fringe.
  echo "green screen: $GREEN_SRC -> key + despill -> composito su $GOLD"
  check_aspect "$GREEN_SRC"
  geometry "$GREEN_SRC"
  GREEN_PROBE=$(mktemp --suffix=.png)
  ffmpeg -y -v error -i "$GREEN_SRC" -vf "${CROP},select=eq(n\,0)" -frames:v 1 "$GREEN_PROBE"
  KEY=$(node scripts/probe-bg.mjs "$GREEN_PROBE")
  rm -f "$GREEN_PROBE"
  echo "  colore chiave misurato dal file: $KEY"
  INPUTS=(-f lavfi -i "$PLATE" -i "$GREEN_SRC")
  GRAPH="[1:v]${VF},chromakey=${KEY}:0.07:0.005,despill=type=green[fg];[0:v][fg]overlay=shortest=1,format=yuv420p[v]"
  CHECK_GOLD=1
elif REPAINT_SRC=$(ls FOTO_ORIGINALI/V1-gold.* 2>/dev/null | head -1) && [ -n "$REPAINT_SRC" ] && [ -z "${HERO_MATTE:-}" ]; then
  # DEFAULT for a repainted source: use it straight. No key, no matte, no compositing —
  # crop, scale, encode, exactly like the original-source branch with a different file.
  # It keeps whatever background the tool painted, so the gold will not match the CSS band
  # (measured 55-69 levels off) and the video reads as a darker rectangle on it.
  # check-gold prints that number every run; it is expected here, not a fault.
  # To composite onto the exact brand gold instead: HERO_MATTE=1 bash scripts/hero-video.sh
  echo "sorgente ripitturata, uso secco: $REPAINT_SRC"
  check_aspect "$REPAINT_SRC"
  geometry "$REPAINT_SRC"
  INPUTS=(-i "$REPAINT_SRC")
  GRAPH="[0:v]${VF},format=yuv420p[v]"
  CHECK_GOLD=1
elif REPAINT_SRC=$(ls FOTO_ORIGINALI/V1-gold.* 2>/dev/null | head -1) && [ -n "$REPAINT_SRC" ]; then
  # HERO_MATTE=1 — opt-in. The repainted file donates only a MATTE (see the header); the
  # image comes from $SRC at full resolution and the gold is ours, exact.
  echo "matte per differenza (HERO_MATTE=1): $SRC  vs  $REPAINT_SRC"
  check_aspect "$SRC"; check_aspect "$REPAINT_SRC"
  MATTE_DIR=$(mktemp -d)
  ffmpeg -y -v error -i "$SRC" -i "$REPAINT_SRC" \
    -filter_complex "\
      [0:v]${VF_FIXED},gblur=sigma=5,format=gbrp[a]; \
      [1:v]${VF_FIXED},gblur=sigma=5,format=gbrp[b]; \
      [a][b]blend=all_mode=difference,format=gray,lut=y='if(gt(val,18),0,255)'[m]" \
    -map "[m]" "$MATTE_DIR/%04d.png"
  node scripts/fill-matte.mjs "$MATTE_DIR"
  INPUTS=(-f lavfi -i "$PLATE" -i "$SRC" -framerate 25 -i "$MATTE_DIR/%04d.png")
  GRAPH="[1:v]${VF_FIXED}[hi];[2:v]format=gray,gblur=sigma=1.2[m];[hi][m]alphamerge[fg];[0:v][fg]overlay=shortest=1,format=yuv420p[v]"
  CHECK_GOLD=1
else
  echo "nessun matte trovato: uso $SRC con lo sfondo originale"
  INPUTS=(-i "$SRC")
  GRAPH="[0:v]${VF},format=yuv420p[v]"
fi

encode () { # encode <outfile> <codec args...>
  local out=$1; shift
  ffmpeg -y -v error "${INPUTS[@]}" -an -filter_complex "$GRAPH" -map "[v]" "$@" "$out"
}

encode "$OUT/alessia.webm" -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1
encode "$OUT/alessia.mp4"  -c:v libx264 -crf 23 -preset slow -movflags +faststart

# Poster: the first frame of whatever we just built, so it matches the video exactly
# (including the baked background). Covers the gap before the video has decoded anything,
# so the gold slab is never briefly empty on a cold load.
ffmpeg -y -v error -i "$OUT/alessia.mp4" -frames:v 1 \
  -c:v libwebp -quality 85 "$OUT/poster.webp"

# When the background is meant to BE the slab, verify it actually is. A 3-level drift is
# invisible on its own but shows as a rectangle once it sits next to the identical CSS
# colour — not something to judge by eye on an uncalibrated screen.
if [ "${CHECK_GOLD:-0}" = 1 ]; then
  ffmpeg -y -v error -i "$OUT/alessia.mp4" -frames:v 1 -pix_fmt rgb24 "$OUT/.check.png"
  node scripts/check-gold.mjs "$OUT/.check.png" "$GOLD_TOLERANCE" || true
  rm -f "$OUT/.check.png"
fi

[ -n "$MATTE_DIR" ] && rm -rf "$MATTE_DIR"

echo "hero assets -> $OUT"
for f in "$OUT"/*; do printf "  %-16s %6d KB\n" "$(basename "$f")" "$(( $(stat -c%s "$f") / 1024 ))"; done
