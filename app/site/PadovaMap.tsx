'use client';

import SDiv from "@/app/widgets/SDiv";
import { easeOutCubic } from "@/app/_scroll/easing";

/**
 * Self-contained stylised map of Padova with an action-radius ring — no tiles, no
 * API, works offline. Place it INSIDE the domiciliare `<Section>`: the ring is an
 * `<SDiv>`, so it inherits that section's index and the dashed radius expands
 * outward once as the panel settles (a `scale`/`opacity` reveal, staggered past the
 * snap with `start`). A real map tile can replace the `<svg>` backdrop later.
 */
export default function PadovaMap({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-mist ring-1 ring-primary/10 ${className}`}
    >
      {/* Abstract street/river backdrop. */}
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <g stroke="var(--brand-primary)" strokeOpacity={0.12} strokeWidth={2}>
          <path d="M-10 90 C 90 70, 150 130, 240 110 S 380 80, 420 120" />
          <path d="M-10 200 C 80 190, 160 220, 250 200 S 360 180, 420 210" />
          <path d="M60 -10 C 80 90, 40 180, 90 310" />
          <path d="M300 -10 C 280 90, 330 190, 300 310" />
          <path d="M180 -10 L 210 310" />
        </g>
        {/* the river, a touch bolder */}
        <path
          d="M-10 40 C 120 120, 160 150, 200 160 S 320 220, 420 300"
          stroke="var(--brand-primary)"
          strokeOpacity={0.22}
          strokeWidth={6}
          strokeLinecap="round"
        />
      </svg>

      {/* Radius ring + centre pin, centred over the map. */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* soft filled catchment */}
        <SDiv
          start={560}
          budget={420}
          anim={[
            { at: 0, scale: 0.3, opacity: 0 },
            { at: 1, scale: 1, opacity: 1, ease: easeOutCubic },
          ]}
          className="absolute aspect-square w-[64%] rounded-full bg-primary/8"
        />
        {/* dashed action radius */}
        <SDiv
          start={620}
          budget={420}
          anim={[
            { at: 0, scale: 0.3, opacity: 0 },
            { at: 1, scale: 1, opacity: 1, ease: easeOutCubic },
          ]}
          className="absolute aspect-square w-[64%] rounded-full border-2 border-dashed border-secondary"
        />
        {/* Padova centre */}
        <div className="relative flex flex-col items-center gap-1">
          <span className="block h-3 w-3 rounded-full bg-emphasis ring-4 ring-emphasis/20" />
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink/70">
            Padova
          </span>
        </div>
      </div>
    </div>
  );
}
