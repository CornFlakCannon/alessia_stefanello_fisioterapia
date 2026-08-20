/**
 * The box every full-viewport panel is built on — shared by `page.tsx` (which stacks
 * it with `flex-col` as `shell`) and by `FocusPanel` (which lays its two halves out
 * on top of it). It lives here rather than in either of them so the vertical budget
 * can only be tuned in ONE place: a focus panel that quietly kept its own copy of
 * `py-24 short:py-12` would drift out of step with the rest of the page the first
 * time that number changes.
 *
 * Every panel must FIT inside 100svh: the engine pins the container's scrollTop to the
 * active panel's offsetTop every frame (`sectionScrollTop`, app/_scroll/sections.ts),
 * so anything past the fold is unreachable — and anything centred in an overflow-hidden
 * box is sheared at BOTH ends.
 *
 * ## Two axes trim it, and they must be COMPOSED, not left to race
 * `short:` (max-height 740px — iPhone SE, 1366x768 laptops) was the original valve, and it
 * is not enough on its own: the case that actually overflows is a modern phone, ~390x844,
 * which is NARROW but not short. Width is what forces headings and copy to wrap, and a
 * wrap is where a panel's budget goes. So the padding steps down on `max-lg:` too.
 *
 * All four values live on this one string, in this order, because Tailwind emits the
 * compound variant LAST and that is what makes the matrix resolve correctly:
 *   desktop            `py-24`
 *   short desktop      `short:py-12`
 *   phone / tablet     `max-lg:py-8`
 *   short phone        `max-lg:short:py-5`
 * Adding a fifth here is fine; adding one of them next to the others in a panel's own
 * class list is how you get two variants racing for the same property.
 */
export const PANEL_BOX =
  "relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-6 py-24 short:py-12 max-lg:py-8 max-lg:short:py-5 sm:px-10";
