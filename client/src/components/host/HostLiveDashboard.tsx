import { useState } from 'react';
import type { PlayerState, MatchStatus } from '../../types/game';
import { GAME_NAME } from '../../types/game';
import { getThemeForLevel } from '../../theme/levelThemes';
import { downloadResults } from '../../lib/exportResults';

interface HostLiveDashboardProps {
  players: PlayerState[];
  status: MatchStatus;
  matchCode: string;
  globalTimeLeft: number | null;
  onSetStatus: (status: MatchStatus) => void;
  onStartGlobalTimer: (seconds: number) => void;
  onDisqualify: (playerId: string) => void;
  onResetAll: () => void;
}

function DepthDots({ room }: { room: number }) {
  if (room === 0) return <span className="font-mono text-[10px] text-gray-400">MAIN</span>;
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`w-2 h-2 border ${i < room ? 'bg-[#ff0033] border-white' : 'bg-[#050305] border-gray-700'}`} />
      ))}
    </div>
  );
}

function fmtClock(s: number) {
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
}

export default function HostLiveDashboard({
  players,
  status,
  matchCode,
  globalTimeLeft,
  onSetStatus,
  onStartGlobalTimer,
  onDisqualify,
  onResetAll,
}: HostLiveDashboardProps) {
  const [search, setSearch] = useState('');
  const [customMinutes, setCustomMinutes] = useState(60);
  const [revealCode, setRevealCode] = useState(false);

  const needle = search.trim().toUpperCase();
  const filtered = players.filter(p => !needle || p.name.toUpperCase().includes(needle));

  const dangerPlayers = filtered.filter(p => p.room >= 4 && p.status === 'active');
  const finishedCount = filtered.filter(p => p.finished || p.status === 'won').length;
  const totalResets = filtered.reduce((s, p) => s + p.resets, 0);
  const avgLevel = filtered.length
    ? (filtered.reduce((s, p) => s + p.level, 0) / filtered.length).toFixed(1)
    : '—';

  const handleDQ = (p: PlayerState) => {
    if (window.confirm(`Disqualify ${p.name} from the tournament?`)) {
      onDisqualify(p.id);
    }
  };

  const handleReset = () => {
    if (window.confirm('PURGE ALL PLAYERS AND RESET LEADERBOARD? This cannot be undone.')) {
      onResetAll();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Header & Controls */}
      <div className="relative z-10 px-5 py-4 border-b border-[#c69c5d]/35 bg-[#070407]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-2xl tracking-[0.2em] text-white uppercase">
              {GAME_NAME} // ADMIN COMMAND
            </h2>
            <p className="font-mono text-[11px] text-gray-400 mt-0.5 tabular-nums">
              {players.filter(p => p.online).length} online · {players.length} total ascendants
            </p>
          </div>

          <div className="flex items-center gap-3">
            {globalTimeLeft !== null && (
              <span className="px-3 py-1 bg-[#29050b] border border-[#ff0033] text-red-200 font-mono tabular-nums text-xs font-bold">
                CYCLE ENDS {fmtClock(globalTimeLeft)}
              </span>
            )}
            <span
              className="px-3 py-1 text-xs font-mono font-bold border flex items-center gap-1.5"
              style={{
                background: status === 'live' ? '#052e16' : status === 'paused' || status === 'pending' ? '#1c1708' : '#1c0505',
                borderColor: status === 'live' ? '#16a34a' : status === 'paused' || status === 'pending' ? '#ca8a04' : '#dc2626',
                color: status === 'live' ? '#4ade80' : status === 'paused' || status === 'pending' ? '#fbbf24' : '#f87171',
              }}
            >
              <span
                className="w-2 h-2"
                style={{
                  background: status === 'live' ? '#4ade80' : status === 'paused' || status === 'pending' ? '#fbbf24' : '#f87171',
                  animation: status === 'live' || status === 'pending' ? 'pulse 1.5s infinite' : 'none',
                }}
              />
              {status === 'pending' ? 'WAITING START' : status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Match Code (Hidden by default) + Start / Action Controls */}
        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setRevealCode(v => !v)}
              title="Toggle room code visibility"
              className="flex items-center gap-2 bg-[#030204] border border-[#c69c5d]/45 px-3 py-1.5 hover:border-[#c69c5d] transition-colors"
            >
              <span className="font-mono text-[10px] text-gray-400 tracking-wider">CODE</span>
              <span className="font-mono text-sm font-bold text-[#e6c48a] tracking-widest">
                {revealCode ? matchCode : '•••••'}
              </span>
              <span className="font-mono text-[10px] text-gray-500">[{revealCode ? 'HIDE' : 'SHOW'}]</span>
            </button>

            {status === 'pending' ? (
              <button
                onClick={() => onSetStatus('live')}
                className="py-2.5 px-5 border-2 border-emerald-400 font-display text-xl tracking-[0.2em] text-white uppercase bg-emerald-700 hover:bg-emerald-600 transition-colors tabular-nums"
              >
                ▶ START GAME ({players.length} READY)
              </button>
            ) : status === 'paused' || status === 'ended' ? (
              <button
                onClick={() => onSetStatus('live')}
                className="py-2 px-4 border border-emerald-400 font-mono text-xs font-bold tracking-wider uppercase text-white bg-emerald-700 hover:bg-emerald-600 transition-colors"
              >
                ▶ {status === 'paused' ? 'RESUME GAME' : 'START NEW ROUND'}
              </button>
            ) : (
              <button
                onClick={() => onSetStatus('paused')}
                className="py-2 px-3.5 border border-gray-700 font-mono text-xs font-bold tracking-wider uppercase text-gray-200 bg-[#140d14] hover:border-gray-400 transition-colors"
              >
                ⏸ PAUSE
              </button>
            )}

            {status !== 'pending' && (
              <button
                onClick={() => onSetStatus('pending')}
                className="py-2 px-3.5 border border-amber-500/70 font-mono text-xs font-bold tracking-wider uppercase text-amber-200 bg-[#1c1306] hover:bg-amber-900/50 transition-colors"
                title="Hold all players on Waiting for Master's Command screen"
              >
                ↩ HOLD LOBBY
              </button>
            )}

            {status !== 'ended' && (
              <button
                onClick={() => {
                  if (window.confirm('End the match for all players and declare match victors?')) {
                    onSetStatus('ended');
                  }
                }}
                className="py-2 px-3.5 border border-[#dc2626] font-mono text-xs font-bold tracking-wider uppercase text-red-200 bg-[#29050b] hover:bg-red-800 transition-colors"
              >
                ⏹ END MATCH
              </button>
            )}
          </div>

          {/* Global Timer & Export Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-black/50 border border-[#c69c5d]/25 rounded-xl px-2.5 py-1">
              <span className="font-mono text-[10px] text-gray-400">MIN:</span>
              <input
                type="number"
                min={1}
                max={720}
                value={customMinutes}
                onChange={e => setCustomMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-12 bg-transparent text-center font-mono tabular-nums text-xs text-white outline-none border-b border-gray-700"
              />
              <button
                onClick={() => onStartGlobalTimer(customMinutes * 60)}
                className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-700 text-white font-mono text-[10px] font-bold"
              >
                SET TIMER
              </button>
            </div>
            <button
              onClick={() => downloadResults(filtered, 'all')}
              disabled={filtered.length === 0}
              className="py-2 px-3.5 rounded-xl font-cinzel text-xs font-bold tracking-wider text-gray-200 bg-[#0c0910] border border-[#c69c5d]/30 hover:border-[#c69c5d]/60 disabled:opacity-40 transition-colors tabular-nums"
            >
              Export CSV ({filtered.length})
            </button>
            <button
              onClick={handleReset}
              className="py-2 px-3 rounded-xl font-cinzel text-xs font-bold tracking-wider text-red-400 bg-black/50 border border-red-900/60 hover:bg-red-950/60 transition-colors"
            >
              Purge All
            </button>
          </div>
        </div>

        {/* Summary Stats + Search Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {[
            { label: 'Players', value: filtered.length, color: '#e5e7eb' },
            { label: 'Avg Level', value: avgLevel, color: '#fbbf24' },
            { label: 'Resets', value: totalResets, color: '#f87171' },
            { label: 'Finished', value: finishedCount, color: '#4ade80' },
          ].map(s => (
            <div key={s.label} className="bg-[#08060a]/90 border border-[#c69c5d]/20 rounded-xl p-2 text-center">
              <div className="font-cinzel text-[9px] text-gray-400 uppercase tracking-wider">{s.label}</div>
              <div className="font-mono tabular-nums text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <span className="font-cinzel text-[11px] font-semibold tracking-[0.18em] text-[#e6c48a] uppercase">
            Unified Match Standings · 60 Levels
          </span>

          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ascendant..."
            className="px-3 py-1.5 rounded-lg bg-black/55 border border-[#c69c5d]/30 focus:border-red-500 font-mono text-xs text-white outline-none w-56"
          />
        </div>
      </div>

      {/* Main content: Rankings Table + Danger Zone */}
      <div className="relative z-10 flex-1 overflow-hidden flex flex-col md:flex-row">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#070407] border-b border-[#c69c5d]/30">
              <tr>
                {['#', 'Player', 'Lvl', 'Phase', 'Rst', 'Best', 'Fails', 'Cheat', 'Status', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 font-cinzel text-[10px] text-gray-400 uppercase tracking-wider font-bold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/50 font-mono tabular-nums text-xs">
              {filtered.map((p, idx) => {
                const theme = getThemeForLevel(p.level);
                return (
                  <tr key={p.id} className={`hover:bg-red-950/10 transition-colors ${p.status === 'disqualified' ? 'opacity-45' : ''}`}>
                    <td className="px-3 py-2.5 text-gray-500">{idx === 0 ? '👑' : idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            p.status === 'disqualified'
                              ? 'bg-amber-500'
                              : !p.online
                              ? 'bg-gray-600'
                              : p.status === 'won'
                              ? 'bg-emerald-400'
                              : 'bg-emerald-500 animate-pulse'
                          }`}
                        />
                        <span className="font-cinzel font-bold text-gray-100">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-bold" style={{ color: theme.accent }}>{p.level}</td>
                    <td className="px-3 py-2.5"><DepthDots room={p.room} /></td>
                    <td className="px-3 py-2.5 text-gray-400">{p.resets}</td>
                    <td className="px-3 py-2.5 text-gray-400">{p.bestLevel}</td>
                    <td className="px-3 py-2.5 text-gray-400">{p.fails}</td>
                    <td className={`px-3 py-2.5 font-bold ${p.cheats > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                      {p.cheats}
                    </td>
                    <td className="px-3 py-2.5 uppercase text-[10px]">
                      <span
                        className={
                          p.status === 'won'
                            ? 'text-emerald-400'
                            : p.status === 'disqualified'
                            ? 'text-red-500'
                            : p.status === 'dead'
                            ? 'text-amber-500'
                            : 'text-gray-300'
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => handleDQ(p)}
                        disabled={p.status === 'disqualified'}
                        className="px-2 py-1 rounded border border-red-800/70 text-[10px] text-red-400 hover:bg-red-900/50 disabled:opacity-30 transition-colors"
                      >
                        DQ
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-600 font-cinzel text-xs">
                    No players match this filter yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Danger Zone Sidebar */}
        <div className="w-full md:w-52 border-t md:border-t-0 md:border-l border-red-950/60 bg-[#120508]/70 flex flex-col shrink-0 max-h-56 md:max-h-none">
          <div className="px-3 py-3 border-b border-red-950/50">
            <span className="font-cinzel text-[10px] font-bold tracking-wider text-red-500 uppercase flex items-center gap-1.5">
              <span className="animate-pulse">⚠</span> DANGER ZONE ({dangerPlayers.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-red-950/30">
            {dangerPlayers.map(p => (
              <div key={p.id} className="px-3 py-2.5">
                <div className="font-cinzel text-xs font-bold text-gray-200 truncate">{p.name}</div>
                <div className="font-mono text-[10px] text-gray-400 mt-0.5 flex items-center justify-between">
                  <span>Lvl {p.level}</span>
                  <span className="text-[9px] font-bold text-red-400 border border-red-800 rounded px-1">R4</span>
                </div>
              </div>
            ))}
            {dangerPlayers.length === 0 && (
              <div className="px-3 py-6 text-center font-mono text-[10px] text-gray-600">
                No players in Room 4
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
