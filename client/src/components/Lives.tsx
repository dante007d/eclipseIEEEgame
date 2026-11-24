/**
 * TECH DROP – Lives / Hearts primitive
 *
 * Displays up to `max` heart or star icons.
 * Lost lives are shown as empty outlines.
 * Scales with Framer Motion when a life is lost (squash).
 */

import { motion, AnimatePresence } from 'framer-motion';

type LivesIcon = 'heart' | 'star';

interface LivesProps {
  current: number;
  max:     number;
  icon?:   LivesIcon;
  size?:   number;
  color?:  string;
}

const ICONS: Record<LivesIcon, { filled: string; empty: string }> = {
  heart: { filled: '❤️', empty: '🤍' },
  star:  { filled: '⭐', empty: '☆' },
};

export default function Lives({
  current,
  max,
  icon  = 'heart',
  size  = 28,
  color = '#FF4D4D',
}: LivesProps) {
  const { filled, empty } = ICONS[icon];

  return (
    <div className="flex gap-1" role="img" aria-label={`${current} of ${max} lives remaining`}>
      <AnimatePresence>
        {Array.from({ length: max }, (_, i) => {
          const alive = i < current;
          return (
            <motion.span
              key={i}
              initial={{ scale: 1 }}
              animate={{ scale: alive ? 1 : 0.8, opacity: alive ? 1 : 0.4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{ fontSize: size, lineHeight: 1, color }}
            >
              {alive ? filled : empty}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
