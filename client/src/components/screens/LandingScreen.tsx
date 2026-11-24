import EclipseSky from '../EclipseSky';

interface LandingScreenProps {
  onJoinMatch: () => void;
  onOpenDashboard: () => void;
}

export default function LandingScreen({ onJoinMatch, onOpenDashboard }: LandingScreenProps) {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 overflow-hidden">
      <EclipseSky />

      {/* Top action icons */}
      <div className="relative z-10 flex justify-end gap-3 pt-3">
        <button
          aria-label="Toggle Audio"
          className="w-9 h-9 rounded-full bg-black/40 border border-red-900/40 text-gray-400 hover:text-white flex items-center justify-center transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
        <button
          aria-label="Settings"
          className="w-9 h-9 rounded-full bg-black/40 border border-red-900/40 text-gray-400 hover:text-white flex items-center justify-center transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Middle Gothic Statue / Monarch Silhouette */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center pt-8">
        {/* Seated stone sculpture graphic */}
        <div className="relative mb-6">
          <div className="w-28 h-36 rounded-t-full bg-gradient-to-b from-[#181116] via-[#100a0d] to-[#080508] border border-red-950/60 shadow-[0_0_30px_rgba(225,29,72,0.25)] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Sculpted head & robes silhouette */}
            <div className="w-10 h-10 rounded-full bg-[#20151c] border border-red-900/40 mb-2 shadow-inner" />
            <div className="w-16 h-14 bg-[#140c11] rounded-t-xl border-t border-red-950/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060709] via-transparent to-transparent" />
          </div>
          {/* Subtle mist underneath */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-40 h-6 bg-red-900/20 blur-md rounded-full" />
        </div>

        {/* Titles */}
        <h1 className="font-cinzel text-2xl font-bold tracking-[0.25em] text-gray-100 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
          PROJECT
        </h1>
        <h2 className="font-cinzel text-3xl font-extrabold tracking-[0.18em] text-red-500 uppercase mt-0.5 drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]">
          ECLIPSE
        </h2>
        <p className="font-cinzel text-[11px] font-semibold tracking-[0.35em] text-gray-400 uppercase mt-2">
          THE ASCENSION QUIZ
        </p>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex flex-col gap-3 pb-4">
        {/* Primary Join Match button */}
        <button
          onClick={onJoinMatch}
          className="w-full py-3.5 px-6 rounded-xl font-cinzel font-bold text-sm tracking-[0.2em] text-white uppercase bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#7f1d1d] border border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Join Match
        </button>

        {/* Secondary Host Dashboard button */}
        <button
          onClick={onOpenDashboard}
          className="w-full py-3 px-6 rounded-xl font-cinzel font-semibold text-xs tracking-[0.2em] text-gray-300 uppercase bg-[#0c0a0f]/80 hover:bg-[#151119] border border-red-950/80 hover:border-red-900/60 transition-all active:scale-[0.98]"
        >
          Host Dashboard
        </button>
      </div>
    </div>
  );
}
