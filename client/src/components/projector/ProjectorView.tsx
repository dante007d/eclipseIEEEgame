/**
 * xe2 – Projector Big-Screen View
 * Full-screen leaderboard with:
 *  - Top players ranked by level (desc) + time tie-break
 *  - Danger Zone right column
 *  - Animated podium top 3
 *  - Auto-scrolling live feed
 *  - Game Name / match code header
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerState } from '../../types/game';
import { GAME_NAME } from '../../types/game';
import { getThemeForLevel } from '../../theme/levelThemes';

const MOCK_PLAYERS: PlayerState[] = [
  { id: '1', name: 'Orion',   level: 32, phase: 'MAIN', room: 0, resets: 0, finished: false, bestLevel: 32 },
  { id: '2', name: 'Verdant', level: 31, phase: 'ROOM', room: 2, resets: 1, finished: false, bestLevel: 31 },
  { id: '3', name: 'Cipher',  level: 30, phase: 'MAIN', room: 0, resets: 0, finished: false, bestLevel: 30 },
  { id: '4', name: 'Nova',    level: 28, phase: 'ROOM', room: 4, resets: 1, finished: false, bestLevel: 28 },
  { id: '5', name: 'Echo',    level: 28, phase: 'ROOM', room: 3, resets: 2, finished: false, bestLevel: 29 },
  { id: '6', name: 'Atlas',   level: 18, phase: 'ROOM', room: 4, resets: 3, finished: false, bestLevel: 20 },
  { id: '7', name: 'Rune',    level: 17, phase: 'ROOM', room: 4, resets: 2, finished: false, bestLevel: 19 },
  { id: '8', name: 'Fleet',   level: 15, phase: 'MAIN', room: 0, resets: 1, finished: false, bestLevel: 17 },
  { id: '9', name: 'Storm',   level: 12, phase: 'ROOM', room: 2, resets: 0, finished: false, bestLevel: 14 },
  { id: '10', name: 'Blaze',  level: 10, phase: 'MAIN', room: 0, resets: 4, finished: false, bestLevel: 15 },
];

function PodiumCard({ player, rank }: { player: PlayerState; rank: number }) {
  const theme = getThemeForLevel(player.level);
  const heights = ['h-28', 'h-20', 'h-14'];
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.15, type: 'spring', stiffness: 300, damping: 24 }}
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
        className={`${heights[rank]} w-24 rounded-t-xl border-t-2 flex items-end justify-center pb-2`}
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

export default function ProjectorView({ players = MOCK_PLAYERS, matchCode = 'A7K3P9' }: { players?: PlayerState[]; matchCode?: string }) {
  const sorted = [...players].sort((a, b) => b.level - a.level);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const danger = sorted.filter(p => p.room >= 4);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#030305] text-gray-200 flex flex-col overflow-hidden relative">
      {/* Background atmospheric glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-red-800/10 blur-[80px] pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between px-10 py-5 border-b border-red-950/60 bg-[#05040a]/90 backdrop-blur">
        <div>
          <h1 className="font-cinzel text-3xl font-black tracking-[0.3em] text-white uppercase drop-shadow-[0_0_20px_rgba(225,29,72,0.5)]">
            {GAME_NAME}
          </h1>
          <p className="font-cinzel text-xs tracking-[0.4em] text-red-500 font-bold uppercase mt-1">
            THE ASCENSION QUIZ — LIVE LEADERBOARD
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="font-cinzel text-[10px] text-gray-500 tracking-wider uppercase">Match Code</div>
            <div className="font-mono text-2xl font-black text-white tracking-[0.3em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {matchCode}
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/30 border border-red-700/50 shadow-[0_0_20px_rgba(225,29,72,0.25)]">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm font-bold text-red-400">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex gap-0 overflow-hidden">
        {/* Leaderboard main column */}
        <div className="flex-1 flex flex-col p-8 gap-8 overflow-hidden">
          {/* Top 3 Podium */}
          {top3.length >= 3 && (
            <div className="flex justify-center items-end gap-8">
              <PodiumCard player={top3[1]} rank={1} />
              <PodiumCard player={top3[0]} rank={0} />
              <PodiumCard player={top3[2]} rank={2} />
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
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 px-5 py-3.5 rounded-xl border"
                    style={{
                      background: p.room >= 4 ? 'rgba(220,38,38,0.08)' : 'rgba(14,10,18,0.7)',
                      borderColor: p.room >= 4 ? '#7f1d1d' : '#1a1225',
                    }}
                  >
                    <span className="font-mono text-sm text-gray-600 w-6 text-center">{i + 4}</span>
                    <span className="font-cinzel text-sm font-bold text-gray-200 flex-1 tracking-wider">{p.name}</span>
                    <span className="font-mono text-lg font-bold" style={{ color: theme.accent }}>Lvl {p.level}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className={`w-2.5 h-2.5 rounded-full ${j < p.room ? 'bg-red-500' : 'bg-gray-800'}`} />
                      ))}
                    </div>
                    <span className="font-mono text-xs text-gray-600 w-12 text-right">↺{p.resets}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Danger Zone Sidebar */}
        <div className="w-56 border-l border-red-950/60 bg-[#0f0407]/80 flex flex-col">
          <div className="px-5 py-4 border-b border-red-950/50">
            <span className="font-cinzel text-sm font-extrabold tracking-[0.2em] text-red-500 uppercase flex items-center gap-2">
              <span className="animate-pulse">⚠️</span> DANGER ZONE
            </span>
            <p className="font-body text-[10px] text-gray-600 mt-1">One wrong answer = full reset</p>
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
                  className="flex items-center gap-2 px-2 py-3 rounded-lg bg-red-950/20 border border-red-900/40 m-1"
                >
                  <span className="text-red-500 text-sm">⚠️</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-cinzel text-xs font-bold text-gray-200 truncate">{p.name}</div>
                    <div className="font-mono text-[10px] text-gray-500">Lvl {p.level}</div>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-red-400 border border-red-700 rounded px-1 py-0.5">R4</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {danger.length === 0 && (
              <div className="flex items-center justify-center h-20 text-gray-700 font-cinzel text-xs tracking-wider">
                All safe
              </div>
            )}
          </div>

          {/* Live ticker at bottom */}
          <div className="px-4 py-3 border-t border-red-950/50">
            <div className="font-cinzel text-[9px] text-gray-600 tracking-wider uppercase mb-1">Activity</div>
            <AnimatePresence mode="wait">
              <motion.p
                key={tick}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="font-body text-[11px] text-gray-500"
              >
                {['Orion answered correctly!', 'Nova is in Room 4!', 'Cipher advanced to Lvl 31', 'Atlas answered Room 4...', 'Rune timed out in Room 3'][tick % 5]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
