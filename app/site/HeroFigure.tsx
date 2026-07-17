/**
 * Hand-authored single-line body figure — an approximation of the biglietto da
 * visita line-art (not a pixel match; drop the real asset in /public and swap this
 * out when it's ready). Each stroke is a <path pathLength="1"> so the CSS draw-in
 * (`.fisio-draw`, see globals.css) sweeps it on on load; `animationDelay` staggers
 * the strokes so the body draws head → spine → arms → legs.
 */
export default function HeroFigure({
  className = "",
  stroke = "var(--brand-primary)",
}: {
  className?: string;
  stroke?: string;
}) {
  const d = (delay: number) => ({ style: { animationDelay: `${delay}s` } });
  return (
    <svg
      viewBox="0 0 200 320"
      fill="none"
      stroke={stroke}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`fisio-draw ${className}`}
      aria-hidden="true"
    >
      {/* head */}
      <path pathLength={1} {...d(0)} d="M100 26a20 20 0 1 0 0.1 0" />
      {/* neck + spine, gently curved */}
      <path pathLength={1} {...d(0.25)} d="M100 66 C 97 96, 94 128, 100 168" />
      {/* raised arm (like the card) — shoulder up to hand */}
      <path pathLength={1} {...d(0.5)} d="M99 84 C 82 78, 66 66, 58 44" />
      {/* other arm, relaxed along the body */}
      <path pathLength={1} {...d(0.65)} d="M100 90 C 116 104, 126 124, 123 150" />
      {/* pelvis line */}
      <path pathLength={1} {...d(0.8)} d="M86 168 C 94 172, 106 172, 116 166" />
      {/* left leg */}
      <path pathLength={1} {...d(0.95)} d="M97 168 C 90 210, 86 250, 84 292" />
      {/* right leg */}
      <path pathLength={1} {...d(1.1)} d="M104 168 C 110 210, 114 250, 118 292" />
    </svg>
  );
}
