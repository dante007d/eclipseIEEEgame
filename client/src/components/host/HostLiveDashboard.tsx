/**
 * xe2 – Host Live Dashboard
 * Features:
 *  - Match status (live/paused), code display, start/pause/end controls
 *  - Real-time player table: level, phase, room, resets, accuracy
 *  - Ranking: level desc, tie-broken by time
 *  - Remove player action
 *  - Export results CSV button
 *  - Danger zone sidebar: players in room 4
 */

import { useState } from 'react';
import type { PlayerState } from '../../types/game';
import { GAME_NAME } from '../../types/game';
import { getThemeForLevel } from '../../theme/levelThemes';

// Mock live data
const MOCK_LIVE: PlayerState[] = [
  { id: '1', name: 'Orion',   level: 32, phase: 'MAIN', room: 0, resets: 0, finished: false, bestLevel: 32 },
  { id: '2', name: 'Verdant', level: 31, phase: 'ROOM', room: 2, resets: 1, finished: false, bestLevel: 31 },
  { id: '3', name: 'Cipher',  level: 30, phase: 'MAIN', room: 0, resets: 0, finished: false, bestLevel: 30 },
  { id: '4', name: 'Nova',    level: 28, phase: 'ROOM', room: 4, resets: 1, finished: false, bestLevel: 28 },
  { id: '5', name: 'Echo',    level: 28, phase: 'ROOM', room: 3, resets: 2, finished: false, bestLevel: 29 },
  { id: '6', name: 'Atlas',   level: 18, phase: 'ROOM', room: 4, resets: 3, finished: false, bestLevel: 20 },
  { id: '7', name: 'Rune',    level: 17, phase: 'ROOM', room: 4, resets: 2, finished: false, bestLevel: 19 },
  { id: '8', name: 'Fleet',   level: 15, phase: 'MAIN', room: 0, resets: 1, finished: false, bestLevel: 17 },
];

type MatchStatus = 'pending' | 'live' | 'paused' | 'ended';

function DepthDots({ room }: { room: number }) {
  if (room === 0) return <span className="font-cinzel text-[9px] text-gray-500">MAIN</span>;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${i < room ? 'bg-red-500' : 'bg-gray-700'}`} />
      ))}
    </div>
  );
}

export default function HostLiveDashboard() {
  const [players, _setPlayers] = useState<PlayerState[]>(MOCK_LIVE);
  const [status, setStatus] = useState<MatchStatus>('live');
  const [matchCode] = useState('A7K3P9');
  const [removedId, setRemovedId] = useState<string | null>(null);

  const visiblePlayers = players.filter(p => p.id !== removedId);
  const sorted = [...visiblePlayers].sort((a, b) => b.level - a.level);
  const dangerPlayers = sorted.filter(p => p.room >= 4);
  const finished = sorted.filter(p => p.finished).length;

  const handleRemove = (id: string) => {
    if (confirm(`Remove this player from the match?`)) setRemovedId(id);
  };

  const handleExport = () => {
    const csv = [
      'name,level,phase,room,resets,bestLevel,finished',
      ...sorted.map(p =>
        `${p.name},${p.level},${p.phase},${p.room},${p.resets},${p.bestLevel},${p.finished}`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eclipse_${matchCode}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#060709] overflow-hidden">
      {/* Header */}
      <div className="relative z-10 px-5 pt-5 pb-3 border-b border-red-950/60 bg-[#08060b]/90">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-cinzel text-sm font-extrabold tracking-[0.2em] text-white uppercase">{GAME_NAME}</h1>
            <p className="font-cinzel text-[10px] text-red-500 tracking-[0.3em] font-bold uppercase mt-0.5">Host Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5"
              style={{
                background: status === 'live' ? '#052e16' : status === 'paused' ? '#1c1708' : '#1c0505',
                borderColor: status === 'live' ? '#16a34a' : status === 'paused' ? '#ca8a04' : '#dc2626',
                color: status === 'live' ? '#4ade80' : status === 'paused' ? '#fbbf24' : '#f87171',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: status === 'live' ? '#4ade80' : status === 'paused' ? '#fbbf24' : '#f87171',
                  animation: status === 'live' ? 'pulse 1.5s infinite' : 'none',
                }}
              />
              {status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Match Code + Controls Row */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-2 bg-black/40 border border-gray-800 rounded-xl px-3 py-2">
            <span className="font-cinzel text-[10px] text-gray-500 tracking-wider">CODE</span>
            <span className="font-mono text-lg font-black text-white tracking-widest">{matchCode}</span>
          </div>
          <div className="flex gap-2">
            {status === 'pending' && (
              <button onClick={() => setStatus('live')} className="py-2 px-4 rounded-xl font-cinzel text-xs font-bold tracking-wider text-white bg-emerald-700 hover:bg-emerald-600 transition-colors flex items-center gap-1.5">
                ▶ Start
              </button>
            )}
            {status === 'live' && (
              <button onClick={() => setStatus('paused')} className="py-2 px-4 rounded-xl font-cinzel text-xs font-bold tracking-wider text-gray-200 bg-[#1a1420] border border-gray-700 hover:border-gray-500 transition-colors flex items-center gap-1.5">
                ⏸ Pause
              </button>
            )}
            {status === 'paused' && (
              <button onClick={() => setStatus('live')} className="py-2 px-4 rounded-xl font-cinzel text-xs font-bold tracking-wider text-white bg-emerald-700 hover:bg-emerald-600 transition-colors flex items-center gap-1.5">
                ▶ Resume
              </button>
            )}
            {status !== 'ended' && (
              <button onClick={() => setStatus('ended')} className="py-2 px-4 rounded-xl font-cinzel text-xs font-bold tracking-wider text-red-300 bg-red-950/60 border border-red-700/80 hover:bg-red-900/60 transition-colors flex items-center gap-1.5">
                ⏹ End
              </button>
            )}
            <button onClick={handleExport} className="py-2 px-4 rounded-xl font-cinzel text-xs font-bold tracking-wider text-gray-300 bg-[#0c0910] border border-gray-800 hover:border-gray-600 transition-colors flex items-center gap-1.5">
              💾 Export CSV
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { label: 'Players', value: visiblePlayers.length, color: '#e5e7eb' },
            { label: 'Avg Lvl', value: visiblePlayers.length > 0 ? (visiblePlayers.reduce((s, p) => s + p.level, 0) / visiblePlayers.length).toFixed(1) : '—', color: '#fbbf24' },
            { label: 'Resets', value: visiblePlayers.reduce((s, p) => s + p.resets, 0), color: '#f87171' },
            { label: 'Finished', value: finished, color: '#4ade80' },
          ].map(s => (
            <div key={s.label} className="bg-[#08060a] border border-gray-900 rounded-xl p-2 text-center">
              <div className="font-cinzel text-[9px] text-gray-500 uppercase tracking-wider">{s.label}</div>
              <div className="font-mono text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content: Table + Danger Zone */}
      <div className="relative z-10 flex-1 overflow-hidden flex gap-0">
        {/* Player Rankings Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#09060c]/95 backdrop-blur-sm border-b border-red-950/60">
              <tr>
                {['#', 'Player', 'Lvl', 'Phase', 'Resets', 'Best', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 font-cinzel text-[10px] text-gray-500 uppercase tracking-wider font-bold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/50">
              {sorted.map((p, idx) => {
                const theme = getThemeForLevel(p.level);
                return (
                  <tr key={p.id} className="hover:bg-red-950/10 transition-colors group">
                    <td className="px-3 py-3 font-mono text-xs text-gray-500">
                      {idx === 0 ? '👑' : idx + 1}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-cinzel text-xs font-bold text-gray-200 tracking-wide">{p.name}</div>
                      {p.finished && <div className="font-mono text-[9px] text-amber-400">FINISHED</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-sm font-bold" style={{ color: theme.accent }}>{p.level}</span>
                    </td>
                    <td className="px-3 py-3">
                      <DepthDots room={p.room} />
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-500">{p.resets}</td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-500">{p.bestLevel}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleRemove(p.id)}
                        className="text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                        title="Remove player"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Danger Zone Sidebar */}
        {dangerPlayers.length > 0 && (
          <div className="w-40 border-l border-red-950/60 bg-[#120508]/70 flex flex-col shrink-0">
            <div className="px-3 py-3 border-b border-red-950/50">
              <span className="font-cinzel text-[10px] font-bold tracking-wider text-red-500 uppercase flex items-center gap-1.5">
                <span className="animate-pulse">⚠️</span> DANGER
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-red-950/30">
              {dangerPlayers.map(p => (
                <div key={p.id} className="px-3 py-3">
                  <div className="font-cinzel text-xs font-bold text-gray-300 truncate">{p.name}</div>
                  <div className="font-mono text-[10px] text-gray-500 mt-0.5">Lvl {p.level}</div>
                  <div className="mt-1 text-[9px] font-bold text-red-400 border border-red-800 rounded px-1 py-0.5 inline-block">R4</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
