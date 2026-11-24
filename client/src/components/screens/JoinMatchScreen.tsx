import { useState } from 'react';
import EclipseSky from '../EclipseSky';

interface JoinMatchScreenProps {
  onJoin: (code: string, name: string) => void;
  onBack: () => void;
}

export default function JoinMatchScreen({ onJoin, onBack }: JoinMatchScreenProps) {
  const [code, setCode] = useState(['A', '7', 'K', '3', 'P', '9']);
  const [name, setName] = useState('Orion');

  const handleDigitChange = (index: number, val: string) => {
    const uppercase = val.toUpperCase().slice(-1);
    const updated = [...code];
    updated[index] = uppercase;
    setCode(updated);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 overflow-hidden">
      <EclipseSky />

      {/* Top navigation */}
      <div className="relative z-10 flex items-center justify-between pt-3">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white font-cinzel text-xs tracking-[0.15em] flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          BACK
        </button>
        <span className="font-cinzel text-xs text-red-500/80 font-bold tracking-[0.2em]">MATCH PORTAL</span>
      </div>

      {/* Form Content */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-[320px] mx-auto text-center">
        <h2 className="font-cinzel text-2xl font-bold tracking-[0.25em] text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          JOIN MATCH
        </h2>
        <p className="font-body text-xs text-gray-400 mt-2 mb-6">
          Enter 6-character code
        </p>

        {/* 6 code character inputs */}
        <div className="flex gap-2 justify-center mb-8 w-full">
          {code.map((char, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              value={char}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              className="w-11 h-13 text-center font-mono font-bold text-lg text-white bg-[#0e0a11]/90 border border-red-900/60 focus:border-red-500 rounded-lg shadow-[0_0_12px_rgba(225,29,72,0.25)] focus:shadow-[0_0_20px_rgba(225,29,72,0.6)] outline-none uppercase transition-all"
            />
          ))}
        </div>

        {/* Display Name Input */}
        <div className="w-full text-left mb-6">
          <label className="block font-cinzel text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full py-3 px-4 rounded-xl font-body text-sm text-white bg-[#0e0a11]/90 border border-red-950/80 focus:border-red-600 outline-none shadow-inner transition-colors"
            placeholder="Enter display name"
          />
        </div>

        {/* JOIN button */}
        <button
          onClick={() => onJoin(code.join(''), name)}
          className="w-full py-3.5 px-6 rounded-xl font-cinzel font-bold text-sm tracking-[0.25em] text-white uppercase bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#7f1d1d] border border-red-500/50 shadow-[0_0_25px_rgba(220,38,38,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>JOIN</span>
          <span className="text-xs">▶</span>
        </button>
      </div>

      <div className="h-6" />
    </div>
  );
}
