/**
 * TECH DROP – Motion preset library
 *
 * All presets respect prefers-reduced-motion:
 *   - If reduced, big animations swap for instant fade (opacity only).
 * Max duration: 1.5s. All animate only transform / opacity for 60 fps.
 */

import type { Variants, Transition } from 'framer-motion';

/** Returns true when the user prefers reduced motion. */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Shared transitions ───────────────────────────────────────────────────────

const spring: Transition = { type: 'spring', stiffness: 500, damping: 25 };
const snappy: Transition = { type: 'spring', stiffness: 700, damping: 30 };
const ease:   Transition = { type: 'tween', ease: 'easeInOut', duration: 0.3 };

// ─── Page / screen transitions ────────────────────────────────────────────────

/** Slide + fade page transition. Reduced → fade only. */
export const pageTransition: Variants = {
  initial: (reduced: boolean) =>
    reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit:    (reduced: boolean) =>
    reduced ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.97 },
};

export const pageTransitionProps = {
  variants: pageTransition,
  initial:  'initial',
  animate:  'animate',
  exit:     'exit',
  transition: { ...ease, duration: 0.35 },
};

// ─── Squish drop (card entering) ─────────────────────────────────────────────

/** Item drops from above and squishes on landing. */
export const squishDrop: Variants = {
  initial: { opacity: 0, y: -60, scaleX: 1,    scaleY: 1    },
  animate: { opacity: 1, y: 0,   scaleX: 1.08, scaleY: 0.92 },
  rest:    {              y: 0,   scaleX: 1,    scaleY: 1    },
};

export const squishDropTransition: Transition = {
  ...spring,
  stiffness: 400,
  damping: 20,
};

// ─── Shake (wrong answer) ─────────────────────────────────────────────────────

/** Horizontal shake to signal incorrect. */
export const shake: Variants = {
  initial: { x: 0 },
  shake: {
    x: [0, -10, 10, -8, 8, -5, 5, 0],
    transition: { duration: 0.5, times: [0, 0.14, 0.29, 0.43, 0.57, 0.71, 0.86, 1] },
  },
};

// ─── Rocket launch (level advance) ───────────────────────────────────────────

/** Element rockets upward and fades out. */
export const rocketLaunch: Variants = {
  idle:    { opacity: 1, y: 0,    rotate: 0 },
  launch:  { opacity: 0, y: -200, rotate: -10,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};

// ─── Jelly hover (button) ────────────────────────────────────────────────────

/** Subtle jelly squash on hover. Use with whileHover. */
export const jellyHover = { scale: 1.06, scaleX: 1.08, scaleY: 0.94 };
export const jellyTap   = { scale: 0.94, scaleX: 0.92, scaleY: 1.08 };
export const jellyTransition: Transition = snappy;

// ─── Confetti burst (canvas-confetti wrapper) ─────────────────────────────────

import confetti from 'canvas-confetti';

export interface ConfettiBurstOptions {
  origin?: { x: number; y: number };
  colors?: string[];
  count?:  number;
}

/** Fire a confetti burst from a given viewport position. Skipped when reduced. */
export function confettiBurst({
  origin = { x: 0.5, y: 0.5 },
  colors = ['#2D6BFF', '#FFE600', '#FF3D9A', '#7CFF3F', '#00E0FF'],
  count  = 80,
}: ConfettiBurstOptions = {}): void {
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: count,
    spread:        70,
    origin,
    colors,
    disableForReducedMotion: true,
  });
}

// ─── Slot flip (score digit update) ──────────────────────────────────────────

/** Variants for a score digit cycling through a slot machine flip. */
export const slotFlip: Variants = {
  initial: { rotateX: 90, opacity: 0 },
  animate: { rotateX: 0,  opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { rotateX: -90, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

// ─── Glitch-less boom (RESET / full reset) ────────────────────────────────────

/** Scale-and-flash for the full-reset moment. No glitch to avoid a11y issues. */
export const glitchlessBoom: Variants = {
  idle:   { scale: 1, opacity: 1 },
  boom:   {
    scale:   [1, 1.3, 0.8, 1],
    opacity: [1, 1,   0.6, 1],
    transition: { duration: 0.6, times: [0, 0.3, 0.7, 1] },
  },
};

// ─── Stagger children ─────────────────────────────────────────────────────────

/** Container that staggers its children on mount. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show:   {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

/** Child item for use inside staggerContainer. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: spring },
};
