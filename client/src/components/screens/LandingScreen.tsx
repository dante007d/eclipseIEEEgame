import { useState } from 'react';
import EclipseSky from '../EclipseSky';
import type { LeaderboardSnapshot } from '../../types/game';

interface LandingScreenProps {
  onJoinMatch: () => void;
  onOpenDashboard: () => void;
  onOpenProjector: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  connected: boolean;
  leaderboard: LeaderboardSnapshot;
}

export default function LandingScreen({
  onJoinMatch,
  onOpenDashboard,
  onOpenProjector,
  soundEnabled,
  onToggleSound,
  connected,
  leaderboard,
}: LandingScreenProps) {
  const [showStandings, setShowStandings] = useState(false);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-5 sm:p-8 overflow-x-hidden bg-[#060709]">
      <EclipseSky />

      {/* Top action bar */}
      <div className="relative z-10 flex items-center justify-between gap-3 max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-red-950/60">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500 animate-ping'
            }`}
          />
          <span className="font-mono text-[11px] text-gray-300 tracking-wider uppercase">
            {connected ? `LIVE · ${leaderboard.online} ONLINE` : 'CONNECTING...'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenProjector}
            className="px-3 py-2 rounded-full bg-black/50 border border-red-900/40 text-gray-300 hover:text-white hover:border-red-500/60 font-cinzel text-[11px] font-bold tracking-wider uppercase transition-colors"
          >
            Projector
          </button>
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
            title={soundEnabled ? 'Sound ON' : 'Sound OFF'}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors shadow-sm ${
              soundEnabled
                ? 'bg-red-950/60 border-red-500 text-red-300'
                : 'bg-black/40 border-red-900/40 text-gray-400 hover:text-white'
            }`}
          >
            {soundEnabled ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Middle Gothic Monument & Title */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center py-8 max-w-lg mx-auto w-full">
        <div className="relative mb-6">
          <div className="w-28 h-36 rounded-t-full bg-gradient-to-b from-[#181116] via-[#100a0d] to-[#080508] border border-red-950/60 shadow-[0_0_30px_rgba(225,29,72,0.25)] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[#20151c] border border-red-900/40 mb-2 shadow-inner" />
            <div className="w-16 h-14 bg-[#140c11] rounded-t-xl border-t border-red-950/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060709] via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-40 h-6 bg-red-900/20 blur-md rounded-full" />
        </div>

        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold tracking-[0.25em] text-gray-100 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
          PROJECT
        </h1>
        <h2 className="font-cinzel text-4xl sm:text-5xl font-extrabold tracking-[0.18em] text-red-500 uppercase mt-0.5 drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]">
          ECLIPSE
        </h2>
        <p className="font-cinzel text-xs font-semibold tracking-[0.35em] text-gray-400 uppercase mt-2">
          THE ASCENSION QUIZ
        </p>

        {/* Compact Cascade Protocol Summary */}
        <div className="mt-6 w-full rounded-2xl bg-[#0b080e]/85 border border-red-950/70 p-4 text-left backdrop-blur-sm">
          <div className="font-cinzel text-[10px] font-bold tracking-[0.25em] text-red-400 uppercase mb-2">
            THE CASCADE PROTOCOL // 60 LEVELS
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-gray-300">
            <div className="bg-black/40 rounded-lg p-2 border border-red-950/40">
              <span className="text-amber-400 font-bold block">MAIN (45s)</span>
              Correct → Level + 1
            </div>
            <div className="bg-black/40 rounded-lg p-2 border border-red-950/40">
              <span className="text-red-400 font-bold block">ROOMS 1–4 (30s)</span>
              Recover → Return to Main
            </div>
            <div className="col-span-2 bg-red-950/25 rounded-lg p-2 border border-red-900/40 text-red-300">
              <span className="font-bold">ROOM 4 FAILURE:</span> 5 consecutive misses trigger a <strong className="text-white">FULL RESET</strong> to Level 0.
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons & Live Leaderboard Drawer */}
      <div className="relative z-10 flex flex-col gap-3 max-w-md w-full mx-auto pb-4">
        <button
          onClick={onJoinMatch}
          className="w-full py-4 px-6 rounded-xl font-cinzel font-bold text-sm tracking-[0.2em] text-white uppercase bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#7f1d1d] border border-red-500/50 shadow-[0_0_25px_rgba(220,38,38,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Join Match ▶
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onOpenDashboard}
            className="w-full py-3 px-4 rounded-xl font-cinzel font-semibold text-xs tracking-[0.15em] text-gray-300 uppercase bg-[#0c0a0f]/85 hover:bg-[#151119] border border-red-950/80 hover:border-red-900/60 transition-all active:scale-[0.98]"
          >
            Host Dashboard
          </button>
          <button
            onClick={() => setShowStandings(s => !s)}
            className="w-full py-3 px-4 rounded-xl font-cinzel font-semibold text-xs tracking-[0.15em] text-amber-300 uppercase bg-[#0c0a0f]/85 hover:bg-[#151119] border border-amber-900/40 hover:border-amber-600/60 transition-all active:scale-[0.98]"
          >
            {showStandings ? 'Hide Standings' : `Standings (${leaderboard.total})`}
          </button>
        </div>

        {showStandings && (
          <div className="mt-2 rounded-2xl bg-[#0b080e]/95 border border-red-950/80 p-4 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-950/50">
              <span className="font-cinzel text-xs font-bold tracking-widest text-red-400 uppercase">
                LIVE ASCENDANTS
              </span>
              <span className="font-mono text-[10px] text-gray-500">
                {leaderboard.online} ONLINE / {leaderboard.total} TOTAL
              </span>
            </div>
            {leaderboard.players.length === 0 ? (
              <p className="text-center font-mono text-xs text-gray-600 py-4">
                No souls inside the Eclipse yet. Be the first.
              </p>
            ) : (
              <div className="divide-y divide-gray-900/70">
                {leaderboard.players.slice(0, 15).map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between py-2 text-xs font-mono">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-500 w-6">#{idx + 1}</span>
                      <span className="font-cinzel font-bold text-gray-200 truncate">{p.name}</span>
                      {p.room >= 4 && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-red-950 border border-red-700 text-red-400 rounded">
                          R4
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-amber-400 font-bold">Lv {p.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
