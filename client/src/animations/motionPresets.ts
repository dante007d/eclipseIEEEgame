/**
 * Motion preset library (no confetti/celebration bursts)
 */

import type { Variants, Transition } from 'framer-motion';

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const spring: Transition = { type: 'spring', stiffness: 500, damping: 25 };
const snappy: Transition = { type: 'spring', stiffness: 700, damping: 30 };
const ease: Transition = { type: 'tween', ease: 'easeInOut', duration: 0.3 };

export const pageTransition: Variants = {
  initial: (reduced: boolean) =>
    reduced ? { opacity: 0 } : { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: (reduced: boolean) =>
    reduced ? { opacity: 0 } : { opacity: 0, y: -20 },
};

export const pageTransitionProps = {
  variants: pageTransition,
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
  transition: { ...ease, duration: 0.3 },
};

export const squishDrop: Variants = {
  initial: { opacity: 0, y: -40 },
  animate: { opacity: 1, y: 0 },
  rest: { y: 0 },
};

export const squishDropTransition: Transition = {
  ...spring,
  stiffness: 400,
  damping: 20,
};

export const shake: Variants = {
  initial: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.4, times: [0, 0.14, 0.29, 0.43, 0.57, 0.71, 0.86, 1] },
  },
};

export const jellyHover = { scale: 1.02 };
export const jellyTap = { scale: 0.985 };
export const jellyTransition: Transition = snappy;

export const slotFlip: Variants = {
  initial: { rotateX: 90, opacity: 0 },
  animate: { rotateX: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { rotateX: -90, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const glitchlessBoom: Variants = {
  idle: { scale: 1, opacity: 1 },
  boom: {
    scale: [1, 1.12, 0.95, 1],
    opacity: [1, 1, 0.75, 1],
    transition: { duration: 0.45, times: [0, 0.3, 0.7, 1] },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: spring },
};
