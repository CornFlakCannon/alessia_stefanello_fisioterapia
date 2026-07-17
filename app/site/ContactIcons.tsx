/** Shared line icons for the contact data (phone / email / address). Stroked with
 *  `currentColor`, so they inherit the surrounding text colour — used by both the
 *  top-left ContactBar and the footer contact table. `className` defaults to the
 *  ContactBar's size; the footer table passes a larger one. */
type IconProps = { className?: string };

export function PhoneIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3.6A1.6 1.6 0 0 1 3.6 2h1.5a1 1 0 0 1 1 .8l.6 2.6a1 1 0 0 1-.3.95L5.3 7.4a10.5 10.5 0 0 0 3.3 3.3l1.05-1.1a1 1 0 0 1 .95-.28l2.6.6a1 1 0 0 1 .8 1v1.5A1.6 1.6 0 0 1 12.4 14 12 12 0 0 1 2 3.6Z" />
    </svg>
  );
}

export function MailIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="m2.5 4.5 5.5 4.5 5.5-4.5" />
    </svg>
  );
}

export function PinIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 14s5-4.4 5-8A5 5 0 0 0 3 6c0 3.6 5 8 5 8Z" />
      <circle cx="8" cy="6" r="1.7" />
    </svg>
  );
}
