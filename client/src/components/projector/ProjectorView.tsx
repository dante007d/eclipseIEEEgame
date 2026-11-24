import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerState } from '../../types/game';
import { GAME_NAME, SOCKET_EVENTS } from '../../types/game';
import { getThemeForLevel } from '../../theme/levelThemes';
import { socket } from '../../lib/socket';
import { getBackendMode, getSupabase } from '../../lib/supabaseClient';
import { GoldDivider } from '../GothicPrimitives';

interface ProjectorViewProps {
  onBack?: () => void;
  globalTimeLeft?: number | null;
}

function PodiumCard({ player, rank }: { player: PlayerState; rank: number }) {
  const theme = getThemeForLevel(player.level);
  const heights = ['h-24', 'h-20', 'h-14'];
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.12, type: 'spring', stiffness: 300, damping: 24 }}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="text-2xl sm:text-3xl">{medals[rank]}</div>
      <div
        className="font-cinzel text-xs sm:text-sm font-extrabold tracking-wider text-[#f3ece0] text-center"
        style={{ textShadow: `0 0 15px ${theme.glow}` }}
      >
        {player.name}
      </div>
      <div className="font-mono text-[11px] text-[#cbbba0]">Lvl {player.level}</div>
      <div
        className={`${heights[rank]} w-20 sm:w-28 rounded-t-xl border-t-2 border-x border-[#c69c5d]/50 flex items-end justify-center pb-2`}
        style={{
          background: `linear-gradient(180deg, rgba(153,27,27,0.45), rgba(10,6,9,0.9))`,
          boxShadow: `0 -4px 24px rgba(220,38,38,0.28)`,
        }}
      >
        <span className="font-mono text-xs font-bold text-[#e6c48a]">#{rank + 1}</span>
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
  const mode = getBackendMode();
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [matchCode, setMatchCode] = useState('A7K3P9');
  const [sbTimer, setSbTimer] = useState<number | null>(null);

  useEffect(() => {
    if (mode === 'supabase') {
      const supabase = getSupabase();
      const load = async () => {
        const { data } = await supabase.rpc('eclipse_get_standings', { p_match_code: matchCode });
        if (data?.ok) {
          setPlayers(data.players || []);
          if (data.matchCode) setMatchCode(data.matchCode);
          setSbTimer(data.globalRemainingMs != null ? Math.ceil(data.globalRemainingMs / 1000) : null);
        }
      };
      load();
      const t = setInterval(load, 3000);
      return () => clearInterval(t);
    }

    socket.emit('projector:join');
    const onPlayersUpdate = (data: { players: PlayerState[]; matchCode?: string }) => {
      setPlayers(data.players || []);
      if (data.matchCode) setMatchCode(data.matchCode);
    };
    socket.on(SOCKET_EVENTS.PLAYERS_UPDATE, onPlayersUpdate);
    return () => {
      socket.off(SOCKET_EVENTS.PLAYERS_UPDATE, onPlayersUpdate);
    };
  }, [mode, matchCode]);

  const visible = players.filter(p => p.status !== 'disqualified');

  const top3 = visible.slice(0, 3);
  const danger = visible.filter(p => p.room >= 4 && p.status === 'active');
  const activeTimer = mode === 'supabase' ? sbTimer : globalTimeLeft;

  return (
    <div className="relative w-full min-h-screen bg-[#050406] text-gray-200 flex flex-col overflow-hidden">
      {/* Full-bleed Eclipse Archway Artwork Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center opacity-50 pointer-events-none"
        style={{ backgroundImage: 'url(/images/arena-archway.jpg)' }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-b from-black/55 via-black/70 to-black/92 pointer-events-none"
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[#c69c5d]/40 bg-[#070407] flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="eclipse-btn-obsidian px-3 py-1.5 font-mono text-xs"
            >
              &lt;-- BACK
            </button>
          )}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl tracking-[0.28em] text-[#f3ece0] uppercase animate-glitch">
              {GAME_NAME}
            </h1>
            <p className="font-cinzel text-[11px] tracking-[0.35em] text-[#e6c48a] font-bold uppercase mt-0.5">
              LIVE LEADERBOARD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {activeTimer !== null && (
            <div className="px-4 py-2 rounded-xl bg-red-950/60 border border-red-500/60 font-mono tabular-nums text-sm font-bold text-red-200">
              {fmtClock(activeTimer)}
            </div>
          )}

          <div className="gothic-panel px-4 py-1.5 rounded-xl text-right">
            <div className="font-cinzel text-[9px] text-[#cbbba0] tracking-wider uppercase">Match Code</div>
            <div className="font-mono tabular-nums text-lg sm:text-xl font-black text-white tracking-[0.25em]">{matchCode}</div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/40 border border-red-600/60">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs font-bold text-red-300">LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 max-w-7xl w-full mx-auto overflow-hidden">
        {/* Left: Podium + Main Leaderboard Table (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          {top3.length > 0 && (
            <div className="flex justify-center items-end gap-4 sm:gap-8 pt-2">
              {top3[1] && <PodiumCard player={top3[1]} rank={1} />}
              {top3[0] && <PodiumCard player={top3[0]} rank={0} />}
              {top3[2] && <PodiumCard player={top3[2]} rank={2} />}
            </div>
          )}

          <div className="gothic-panel rounded-2xl p-4 sm:p-5 flex-1 overflow-auto">
            <table className="w-full text-left font-mono tabular-nums text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#c69c5d]/30 text-[#cbbba0] font-cinzel text-[11px] tracking-wider uppercase">
                  <th className="pb-3 pl-2">#</th>
                  <th className="pb-3">Player</th>
                  <th className="pb-3 text-center">Level</th>
                  <th className="pb-3 text-center">Depth</th>
                  <th className="pb-3 text-center">Resets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c69c5d]/15">
                {visible.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-red-950/20 transition-colors">
                    <td className="py-3 pl-2 font-bold text-gray-400">
                      {idx === 0 ? <span className="text-amber-400 text-base">👑</span> : idx + 1}
                    </td>
                    <td className="py-3 font-cinzel font-bold text-[#f3ece0] tracking-wider">
                      {p.name}
                    </td>
                    <td className="py-3 text-center font-bold text-amber-300">{p.level}</td>
                    <td className="py-3 text-center">
                      <div className="inline-flex gap-1">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <span
                            key={j}
                            className={`w-2.5 h-2.5 border ${
                              j < p.room ? 'bg-[#ff0033] border-white shadow-[0_0_6px_#ff0033]' : 'bg-[#050305] border-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-center font-bold text-gray-400">{p.resets}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center font-cinzel text-xs text-gray-500 uppercase tracking-widest">
                      Awaiting Ascendants in Match {matchCode}...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Crimson Danger Zone Panel (4 cols) */}
        <div className="lg:col-span-4 gothic-panel-crimson rounded-2xl p-5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 pb-3 border-b border-red-800/60 mb-4">
            <span className="text-red-500 animate-pulse text-sm">⚠</span>
            <h4 className="font-cinzel text-xs font-bold tracking-[0.25em] text-red-400 uppercase">
              DANGER ZONE
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5">
            <AnimatePresence>
              {danger.map(p => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1c0810]/85 border border-red-800/50 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-red-500">⚠</span>
                    <span className="font-cinzel font-bold text-[#f3ece0] truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-400">Lvl {p.level}</span>
                    <span className="px-2 py-0.5 rounded bg-red-950 border border-red-600 text-red-300 font-bold text-[11px]">
                      R4
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {danger.length === 0 && (
              <div className="py-10 text-center font-cinzel text-xs text-gray-500">
                No ascendants in Room 4
              </div>
            )}
          </div>

          <GoldDivider className="my-4 opacity-50" />
          <p className="font-body text-[11px] text-gray-400 leading-relaxed">
            Players in Room 4 face a full progress reset to Level 0 if their next answer fails.
          </p>
        </div>
      </div>
    </div>
  );
}
