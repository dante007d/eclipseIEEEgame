import { useEffect } from 'react';
import { confettiBurst } from '../../animations/motionPresets';

interface LevelClearedScreenProps {
  currentLevel?: number;
  pointsGained?: number;
  onNextLevel: () => void;
}

export default function LevelClearedScreen({
  currentLevel = 1,
  pointsGained = 0,
  onNextLevel,
}: LevelClearedScreenProps) {
  const nextLevel = Math.min(60, currentLevel + 1);

  useEffect(() => {
    confettiBurst({
      colors: ['#eab308', '#fde047', '#ffffff'],
      count: 45,
    });
    const t = setTimeout(onNextLevel, 2000);
    return () => clearTimeout(t);
  }, [onNextLevel]);

  return (
    <div className="fixed inset-0 z-40 w-full h-full flex flex-col justify-between p-6 overflow-hidden bg-[#070608]">
      {/* Background majestic golden radiance & gothic archway */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c1408] via-[#0d0908] to-[#040406]" />
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-amber-500/25 blur-[70px]" />

        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-48 h-72 border-[3px] border-amber-500/50 rounded-t-[96px] shadow-[0_0_50px_rgba(245,158,11,0.4),inset_0_0_40px_rgba(245,158,11,0.3)] bg-gradient-to-b from-amber-100/20 via-amber-900/10 to-transparent flex flex-col items-center justify-end">
          <div className="w-16 h-16 rounded-full bg-amber-100 shadow-[0_0_35px_#fde047] mb-12 animate-pulse" />
          <div className="w-32 flex flex-col items-center gap-1.5 opacity-80 mb-2">
            <div className="w-8 h-1 bg-amber-400/80 rounded" />
            <div className="w-14 h-1 bg-amber-400/70 rounded" />
            <div className="w-20 h-1 bg-amber-400/60 rounded" />
            <div className="w-26 h-1 bg-amber-400/50 rounded" />
            <div className="w-32 h-1 bg-amber-400/40 rounded" />
          </div>
          <div className="absolute bottom-6 w-3 h-7 bg-amber-950 rounded-t-full shadow-lg" />
        </div>
      </div>

      <div className="relative z-10 pt-4" />

      {/* Level Cleared Titles */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center mt-60">
        <h2 className="font-cinzel text-3xl font-extrabold tracking-[0.2em] text-amber-200 uppercase drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
          LEVEL {currentLevel}
        </h2>
        <h2 className="font-cinzel text-3xl font-extrabold tracking-[0.2em] text-amber-300 uppercase drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] mt-0.5">
          CLEARED
        </h2>

        {pointsGained > 0 && (
          <div className="mt-3 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 font-mono text-xs font-bold text-amber-300">
            +{pointsGained} PTS
          </div>
        )}

        <p className="font-cinzel text-xs font-semibold tracking-[0.3em] text-gray-400 uppercase mt-4">
          Advancing to
        </p>

        <div className="font-cinzel text-xl font-black tracking-[0.25em] text-amber-400 uppercase mt-1">
          LEVEL {nextLevel} / 60
        </div>
      </div>

      {/* Advance button */}
      <div className="relative z-10 pb-4 max-w-md w-full mx-auto">
        <button
          onClick={onNextLevel}
          className="w-full py-3.5 px-6 rounded-xl font-cinzel text-xs tracking-[0.25em] text-[#070608] uppercase bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 border border-amber-200 shadow-[0_0_25px_rgba(251,191,36,0.6)] hover:brightness-110 active:scale-[0.98] transition-all font-black"
        >
          ENTER LEVEL {nextLevel} ➔
        </button>
      </div>
    </div>
  );
}
