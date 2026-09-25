/* Shared timing for the pixel theme transition. Imported by ThemeProvider
   (when it applies the <html> class flip) and ThemeTransitionOverlay (the
   stagger budgets), so the curtain is always fully covering before the flip. */

export const IN_SPREAD_MS = 460 // pop-in stagger budget (random order)
export const HOLD_MS = 80 // beat spent fully covered (margin so a slow
// first paint of the blocks can never let the class flip beat coverage)
export const FLIP_DELAY_MS = IN_SPREAD_MS + HOLD_MS // class flips here
export const OUT_SPREAD_MS = 460 // pop-out stagger budget

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
