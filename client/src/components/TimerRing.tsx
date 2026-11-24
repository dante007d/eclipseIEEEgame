/**
 * TECH DROP – TimerRing
 *
 * Circular SVG countdown ring.
 * - Colour shifts: green → yellow → red as time runs out
 * - Pulses when < 10 s (respects reduced-motion)
 * - Displays remaining seconds in JetBrains Mono
 */

import { useMemo } from 'react';

interface TimerRingProps {
  /** Current seconds remaining. */
  seconds:  number;
  /** Total seconds (determines ring fill). */
  total:    number;
  /** Ring diameter in px. */
  size?:    number;
  className?: string;
}

export default function TimerRing({
  seconds,
  total,
  size     = 80,
  className = '',
}: TimerRingProps) {
  const radius      = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction    = total > 0 ? Math.max(0, seconds / total) : 0;
  const offset      = circumference * (1 - fraction);

  /* Color: green → yellow → red */
  const ringColor = useMemo(() => {
    if (fraction > 0.5) return '#00F5A0';   // success mint
    if (fraction > 0.25) return '#FFC400';  // warning amber
    return '#FF4D4D';                        // error coral
  }, [fraction]);

  const isLow = seconds < 10 && seconds > 0;

  return (
    <div
      className={['timer-ring inline-flex items-center justify-center', className].join(' ')}
      style={{ width: size, height: size }}
      aria-label={`${seconds} seconds remaining`}
      role="timer"
    >
      <svg
        width={size}
        height={size}
        className={isLow ? 'animate-pulse' : ''}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#DDDDDD"
          strokeWidth={8}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
        />
      </svg>

      {/* Seconds display */}
      <span
        className="absolute font-mono font-bold text-ink"
        style={{
          fontSize: size < 60 ? '0.75rem' : '1rem',
          color: isLow ? ringColor : '#111111',
        }}
      >
        {seconds}
      </span>
    </div>
  );
}
