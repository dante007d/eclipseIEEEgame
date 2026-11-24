/**
 * TECH DROP – Card (sticker) primitive
 *
 * Neo-brutalist card with:
 *  - 3px black outline
 *  - Hard offset shadow (theme-aware)
 *  - Optional sticker badge (top-right)
 *  - Optional hover lift (Framer Motion)
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { RoomTheme } from '@/theme/tokens';

interface CardProps {
  children:   ReactNode;
  theme?:     RoomTheme;
  /** Sticker text shown at top-right corner. */
  sticker?:   string;
  /** Hover lift animation. */
  hoverable?: boolean;
  className?: string;
  onClick?:   () => void;
}

export default function Card({
  children,
  theme,
  sticker,
  hoverable = false,
  className = '',
  onClick,
}: CardProps) {
  const bg     = theme?.card ?? '#FFFFFF';
  const shadow = theme?.shadow
    ? `6px 6px 0 ${theme.shadow}`
    : '6px 6px 0 #111111';

  const motionProps = hoverable
    ? {
        whileHover: { y: -4, boxShadow: `10px 10px 0 ${theme?.shadow ?? '#111111'}` },
        transition: { type: 'spring' as const, stiffness: 400, damping: 20 },
      }
    : {};

  return (
    <motion.div
      {...motionProps}
      onClick={onClick}
      className={[
        'relative',
        'border-[3px] border-ink rounded-card',
        'p-6',
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
      style={{ background: bg, boxShadow: shadow }}
    >
      {/* Sticker badge */}
      {sticker && (
        <span
          className={[
            'absolute -top-3 -right-3',
            'sticker',
            'text-xs px-3 py-1',
          ].join(' ')}
          style={{
            background: theme?.accent ?? '#FFE600',
            color:      '#111111',
          }}
        >
          {sticker}
        </span>
      )}

      {children}
    </motion.div>
  );
}
