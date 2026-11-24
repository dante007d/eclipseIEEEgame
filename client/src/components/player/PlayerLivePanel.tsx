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
  if (room === 0) return <span className="font-mono text-[10px] text-gray-500">MAIN</span>;
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 border ${i < room ? 'bg-[#ff0033] border-white' : 'bg-[#050305] border-gray-700'}`}
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
      transition={{ duration: 0.22 }}
      className="fixed right-0 top-0 h-full w-80 max-w-full flex flex-col border-l bg-[#070407] z-50"
      style={{ borderColor: theme.borderColor }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b bg-[#050305]"
        style={{ borderColor: theme.borderColor }}
      >
        <span className="font-mono text-xs font-bold tracking-wider uppercase" style={{ color: theme.accent }}>
          [LIVE ASCENDANTS: {sorted.length}]
        </span>
        <button
          onClick={onClose}
          className="font-mono text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-0.5"
          aria-label="Close panel"
        >
          [X]
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#c69c5d]/15">
        {sorted.map((p, idx) => {
          const danger = p.room >= 4;
          const isMe = myId && p.id === myId;
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                background: danger
                  ? '#1a0408'
                  : isMe
                  ? '#161108'
                  : 'transparent',
              }}
            >
              <span className="font-mono text-[11px] text-gray-500 w-6 tabular-nums">#{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {p.finished && <span className="font-mono text-[10px] text-[#e6c48a] border border-[#c69c5d] px-1">WIN</span>}
                  <span className={`font-mono text-xs font-bold truncate ${isMe ? 'text-[#e6c48a]' : 'text-gray-200'}`}>
                    {p.name} {isMe ? '(YOU)' : ''}
                  </span>
                  {danger && (
                    <span className="shrink-0 text-[9px] font-bold text-[#ff0033] border border-[#ff0033] px-1">
                      R4
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 tabular-nums">
                  <span className="font-mono text-[10px] text-gray-400">LV {p.level}</span>
                  <DepthPips room={p.room} />
                </div>
              </div>
              <div className="text-right shrink-0">
                {p.resets > 0 && (
                  <span className="font-mono text-[10px] text-[#ff0033] tabular-nums">R:{p.resets}</span>
                )}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-24 text-gray-500 font-mono text-xs uppercase">
            NO OTHER PLAYERS YET
          </div>
        )}
      </div>
    </motion.div>
  );
}
