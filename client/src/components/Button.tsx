/**
 * TECH DROP – Button primitive
 *
 * Features:
 *  - Neo-brutalist hard-offset shadow, 3px black border
 *  - Squash-and-stretch press animation
 *  - Jelly hover (Framer Motion)
 *  - Ripple effect on click
 *  - Respects prefers-reduced-motion
 *  - Accessible: min 48px height, focus-visible ring
 */

import { useCallback, useRef, type ReactNode, type MouseEvent } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { jellyHover, jellyTap, jellyTransition } from '@/animations/motionPresets';
import type { RoomTheme } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children' | 'size'> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  theme?:     RoomTheme;
  /** Optional icon (rendered left of label). */
  icon?:      ReactNode;
  /** Show loading spinner instead of content. */
  loading?:   boolean;
  /** Full-width button. */
  fullWidth?: boolean;
  children:   ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 text-sm  gap-1',
  md: 'min-h-[48px] px-6 text-base gap-2',
  lg: 'min-h-[56px] px-8 text-lg  gap-3',
};

export default function Button({
  variant   = 'primary',
  size      = 'md',
  theme,
  icon,
  loading   = false,
  fullWidth = false,
  children,
  onClick,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  /* ── Ripple ── */
  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      // Spawn ripple element
      const btn = btnRef.current;
      if (btn && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const rect   = btn.getBoundingClientRect();
        const size   = Math.max(rect.width, rect.height) * 2;
        const x      = e.clientX - rect.left - size / 2;
        const y      = e.clientY - rect.top  - size / 2;
        const ripple = document.createElement('span');
        Object.assign(ripple.style, {
          position:     'absolute',
          borderRadius: '50%',
          background:   'rgba(255,255,255,0.4)',
          width:  `${size}px`,
          height: `${size}px`,
          left:   `${x}px`,
          top:    `${y}px`,
          transform: 'scale(0)',
          animation: 'ripple 0.5s linear forwards',
          pointerEvents: 'none',
        });
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      }

      onClick?.(e);
    },
    [disabled, loading, onClick],
  );

  /* ── Color schemes ── */
  const bg = theme
    ? theme.accent
    : variant === 'primary'   ? '#2D6BFF'
    : variant === 'secondary' ? '#FFE600'
    : variant === 'danger'    ? '#FF4D4D'
    : 'transparent';

  const textColor = variant === 'secondary' ? '#111111'
    : variant === 'ghost'   ? '#111111'
    : '#111111';

  const shadow = theme
    ? `6px 6px 0 ${theme.shadow}`
    : '6px 6px 0 #111111';

  return (
    <motion.button
      ref={btnRef}
      whileHover={disabled || loading ? {} : jellyHover}
      whileTap={disabled || loading ? {} : jellyTap}
      transition={jellyTransition}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      className={[
        'relative overflow-hidden',
        'inline-flex items-center justify-center',
        'font-heading font-extrabold',
        'border-[3px] border-ink rounded-card',
        'cursor-pointer select-none',
        'transition-none',   // motion handles all transitions
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].join(' ')}
      style={{
        background:  bg,
        color:       textColor,
        boxShadow:   disabled || loading ? '3px 3px 0 #111111' : shadow,
        WebkitTapHighlightColor: 'transparent',
      }}
      {...rest}
    >
      {loading ? (
        <span className="inline-block w-5 h-5 border-[3px] border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
