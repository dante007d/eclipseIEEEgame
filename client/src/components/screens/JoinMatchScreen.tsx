import { useState, useRef, type FormEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import EclipseSky from '../EclipseSky';

interface JoinMatchScreenProps {
  onJoin: (code: string, name: string, year: number) => void;
  onBack: () => void;
  errorMsg?: string | null;
  loading?: boolean;
  defaultCode?: string;
}

const YEARS: Array<[number, string]> = [
  [1, '1ST'],
  [2, '2ND'],
  [3, '3RD'],
  [4, '4TH'],
];

export default function JoinMatchScreen({
  onJoin,
  onBack,
  errorMsg,
  loading = false,
  defaultCode = 'A7K3P9',
}: JoinMatchScreenProps) {
  const initialChars = defaultCode.toUpperCase().padEnd(6, '').slice(0, 6).split('');
  const [code, setCode] = useState<string[]>(initialChars);
  const [name, setName] = useState<string>(() => sessionStorage.getItem('eclipse_last_name') || '');
  const [year, setYear] = useState<number>(() => {
    const saved = Number(sessionStorage.getItem('eclipse_last_year'));
    return saved >= 1 && saved <= 4 ? saved : 1;
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-1);
    const updated = [...code];
    updated[index] = clean;
    setCode(updated);
    setLocalError(null);
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
    setCode(next);
    setLocalError(null);
    const focusIdx = Math.min(5, pasted.length);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const joinedCode = code.join('').trim().toUpperCase();
    const trimmedName = name.trim();
    if (!joinedCode) {
      setLocalError('Enter the 6-character match code (or WIRE).');
      return;
    }
    if (!trimmedName) {
      setLocalError('Display Name is required.');
      return;
    }
    sessionStorage.setItem('eclipse_last_name', trimmedName);
    sessionStorage.setItem('eclipse_last_year', String(year));
    setLocalError(null);
    onJoin(joinedCode, trimmedName, year);
  };

  const shownError = localError || errorMsg;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-5 sm:p-8 overflow-x-hidden bg-[#060709]">
      <EclipseSky />

      {/* Top navigation */}
      <div className="relative z-10 flex items-center justify-between pt-1 max-w-lg w-full mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-400 hover:text-white font-cinzel text-xs tracking-[0.15em] flex items-center gap-1.5 transition-colors py-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          BACK
        </button>
        <span className="font-cinzel text-xs text-red-500/80 font-bold tracking-[0.2em]">MATCH PORTAL</span>
      </div>

      {/* Form Content */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-md mx-auto text-center py-6"
      >
        <h2 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-[0.25em] text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          JOIN MATCH
        </h2>
        <p className="font-body text-xs text-gray-400 mt-2 mb-6">
          Enter 6-character match code (or <span className="font-mono text-red-400">WIRE</span>)
        </p>

        {/* 6 code character inputs */}
        <div className="flex gap-2 justify-center mb-6 w-full">
          {code.map((char, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              type="text"
              maxLength={1}
              value={char}
              onPaste={handlePaste}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              aria-label={`Match code character ${idx + 1}`}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-bold text-lg text-white bg-[#0e0a11]/90 border border-red-900/60 focus:border-red-500 rounded-lg shadow-[0_0_12px_rgba(225,29,72,0.25)] focus:shadow-[0_0_20px_rgba(225,29,72,0.6)] outline-none uppercase transition-all"
            />
          ))}
        </div>

        {/* Display Name Input */}
        <div className="w-full text-left mb-5">
          <label htmlFor="displayNameInput" className="block font-cinzel text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase mb-2">
            Display Name
          </label>
          <input
            id="displayNameInput"
            type="text"
            maxLength={24}
            autoComplete="off"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setLocalError(null);
            }}
            className="w-full py-3.5 px-4 rounded-xl font-body text-sm text-white bg-[#0e0a11]/90 border border-red-950/80 focus:border-red-600 outline-none shadow-inner transition-colors"
            placeholder="Enter your name or team handle"
          />
        </div>

        {/* Year of Study Selector (Junior vs Senior question bank) */}
        <div className="w-full text-left mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block font-cinzel text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase">
              Year of Study
            </label>
            <span className="font-mono text-[10px] text-red-400">
              {year === 1 ? 'JUNIOR TRACK' : 'SENIOR TRACK'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Year of Study">
            {YEARS.map(([y, label]) => {
              const active = year === y;
              return (
                <button
                  key={y}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setYear(y)}
                  className={`py-2.5 rounded-xl border font-cinzel transition-all flex flex-col items-center ${
                    active
                      ? 'bg-[#2a0b12] border-red-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                      : 'bg-[#0e0a11]/85 border-red-950/70 text-gray-400 hover:border-red-800 hover:text-gray-200'
                  }`}
                >
                  <span className="font-mono text-base font-bold leading-none">{y}</span>
                  <span className="text-[9px] tracking-widest mt-1">{label} YR</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline Error */}
        {shownError && (
          <div className="w-full mb-4 py-2.5 px-4 rounded-xl bg-red-950/70 border border-red-600 text-red-200 font-mono text-xs animate-snappy-shake">
            ⚠ {shownError}
          </div>
        )}

        {/* JOIN button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-xl font-cinzel font-bold text-sm tracking-[0.25em] text-white uppercase bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#7f1d1d] border border-red-500/50 shadow-[0_0_25px_rgba(220,38,38,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{loading ? 'ENTERING ARENA...' : 'JOIN'}</span>
          {!loading && <span className="text-xs">▶</span>}
        </button>
      </form>

      <div className="h-6" />
    </div>
  );
}
