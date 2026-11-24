import { useEffect } from 'react';
import EclipseSky from '../EclipseSky';

interface RecoveryRoomTransitionProps {
  onContinue: () => void;
  roomNumber?: number;
  roast?: string;
  isTimeout?: boolean;
}

const ROOM_LABELS: Record<number, string> = {
  1: 'BUFFER',
  2: 'CACHE',
  3: 'SANDBOX',
  4: 'VOID — FINAL CHANCE',
};

export default function RecoveryRoomTransition({
  onContinue,
  roomNumber = 1,
  roast,
  isTimeout = false,
}: RecoveryRoomTransitionProps) {
  useEffect(() => {
    const t = setTimeout(onContinue, 2600);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-6 overflow-hidden bg-[#060709]">
      <EclipseSky glowIntensity="high" subtleCity={true} />

      <div className="relative z-10 pt-4" />

      {/* Center Stone Sculpture & Room Announcement */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center px-4 max-w-md mx-auto">
        <div className="relative mb-7">
          <div className="w-28 h-32 rounded-2xl bg-gradient-to-b from-[#251319] via-[#120a10] to-[#080507] border border-red-900/60 shadow-[0_0_35px_rgba(225,29,72,0.4)] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-16 h-18 bg-[#180e14] rounded-lg border-r-2 border-red-600/80 mb-2 rotate-6" />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#060709] to-transparent" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-8 bg-red-600/25 blur-lg rounded-full" />
        </div>

        <h2 className="font-cinzel text-xl font-bold tracking-[0.25em] text-gray-200 uppercase">
          ENTERING
        </h2>
        <h3 className="font-cinzel text-2xl sm:text-3xl font-extrabold tracking-[0.2em] text-red-500 uppercase mt-1 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]">
          RECOVERY ROOM
        </h3>

        <p className="font-body text-xs text-gray-400 mt-3 leading-relaxed">
          {isTimeout ? 'Time Expired.' : 'Incorrect.'}
          <br />
          You are dropping to
        </p>

        <div className="mt-2 font-cinzel text-lg font-bold tracking-[0.2em] text-red-400 uppercase">
          ROOM {roomNumber} / 4 · {ROOM_LABELS[roomNumber] || ''}
        </div>

        {roast && (
          <p className="mt-4 px-4 py-2 rounded-xl bg-red-950/50 border border-red-900/60 font-mono text-[11px] text-red-200 leading-relaxed">
            "{roast}"
          </p>
        )}

        {roomNumber === 4 && (
          <p className="mt-3 font-mono text-[11px] text-amber-400 font-bold tracking-wider uppercase animate-pulse">
            ⚠ ONE MORE MISTAKE = FULL RESET TO LEVEL 0
          </p>
        )}

        <div className="w-2.5 h-2.5 bg-red-600 rotate-45 shadow-[0_0_8px_#ef4444] mt-4" />
      </div>

      {/* Continue button */}
      <div className="relative z-10 pb-4 max-w-md w-full mx-auto">
        <button
          onClick={onContinue}
          className="w-full py-3.5 px-6 rounded-xl font-cinzel font-bold text-xs tracking-[0.25em] text-white uppercase bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#7f1d1d] border border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:brightness-110 active:scale-[0.98] transition-all"
        >
          ENTER ROOM {roomNumber} ▶
        </button>
      </div>
    </div>
  );
}
