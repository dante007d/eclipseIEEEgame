import { useState, type FormEvent } from 'react';
import { soundFX } from '../../lib/sound';
import { EclipseStage, GoldDivider } from '../GothicPrimitives';

interface JoinMatchScreenProps {
  onJoin: (code: string, name: string) => void;
  onStartDemo: (name: string) => void;
  onBack: () => void;
  errorMsg?: string | null;
  loading?: boolean;
}

export default function JoinMatchScreen({
  onJoin,
  onStartDemo,
  onBack,
  errorMsg,
  loading = false,
}: JoinMatchScreenProps) {
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>(() => sessionStorage.getItem('eclipse_last_name') || '');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    soundFX.playButtonClick();
    const joinedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (!joinedCode) {
      setLocalError('ACCESS CODE REQUIRED.');
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

          <div className="w-full text-left mb-4">
            <label
              htmlFor="joinCodeInput"
              className="block font-mono text-[11px] tracking-[0.2em] text-[#e6c48a] uppercase mb-2 text-center"
            >
              &gt; ENTER ACCESS CODE
            </label>
            <input
              id="joinCodeInput"
              type="text"
              maxLength={20}
              autoComplete="off"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setLocalError(null);
              }}
              className="w-full py-3 px-4 text-center font-mono font-bold text-lg text-[#f8efe4] bg-[#030204] border border-[#c69c5d]/70 focus:border-[#ff0033] tracking-[0.2em] uppercase outline-none transition-colors"
              placeholder="ACCESS CODE"
              autoFocus
            />
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
