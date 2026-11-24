/**
 * TECH DROP – Animated confetti-dot background layer
 *
 * Fixed, z-indexed behind everything.
 * Animation is a slow drift so dots feel alive without being distracting.
 * Stopped immediately via CSS when prefers-reduced-motion is set.
 */

export default function ConfettiBg() {
  return <div className="confetti-bg" aria-hidden="true" />;
}
