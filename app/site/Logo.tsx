/**
 * Placeholder logo — a filled brand-blue circle (round, no words), as requested.
 * Swap this component's body for the real round logo (SVG) when it's ready; every
 * usage (hero, footer, contact bar) picks it up.
 */
export default function Logo({
  size = 44,
  className = "",
  color = "var(--brand-primary)",
}: {
  size?: number;
  className?: string;
  /** Fill — defaults to brand blue; pass e.g. "#fff" on dark grounds. */
  color?: string;
}) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: color }}
      role="img"
      aria-label={`${"Alessia Stefanello"} — logo`}
    />
  );
}
