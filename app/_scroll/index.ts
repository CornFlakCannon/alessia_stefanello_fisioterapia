// Public API for the scroll-driven animation subsystem.
// Widgets import from here: `import { useScrollFrame } from "@/app/_scroll";`
export { createScrollStore } from './store';
export type { ScrollState, ScrollStore, FrameListener } from './store';
export { ScrollStateProvider, useScrollStore, useSection } from './context';
export type { SectionCtx } from './context';
export { useScrollFrame } from './useScrollFrame';
export { useSequenceProgress, integrateIndexPos } from './useSequenceProgress';
export type { SequenceSpec, LoopSpec } from './useSequenceProgress';
export { Section, advanceSection, sectionScrollTop } from './sections';
export { smoothLerp, noSmoothing, defaultSmoother } from './smoothing';
export type { Smoother } from './smoothing';
export * from './easing';
