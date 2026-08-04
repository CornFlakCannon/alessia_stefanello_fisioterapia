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
 * box is sheared at BOTH ends. Hence `short:` (see globals.css), which trims the fixed
 * vertical budget on screens that can't afford it (iPhone SE, 1366x768 laptops).
 */
export const PANEL_BOX =
  "relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-6 py-24 short:py-12 sm:px-10";
