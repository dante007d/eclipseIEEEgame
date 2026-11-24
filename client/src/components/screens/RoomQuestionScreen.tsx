import { useState, useEffect } from 'react';
import EclipseSky from '../EclipseSky';

interface RoomQuestionScreenProps {
  onSuccess: () => void;
  onFail?: () => void;
  onOpenLeaderboard?: () => void;
}

export default function RoomQuestionScreen({ onSuccess, onFail, onOpenLeaderboard }: RoomQuestionScreenProps) {
  const [selectedId, setSelectedId] = useState<string>('B');
  const [seconds, setSeconds] = useState(27);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const options = [
    { id: 'A', text: 'Application Layer' },
    { id: 'B', text: 'Kernel' },
    { id: 'C', text: 'User Interface Layer' },
    { id: 'D', text: 'Network Layer' },
  ];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (id === 'B') {
      onSuccess();
    } else {
      onFail?.();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#060709]">
      <EclipseSky glowIntensity="high" subtleCity={true} />

      {/* Top Player HUD Bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2 border-b border-red-950/40 bg-[#070508]/70 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500 text-sm">👑</span>
          <span className="font-cinzel text-xs font-bold tracking-wider text-gray-200">Orion</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-gray-400">
          <span>Lvl <strong className="text-white">18</strong></span>
          <span>R <strong className="text-red-400">1</strong></span>
          <span>Rst <strong className="text-white">1</strong></span>
        </div>
      </div>

      {/* Recovery Question Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-5 overflow-y-auto">
        {/* Room Title */}
        <h3 className="font-cinzel text-sm font-bold tracking-[0.25em] text-red-500 uppercase mb-4 drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]">
          ROOM 1 / 4
        </h3>

        {/* Red Countdown Timer Ring */}
        <div className="relative w-22 h-22 mb-6 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="44"
              cy="44"
              r="38"
              className="stroke-gray-800/60"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="44"
              cy="44"
              r="38"
              className="stroke-red-600"
              strokeWidth="4"
              strokeDasharray={238}
              strokeDashoffset={238 - (238 * seconds) / 60}
              strokeLinecap="round"
              fill="transparent"
              style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.9))' }}
            />
          </svg>
          <span className="absolute font-mono text-base font-bold text-gray-100 tracking-wider">
            00:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>

        {/* Question Prompt Card */}
        <div className="w-full bg-[#0c090e]/85 border border-red-950/80 rounded-2xl p-4 shadow-[0_4px_25px_rgba(0,0,0,0.8)] mb-5 text-center">
          <p className="font-body text-xs leading-relaxed text-gray-200">
            Which layer of the OS handles resource management?
          </p>
        </div>

        {/* Options List */}
        <div className="w-full flex flex-col gap-2.5">
          {options.map((opt) => {
            const isSelected = selectedId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`w-full py-3 px-3.5 rounded-xl flex items-center gap-3 text-left transition-all ${
                  isSelected
                    ? 'bg-[#2a0b12] border border-red-500/80 shadow-[0_0_20px_rgba(225,29,72,0.4),inset_0_0_12px_rgba(225,29,72,0.2)]'
                    : 'bg-[#0b080c]/80 border border-gray-900/80 hover:border-red-950/60 hover:bg-[#120c14]'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-cinzel text-xs font-bold shrink-0 ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'border border-gray-700 text-gray-400'
                  }`}
                >
                  {opt.id}
                </span>
                <span
                  className={`font-body text-xs ${
                    isSelected ? 'text-white font-medium' : 'text-gray-300'
                  }`}
                >
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation Dock */}
      <div className="relative z-10 flex items-center justify-around py-3 px-6 border-t border-red-950/40 bg-[#070508]/85 backdrop-blur-md">
        <button
          onClick={onOpenLeaderboard}
          aria-label="Players Team"
          className="text-gray-400 hover:text-red-400 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
        <button
          onClick={onOpenLeaderboard}
          aria-label="Leaderboard"
          className="text-red-500 hover:text-red-400 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        <button
          aria-label="Game Info"
          className="text-gray-400 hover:text-red-400 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
