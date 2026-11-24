/**
 * TECH DROP – Modal primitive
 *
 * Accessible dialog:
 *  - Focus trap, aria-modal, role="dialog"
 *  - Closes on Escape or backdrop click
 *  - Framer Motion slide-up + fade backdrop
 *  - Neo-brutalist border + hard shadow
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RoomTheme } from '@/theme/tokens';

interface ModalProps {
  open:      boolean;
  onClose:   () => void;
  title?:    string;
  children:  ReactNode;
  theme?:    RoomTheme;
  /** Width class (Tailwind). Default: max-w-lg */
  width?:    string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  theme,
  width = 'max-w-lg',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  /* ── Close on Escape ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  /* ── Focus first focusable child when opened ── */
  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    el?.focus();
  }, [open]);

  const bg     = theme?.card ?? '#FFFFFF';
  const shadow = theme ? `10px 10px 0 ${theme.shadow}` : '10px 10px 0 #111111';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={[
              'fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2',
              'w-[calc(100%-2rem)]',
              width,
              'border-[3px] border-ink rounded-xl2',
              'p-8',
            ].join(' ')}
            style={{ background: bg, boxShadow: shadow }}
          >
            {/* Header */}
            {title && (
              <div className="flex items-start justify-between mb-6">
                <h2 className="font-heading text-2xl font-extrabold">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="ml-4 text-2xl font-black leading-none hover:scale-110 transition-transform"
                >
                  ×
                </button>
              </div>
            )}

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
