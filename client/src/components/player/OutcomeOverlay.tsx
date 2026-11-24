/**
 * xe2 – Outcome overlay animations
 * ADVANCE       → rise (green, rocket up)
 * ENTER_ROOM    → drop (red, fall down)
 * NEXT_ROOM     → drop (darker red, deeper fall)
 * RETURN_TO_MAIN → climb back (amber, bounce up)
 * RESET         → collapse (full crimson flash, shake)
 * FINISH        → celebration (gold confetti)
 */

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import type { Transition } from '../../types/game';
import type { LevelTheme } from '../../theme/levelThemes';
import { confettiBurst } from '../../animations/motionPresets';

interface OutcomeOverlayProps {
  transition: Transition;
  theme: LevelTheme;
}

const CONFIG: Record<Transition, {
  emoji: string;
  label: string;
  sublabel: string;
  bg: string;
  border: string;
  glow: string;
  motionVariants: object;
}> = {
  ADVANCE: {
    emoji: '🚀',
    label: 'LEVEL CLEARED',
    sublabel: 'Ascending to the next level',
    bg: '#052e16',
    border: '#16a34a',
    glow: 'rgba(22,163,74,0.5)',
    motionVariants: { initial: { y: 60, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -80, opacity: 0 } },
  },
  ENTER_ROOM: {
    emoji: '⬇️',
    label: 'WRONG ANSWER',
    sublabel: 'Entering Recovery Room 1',
    bg: '#450a0a',
    border: '#dc2626',
    glow: 'rgba(220,38,38,0.5)',
    motionVariants: { initial: { y: -40, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 60, opacity: 0 } },
  },
  NEXT_ROOM: {
    emoji: '⬇️⬇️',
    label: 'WRONG AGAIN',
    sublabel: 'Going deeper into the rooms',
    bg: '#3f0607',
    border: '#b91c1c',
    glow: 'rgba(185,28,28,0.6)',
    motionVariants: { initial: { y: -40, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 60, opacity: 0 } },
  },
  RETURN_TO_MAIN: {
    emoji: '⬆️',
    label: 'CORRECT!',
    sublabel: 'Climbing back to Main Question',
    bg: '#422006',
    border: '#d97706',
    glow: 'rgba(217,119,6,0.5)',
    motionVariants: { initial: { y: 40, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -60, opacity: 0 } },
  },
  RESET: {
    emoji: '💀',
    label: 'RESET',
    sublabel: 'Back to Level 0 — The Eclipse watches',
    bg: '#1c0505',
    border: '#7f1d1d',
    glow: 'rgba(127,29,29,0.8)',
    motionVariants: { initial: { scale: 1.3, opacity: 0 }, animate: { scale: 1, opacity: 1, x: [0, -8, 8, -6, 6, 0] }, exit: { scale: 0.8, opacity: 0 } },
  },
  FINISH: {
    emoji: '🏆',
    label: 'ASCENSION COMPLETE',
    sublabel: 'You have conquered all 60 levels!',
    bg: '#1c1708',
    border: '#ca8a04',
    glow: 'rgba(202,138,4,0.7)',
    motionVariants: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.2, opacity: 0 } },
  },
};

export default function OutcomeOverlay({ transition, theme }: OutcomeOverlayProps) {
  const cfg = CONFIG[transition];

  useEffect(() => {
    if (transition === 'FINISH' || transition === 'ADVANCE') {
      confettiBurst({
        colors: [theme.accent, theme.timerColor, '#ffffff'],
        count: transition === 'FINISH' ? 160 : 60,
      });
    }
  }, [transition, theme]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: `${cfg.bg}ee`, backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative flex flex-col items-center text-center rounded-3xl border p-8 w-full max-w-xs shadow-2xl"
        style={{
          background: cfg.bg,
          borderColor: cfg.border,
          boxShadow: `0 0 50px ${cfg.glow}`,
        }}
        {...cfg.motionVariants}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {/* Glow halo */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{ boxShadow: `inset 0 0 40px ${cfg.glow}` }}
        />

        <div className="text-5xl mb-4">{cfg.emoji}</div>
        <h2
          className="font-cinzel text-2xl font-extrabold tracking-[0.2em] uppercase mb-2"
          style={{ color: cfg.border, textShadow: `0 0 20px ${cfg.glow}` }}
        >
          {cfg.label}
        </h2>
        <p className="font-body text-sm text-gray-400 leading-relaxed">{cfg.sublabel}</p>

        {transition === 'RESET' && (
          <div className="mt-4 font-mono text-xs text-red-600 opacity-80 animate-pulse">
            resets += 1
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
