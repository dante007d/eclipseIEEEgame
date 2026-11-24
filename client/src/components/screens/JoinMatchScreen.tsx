import { useState, useRef, type FormEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { soundFX } from '../../lib/sound';
import { EclipseStage, GoldDivider } from '../GothicPrimitives';

interface JoinMatchScreenProps {
  onJoin: (code: string, name: string) => void;
  onStartDemo: (name: string) => void;
  onBack: () => void;
  errorMsg?: string | null;
  loading?: boolean;
  defaultCode?: string;
}

export default function JoinMatchScreen({
  onJoin,
  onStartDemo,
  onBack,
  errorMsg,
  loading = false,
  defaultCode = 'A7K3P9',
}: JoinMatchScreenProps) {
  const initialChars = defaultCode.toUpperCase().padEnd(6, '').slice(0, 6).split('');
  const [code, setCode] = useState<string[]>(initialChars);
  const [name, setName] = useState<string>(() => sessionStorage.getItem('eclipse_last_name') || '');
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
    inputRefs.current[Math.min(5, pasted.length)]?.focus();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    soundFX.playButtonClick();
    const joinedCode = code.join('').trim().toUpperCase();
    const trimmedName = name.trim();
    if (!joinedCode) {
      setLocalError('ENTER MATCH ACCESS CODE.');
      return;
    }
    if (trimmedName) {
      sessionStorage.setItem('eclipse_last_name', trimmedName);
    }
    setLocalError(null);
    onJoin(joinedCode, trimmedName);
  };

  const shownError = localError || errorMsg;

  return (
    <EclipseStage
      backgroundImage="/images/arena-archway.jpg"
      overlayClassName="bg-gradient-to-b from-black/45 via-black/65 to-black/90"
      maxWidthClass="max-w-lg"
    >
      <div className="flex-1 flex flex-col justify-between py-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              soundFX.playButtonClick();
              onBack();
            }}
            aria-label="Back to Home"
            className="px-3 py-1.5 bg-[#080508] border border-[#c69c5d]/70 text-[#e6d7be] hover:bg-[#c69c5d] hover:text-black font-mono text-xs uppercase transition-colors"
          >
            &lt;-- BACK
          </button>
          <span className="font-mono text-[10px] tracking-[0.25em] text-[#e6c48a] uppercase">
            MATCH PORTAL
          </span>
        </div>

        <form onSubmit={handleSubmit} className="my-auto eclipse-slab-box flex flex-col items-center text-center">
          <span className="eclipse-slab-label">[ JOIN CHAMBER ]</span>

          <h2 className="font-display text-4xl tracking-[0.22em] text-[#f3ece0] uppercase pt-2">
            JOIN MATCH
          </h2>
          <GoldDivider className="w-44 my-3" />

          <p className="font-mono text-xs text-[#cbbba0] mb-4">
            ENTER 6-CHARACTER ARENA CODE
          </p>

          <div className="grid grid-cols-6 gap-2 w-full max-w-[340px] mb-6">
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
                className="h-12 text-center font-mono font-bold text-lg text-[#f8efe4] bg-[#030204] border border-[#c69c5d]/70 focus:border-[#ff0033] outline-none uppercase transition-colors"
              />
            ))}
          </div>

          <div className="w-full text-left mb-5">
            <label
              htmlFor="displayNameInput"
              className="block font-mono text-[11px] tracking-[0.2em] text-[#e6c48a] uppercase mb-2 text-center"
            >
              &gt; ENTER YOUR NAME
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
              className="w-full py-3 px-4 font-mono text-sm text-white bg-[#030204] border border-[#c69c5d]/70 focus:border-[#ff0033] outline-none transition-colors"
              placeholder="ORION"
            />
          </div>

          {shownError && (
            <div className="w-full mb-4 py-2.5 px-3 bg-[#240409] border border-[#ff0033] text-[#ff8599] font-mono text-xs animate-wrong-shake">
              !! {shownError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="eclipse-btn-crimson w-full py-3 px-6 font-display text-2xl tracking-[0.22em] uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'ENTERING ARENA...' : 'JOIN'}</span>
            {!loading && <span className="text-base">&gt;&gt;</span>}
          </button>

          <button
            type="button"
            onClick={() => onStartDemo(name || 'Orion')}
            className="mt-4 font-mono text-xs text-[#e6c48a] hover:text-white underline underline-offset-4 transition-colors"
          >
            [OR LAUNCH INTERACTIVE SOLO DEMO]
          </button>
        </form>

        <div className="h-4" />
      </div>
    </EclipseStage>
  );
}
