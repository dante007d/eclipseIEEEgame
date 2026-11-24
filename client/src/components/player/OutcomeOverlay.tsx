import { motion } from 'framer-motion';
import type { Transition } from '../../types/game';

interface OutcomeOverlayProps {
  transition: Transition;
  roast?: string;
  pointsGained?: number;
  newRoom?: number;
  newLevel?: number;
  onDismiss?: () => void;
}

const CONFIG: Record<Transition, {
  tag: string;
  label: string;
  sublabel: string;
  panelClass: string;
  accentColor: string;
}> = {
  ADVANCE: {
    tag: 'ASCEND',
    label: 'LEVEL CLEARED',
    sublabel: 'Ascending to the next chamber',
    panelClass: 'gothic-panel',
    accentColor: '#c69c5d',
  },
  ENTER_ROOM: {
    tag: 'DROP',
    label: 'WRONG ANSWER',
    sublabel: 'Entering Recovery Room 1',
    panelClass: 'gothic-panel-crimson',
    accentColor: '#ff0033',
  },
  NEXT_ROOM: {
    tag: 'DROP',
    label: 'WRONG AGAIN',
    sublabel: 'Descending deeper into recovery',
    panelClass: 'gothic-panel-crimson',
    accentColor: '#ff0033',
  },
  RETURN_TO_MAIN: {
    tag: 'RECOVERED',
    label: 'RECOVERED',
    sublabel: 'Returning to Main Chamber',
    panelClass: 'gothic-panel',
    accentColor: '#e6c48a',
  },
  RESET: {
    tag: 'PURGE',
    label: 'FULL RESET',
    sublabel: 'Room 4 failed — Back to Level 0',
    panelClass: 'gothic-panel-crimson',
    accentColor: '#ff0033',
  },
  FINISH: {
    tag: 'COMPLETE',
    label: 'ASCENSION COMPLETE',
    sublabel: 'All 60 levels conquered',
    panelClass: 'gothic-panel',
    accentColor: '#e6c48a',
  },
};

export default function OutcomeOverlay({
  transition,
  roast,
  pointsGained,
  newRoom,
  newLevel,
  onDismiss,
}: OutcomeOverlayProps) {
  const cfg = CONFIG[transition];

  const dynamicSublabel =
    transition === 'NEXT_ROOM' && newRoom
      ? `DESCENDING INTO RECOVERY ROOM ${newRoom} / 4`
      : transition === 'RETURN_TO_MAIN' && newLevel !== undefined
      ? `RETURNING TO MAIN QUESTION FOR LEVEL ${newLevel + 1}`
      : cfg.sublabel;

  return (
    <motion.div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 cursor-pointer bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`relative flex flex-col items-center text-center p-8 w-full max-w-sm ${cfg.panelClass}`}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -12, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="font-mono text-xs tracking-[0.25em] mb-3 px-2 py-0.5 border border-current" style={{ color: cfg.accentColor }}>
          [{cfg.tag}]
        </div>
        <h2
          className="font-display text-4xl tracking-[0.18em] uppercase mb-2"
          style={{ color: cfg.accentColor }}
        >
          {cfg.label}
        </h2>
        <p className="font-mono text-xs text-gray-300 leading-relaxed uppercase">{dynamicSublabel}</p>

        {pointsGained && pointsGained > 0 ? (
          <div className="mt-3 font-mono text-xs font-bold text-[#e6c48a]">
            +{pointsGained} PTS
          </div>
        ) : null}

        {roast && (
          <p className="mt-3 font-mono text-xs text-red-200 border-t border-[#ff0033]/40 pt-3 leading-snug">
            &ldquo;{roast}&rdquo;
          </p>
        )}

        {transition === 'RESET' && (
          <div className="mt-4 font-mono text-xs text-[#ff0033] uppercase">
            RESETS += 1 // PROGRESS ZEROED
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
