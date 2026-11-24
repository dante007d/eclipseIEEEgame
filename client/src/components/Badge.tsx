/**
 * TECH DROP – Badge primitive
 *
 * Pill / sticker badge for room labels, scores, difficulty.
 */

import type { ReactNode } from 'react';
import type { RoomTheme } from '@/theme/tokens';

type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children:  ReactNode;
  theme?:    RoomTheme;
  /** Override background color. */
  color?:    string;
  size?:     BadgeSize;
  className?: string;
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs  px-2  py-0.5',
  md: 'text-sm  px-3  py-1',
  lg: 'text-base px-4 py-1.5',
};

export default function Badge({
  children,
  theme,
  color,
  size     = 'md',
  className = '',
}: BadgeProps) {
  const bg = color ?? theme?.accent ?? '#FFE600';

  return (
    <span
      className={[
        'inline-flex items-center justify-center',
        'font-heading font-extrabold',
        'border-2 border-ink rounded-full',
        'shadow-[3px_3px_0_#111111]',
        sizeClasses[size],
        className,
      ].join(' ')}
      style={{ background: bg, color: '#111111' }}
    >
      {children}
    </span>
  );
}
