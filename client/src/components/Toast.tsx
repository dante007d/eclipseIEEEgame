/**
 * TECH DROP – Toast notification primitive
 *
 * Variants: success | error | warning | info
 * Slides in from the top-right, auto-dismisses after `duration` ms.
 * Stacks correctly when multiple toasts are queued.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STATUS_COLORS } from '@/theme/tokens';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id:       string;
  variant:  ToastVariant;
  message:  string;
  duration?: number;
}

interface ToastProps extends ToastData {
  onClose: (id: string) => void;
}

const ICONS: Record<ToastVariant, string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const COLORS: Record<ToastVariant, string> = {
  success: STATUS_COLORS.success,
  error:   STATUS_COLORS.error,
  warning: STATUS_COLORS.warning,
  info:    '#2D6BFF',
};

export function Toast({ id, variant, message, duration = 3500, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(t);
  }, [id, duration, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{    opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="flex items-center gap-3 min-w-[260px] max-w-[380px]"
      style={{
        background:  COLORS[variant],
        border:      '3px solid #111111',
        borderRadius: 16,
        boxShadow:   '5px 5px 0 #111111',
        padding:     '12px 16px',
        fontFamily:  'var(--font-heading)',
        fontWeight:   800,
        color:       '#111111',
      }}
      role="alert"
    >
      <span style={{ fontSize: '1.25rem' }}>{ICONS[variant]}</span>
      <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{message}</span>
      <button
        onClick={() => onClose(id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          fontWeight: 900,
          fontSize:   '1rem',
          lineHeight:  1,
          padding:    0,
        }}
      >
        ×
      </button>
    </motion.div>
  );
}

/** Container: renders a stack of toasts in a fixed corner. */
interface ToastContainerProps {
  toasts:  ToastData[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-[200] flex flex-col gap-3 items-end pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast {...t} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
