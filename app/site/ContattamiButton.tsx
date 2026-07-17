import { appointmentMailto } from "./contact";

/**
 * The primary "Contattami" call-to-action.
 *
 * INTERIM BEHAVIOUR: the scroll engine has no scroll-to-section yet (see
 * JUMP_TO_FEATURE.md). Until that ships, this opens a prefilled appointment email —
 * a real contact action that works everywhere and needs no JS. Once the jump lands,
 * make this a client button whose onClick calls `useScrollNav().jumpTo(SECTION.CONTATTI)`
 * to smooth-scroll to the in-page form instead. It's the single place to switch.
 */
export default function ContattamiButton({
  className = "",
  children = "Contattami",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={appointmentMailto({})}
      className={
        "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 " +
        "font-sans text-sm font-semibold tracking-wide transition-transform " +
        "hover:-translate-y-0.5 active:translate-y-0 " +
        className
      }
    >
      {children}
      <span aria-hidden="true">→</span>
    </a>
  );
}
