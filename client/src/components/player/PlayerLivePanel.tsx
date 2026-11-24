import { motion } from 'framer-motion';
import type { PlayerState } from '../../types/game';
import type { LevelTheme } from '../../theme/levelThemes';

interface PlayerLivePanelProps {
  players: PlayerState[];
  myId?: string | null;
  theme: LevelTheme;
  onClose: () => void;
}

function DepthPips({ room }: { room: number }) {
  if (room === 0) return <span className="font-cinzel text-[10px] text-gray-500">MAIN</span>;
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < room ? 'bg-red-500' : 'bg-gray-700'}`}
        />
      ))}
    </div>
  );
}

export default function PlayerLivePanel({ players, myId, theme, onClose }: PlayerLivePanelProps) {
  const sorted = [...players].sort((a, b) => b.level - a.level || a.room - b.room);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed right-0 top-0 h-full w-80 max-w-full flex flex-col border-l shadow-2xl z-40"
      style={{
        background: theme.bgSecondary,
        borderColor: theme.borderColor,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: theme.borderColor }}
      >
        <span className="font-cinzel text-xs font-bold tracking-wider uppercase" style={{ color: theme.accent }}>
          Live Ascendants ({sorted.length})
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-100 transition-colors p-1"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: theme.borderColor + '44' }}>
        {sorted.map((p, idx) => {
          const danger = p.room >= 4;
          const isMe = myId && p.id === myId;
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                background: danger
                  ? 'rgba(220,38,38,0.1)'
                  : isMe
                  ? 'rgba(234,179,8,0.08)'
                  : 'transparent',
              }}
            >
              <span className="font-mono text-[11px] text-gray-500 w-5">#{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {p.finished && <span className="text-amber-400 text-xs">🏆</span>}
                  <span className={`font-cinzel text-xs font-semibold truncate ${isMe ? 'text-amber-300' : 'text-gray-200'}`}>
                    {p.name} {isMe ? '(YOU)' : ''}
                  </span>
                  {danger && (
                    <span className="shrink-0 text-[9px] font-bold text-red-400 border border-red-700 rounded px-1">
                      DANGER
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[10px] text-gray-400">Lvl {p.level}</span>
                  <DepthPips room={p.room} />
                </div>
              </div>
              <div className="text-right shrink-0">
                {p.resets > 0 && (
                  <span className="font-mono text-[9px] text-gray-500">↺{p.resets}</span>
                )}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-24 text-gray-500 font-cinzel text-xs">
            No other players yet
          </div>
        )}
      </div>
    </motion.div>
  );
}
