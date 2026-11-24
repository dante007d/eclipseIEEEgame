import { useState, useEffect } from 'react';
import EclipseSky from '../EclipseSky';

interface MainQuestionScreenProps {
  onSelectOption: (optionId: string) => void;
  onOpenLeaderboard?: () => void;
  onWrongAnswer?: () => void;
}

export default function MainQuestionScreen({
  onSelectOption,
  onOpenLeaderboard,
  onWrongAnswer,
}: MainQuestionScreenProps) {
  const [selectedId, setSelectedId] = useState<string>('B');
  const [seconds, setSeconds] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const options = [
    { id: 'A', text: 'Increase CPU speed' },
    { id: 'B', text: 'Filter and control network traffic' },
    { id: 'C', text: 'Store backup files' },
    { id: 'D', text: 'Compress data' },
  ];

  const handleChoose = (id: string) => {
    setSelectedId(id);
    onSelectOption(id);
    if (id !== 'B') {
      onWrongAnswer?.();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#060709]">
      <EclipseSky />

      {/* Top Player HUD Bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2 border-b border-red-950/40 bg-[#070508]/70 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500 text-sm">👑</span>
          <span className="font-cinzel text-xs font-bold tracking-wider text-gray-200">Orion</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-gray-400">
          <span>Lvl <strong className="text-white">18</strong></span>
          <span>R <strong className="text-white">0</strong></span>
          <span>Rst <strong className="text-white">1</strong></span>
        </div>
      </div>

      {/* Question Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-4 overflow-y-auto">
        {/* Level Title */}
        <h3 className="font-cinzel text-xs font-bold tracking-[0.25em] text-gray-300 uppercase mb-2">
          LEVEL 18 / 60
        </h3>

        {/* Step dots */}
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i <= 4
                  ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                  : 'border border-gray-700 bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* MAIN QUESTION Badge */}
        <div className="px-5 py-1 rounded-full bg-[#1e070c] border border-red-800/80 shadow-[0_0_15px_rgba(225,29,72,0.3)] mb-4">
          <span className="font-cinzel text-[10px] font-bold tracking-[0.2em] text-red-400 uppercase">
            MAIN QUESTION
          </span>
        </div>

        {/* Circular Countdown Timer */}
        <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              className="stroke-gray-800/60"
              strokeWidth="3.5"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              className="stroke-amber-500"
              strokeWidth="3.5"
              strokeDasharray={213}
              strokeDashoffset={213 - (213 * seconds) / 90}
              strokeLinecap="round"
              fill="transparent"
              style={{ filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.7))' }}
            />
          </svg>
          <span className="absolute font-mono text-sm font-bold text-gray-100 tracking-wider">
            00:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>

        {/* Question Prompt Card */}
        <div className="w-full bg-[#0c090e]/85 border border-red-950/80 rounded-2xl p-4 shadow-[0_4px_25px_rgba(0,0,0,0.8)] mb-4 text-center">
          <p className="font-body text-xs leading-relaxed text-gray-200">
            Which of the following is a primary purpose of a firewall in a computer network?
          </p>
        </div>

        {/* Options List */}
        <div className="w-full flex flex-col gap-2.5">
          {options.map((opt) => {
            const isSelected = selectedId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleChoose(opt.id)}
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
