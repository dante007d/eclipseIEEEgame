import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerState } from '../../types/game';
import { GAME_NAME, SOCKET_EVENTS } from '../../types/game';
import { getThemeForLevel } from '../../theme/levelThemes';
import { socket } from '../../lib/socket';

interface ProjectorViewProps {
  onBack?: () => void;
  globalTimeLeft?: number | null;
}

function PodiumCard({ player, rank }: { player: PlayerState; rank: number }) {
  const theme = getThemeForLevel(player.level);
  const heights = ['h-28', 'h-20', 'h-14'];
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.12, type: 'spring', stiffness: 300, damping: 24 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="text-3xl">{medals[rank]}</div>
      <div
        className="font-cinzel text-sm font-extrabold tracking-wider text-white text-center"
        style={{ textShadow: `0 0 15px ${theme.glow}` }}
      >
        {player.name}
      </div>
      <div className="font-mono text-xs text-gray-400">Lvl {player.level}</div>
      <div
        className={`${heights[rank]} w-24 sm:w-28 rounded-t-xl border-t-2 flex items-end justify-center pb-2`}
        style={{
          background: `linear-gradient(180deg, ${theme.accent}44, ${theme.accentSecondary}22)`,
          borderColor: theme.accent,
          boxShadow: `0 -4px 20px ${theme.glow}`,
        }}
      >
        <span className="font-mono text-xs font-bold" style={{ color: theme.accent }}>
          #{rank + 1}
        </span>
      </div>
    </motion.div>
  );
}

function fmtClock(s: number) {
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
}

export default function ProjectorView({ onBack, globalTimeLeft = null }: ProjectorViewProps) {
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [matchCode, setMatchCode] = useState('A7K3P9');
  const [groupFilter, setGroupFilter] = useState<'all' | 'junior' | 'senior'>('all');

  useEffect(() => {
    socket.emit('projector:join');
    const onPlayersUpdate = (data: { players: PlayerState[]; matchCode?: string }) => {
      setPlayers(data.players || []);
      if (data.matchCode) setMatchCode(data.matchCode);
    };
    socket.on(SOCKET_EVENTS.PLAYERS_UPDATE, onPlayersUpdate);
    return () => {
      socket.off(SOCKET_EVENTS.PLAYERS_UPDATE, onPlayersUpdate);
    };
  }, []);

  const visible = players
    .filter(p => p.status !== 'disqualified')
    .filter(p => groupFilter === 'all' || p.group === groupFilter);

  const top3 = visible.slice(0, 3);
  const rest = visible.slice(3);
  const danger = visible.filter(p => p.room >= 4 && p.status === 'active');

  return (
    <div className="w-full min-h-screen bg-[#030305] text-gray-200 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-red-800/10 blur-[80px] pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-red-950/60 bg-[#05040a]/90 backdrop-blur flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg border border-gray-800 text-gray-400 hover:text-white font-cinzel text-xs"
            >
              ← BACK
            </button>
          )}
          <div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-black tracking-[0.3em] text-white uppercase drop-shadow-[0_0_20px_rgba(225,29,72,0.5)]">
              {GAME_NAME}
            </h1>
            <p className="font-cinzel text-[11px] tracking-[0.35em] text-red-500 font-bold uppercase mt-1">
              THE ASCENSION QUIZ — LIVE STANDINGS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-1.5">
            {[
              { id: 'all', label: 'ALL' },
              { id: 'junior', label: '1ST YR' },
              { id: 'senior', label: '2ND-4TH YR' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setGroupFilter(tab.id as 'all' | 'junior' | 'senior')}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors ${
                  groupFilter === tab.id
                    ? 'bg-red-800 border-red-500 text-white'
                    : 'bg-black/50 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {globalTimeLeft !== null && (
            <div className="px-4 py-2 rounded-xl bg-red-950/40 border border-red-600/60 font-mono text-sm font-bold text-red-300">
              {fmtClock(globalTimeLeft)}
            </div>
          )}

          <div className="text-right">
            <div className="font-cinzel text-[10px] text-gray-500 tracking-wider uppercase">Match Code</div>
            <div className="font-mono text-xl sm:text-2xl font-black text-white tracking-[0.25em]">
              {matchCode}
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/30 border border-red-700/50">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm font-bold text-red-400">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Leaderboard main column */}
        <div className="flex-1 flex flex-col p-6 sm:p-8 gap-8 overflow-hidden">
          {top3.length > 0 ? (
            <div className="flex justify-center items-end gap-4 sm:gap-8">
              {top3[1] && <PodiumCard player={top3[1]} rank={1} />}
              {top3[0] && <PodiumCard player={top3[0]} rank={0} />}
              {top3[2] && <PodiumCard player={top3[2]} rank={2} />}
            </div>
          ) : (
            <div className="text-center py-16 font-cinzel text-sm text-gray-600 tracking-widest uppercase">
              Awaiting Ascendants to enter Match {matchCode}...
            </div>
          )}

          {/* Remaining players */}
          <div className="flex flex-col gap-2 overflow-y-auto flex-1">
            <AnimatePresence>
              {rest.map((p, i) => {
                const theme = getThemeForLevel(p.level);
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 px-5 py-3.5 rounded-xl border"
                    style={{
                      background: p.room >= 4 ? 'rgba(220,38,38,0.08)' : 'rgba(14,10,18,0.7)',
                      borderColor: p.room >= 4 ? '#7f1d1d' : '#1a1225',
                    }}
                  >
                    <span className="font-mono text-sm text-gray-500 w-7 text-center">#{i + 4}</span>
                    <span className="font-cinzel text-sm font-bold text-gray-100 flex-1 tracking-wider truncate">
                      {p.name}
                    </span>
                    <span className="font-mono text-xs text-gray-500">YR {p.year}</span>
                    <span className="font-mono text-lg font-bold" style={{ color: theme.accent }}>
                      Lvl {p.level}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className={`w-2.5 h-2.5 rounded-full ${j < p.room ? 'bg-red-500' : 'bg-gray-800'}`} />
                      ))}
                    </div>
                    <span className="font-mono text-xs text-gray-500 w-12 text-right">↺{p.resets}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Danger Zone Sidebar */}
        <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-red-950/60 bg-[#0f0407]/80 flex flex-col">
          <div className="px-5 py-4 border-b border-red-950/50">
            <span className="font-cinzel text-sm font-extrabold tracking-[0.2em] text-red-500 uppercase flex items-center gap-2">
              <span className="animate-pulse">⚠</span> DANGER ZONE
            </span>
            <p className="font-body text-[10px] text-gray-500 mt-1">
              Room 4 — one wrong answer = full reset to Level 0
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-red-950/30 p-2">
            <AnimatePresence>
              {danger.map(p => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg bg-red-950/25 border border-red-900/40 m-1"
                >
                  <span className="text-red-500 text-sm">⚠</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-cinzel text-xs font-bold text-gray-200 truncate">{p.name}</div>
                    <div className="font-mono text-[10px] text-gray-400">Lvl {p.level}</div>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-red-400 border border-red-700 rounded px-1.5 py-0.5">
                    R4
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {danger.length === 0 && (
              <div className="flex items-center justify-center h-24 text-gray-600 font-cinzel text-xs tracking-wider">
                No players in Room 4
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
