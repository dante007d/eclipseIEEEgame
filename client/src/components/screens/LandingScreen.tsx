import { useState, type FormEvent } from 'react';
import type { LeaderboardSnapshot } from '../../types/game';
import { soundFX } from '../../lib/sound';
import { EclipseStage, GoldDivider } from '../GothicPrimitives';

interface LandingScreenProps {
  onEnterGame: (code: string, name: string) => void;
  onStartDemo: (name: string) => void;
  onOpenProjector: () => void;
  connected: boolean;
  leaderboard: LeaderboardSnapshot;
  errorMsg?: string | null;
  loading?: boolean;
}

export default function LandingScreen({
  onEnterGame,
  onStartDemo,
  onOpenProjector,
  connected,
  leaderboard,
  errorMsg,
  loading = false,
}: LandingScreenProps) {
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>(() => sessionStorage.getItem('eclipse_last_name') || '');
  const [localError, setLocalError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    soundFX.unlockOnInteraction();
    soundFX.playButtonClick();
    const trimmedCode = code.trim();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setLocalError('ACCESS CODE REQUIRED.');
      return;
    }

    if (trimmedName) {
      sessionStorage.setItem('eclipse_last_name', trimmedName);
    }
    setLocalError(null);
    onEnterGame(trimmedCode.toUpperCase(), trimmedName);
  };

  const shownError = localError || errorMsg;

  return (
    <EclipseStage
      backgroundImage="/images/home-eclipse.jpg"
      overlayClassName="bg-gradient-to-b from-black/35 via-black/48 to-black/88"
      maxWidthClass="max-w-xl"
      squeeze={0.22}
    >
      <div className="flex-1 flex flex-col justify-between py-2">
        {/* Top Corners: Locked Audio Status (Left) & Telemetry + Settings (Right) */}
        <div className="flex items-center justify-between gap-3">
          <span className="px-3 py-1.5 bg-[#7f0d16] border border-[#ff0033] text-white font-mono text-xs uppercase tracking-wider">
            [AUDIO: ACTIVE]
          </span>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-[#080508] border border-[#c69c5d]/45 font-mono text-[11px] text-[#cbbba0] uppercase tabular-nums">
              <span className={`w-2 h-2 ${connected ? 'bg-[#b8ff00]' : 'bg-[#c69c5d]'}`} />
              {connected ? `${leaderboard.online} ONLINE` : 'STANDBY'}
            </span>
            <button
              type="button"
              onClick={() => {
                soundFX.playButtonClick();
                setSettingsOpen(true);
              }}
              aria-label="Audio & Arena Settings"
              className="px-3 py-1.5 bg-[#080508] border border-[#c69c5d]/70 text-[#e6d7be] hover:bg-[#c69c5d] hover:text-black font-mono text-xs uppercase tracking-wider transition-colors"
            >
              [SETTINGS]
            </button>
          </div>
        </div>

        {/* Upper-Middle Title */}
        <div className="flex flex-col items-center text-center my-5 sm:my-7">
          <h1 className="font-display text-4xl sm:text-5xl tracking-[0.26em] text-[#f3ece0] uppercase drop-shadow-[0_3px_12px_rgba(0,0,0,1)]">
            PROJECT
          </h1>
          <h2 className="font-display text-6xl sm:text-7xl tracking-[0.16em] text-[#e6c48a] uppercase -mt-1 animate-glitch">
            ECLIPSE
          </h2>
          <GoldDivider className="my-2.5 w-56 mx-auto" />
          <p className="font-mono text-xs tracking-[0.28em] text-[#ff0033] uppercase">
            THE ASCENSION QUIZ // NO EXIT
          </p>
        </div>

        {/* Sharp Matte Obsidian Two-Input Entry Terminal (No Glass, No Admin Button) */}
        <form onSubmit={handleSubmit} className="eclipse-slab-box space-y-4 w-full max-w-md mx-auto">
          <span className="eclipse-slab-label">[ ARENA ACCESS TERMINAL ]</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Input 1: Enter Code */}
            <div>
              <label
                htmlFor="home-code-input"
                className="block font-mono text-[11px] tracking-[0.18em] text-[#e6c48a] uppercase mb-1.5"
              >
                &gt; Enter Code
              </label>
              <div className="flex items-center bg-[#030204] border border-[#c69c5d]/65 focus-within:border-[#ff0033] px-3 py-2.5">
                <span className="font-mono text-xs text-[#ff0033] mr-2">A:\&gt;</span>
                <input
                  id="home-code-input"
                  type="text"
                  maxLength={20}
                  autoComplete="off"
                  value={code}
                  onChange={e => {
                    setCode(e.target.value);
                    setLocalError(null);
                  }}
                  placeholder="ENTER CODE"
                  className="w-full bg-transparent font-mono text-sm font-bold text-[#f8efe4] tracking-widest uppercase outline-none"
                />
              </div>
            </div>

            {/* Input 2: Enter Your Name */}
            <div>
              <label
                htmlFor="home-name-input"
                className="block font-mono text-[11px] tracking-[0.18em] text-[#e6c48a] uppercase mb-1.5"
              >
                &gt; Enter Your Name
              </label>
              <div className="flex items-center bg-[#030204] border border-[#c69c5d]/65 focus-within:border-[#ff0033] px-3 py-2.5">
                <span className="font-mono text-xs text-[#c69c5d] mr-2">ID:&gt;</span>
                <input
                  id="home-name-input"
                  type="text"
                  maxLength={24}
                  autoComplete="off"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setLocalError(null);
                  }}
                  placeholder="ORION"
                  className="w-full bg-transparent font-mono text-sm text-[#f8efe4] outline-none"
                />
              </div>
            </div>
          </div>

          {shownError && (
            <div className="py-2 px-3 bg-[#240409] border border-[#ff0033] text-[#ff8599] font-mono text-xs text-center animate-wrong-shake">
              !! {shownError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="eclipse-btn-crimson w-full py-3 px-6 font-display text-2xl tracking-[0.22em] uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'AUTHENTICATING...' : 'JOIN MATCH'}</span>
            {!loading && <span className="text-base">&gt;&gt;</span>}
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundFX.playButtonClick();
                onStartDemo(name || 'Orion');
              }}
              className="eclipse-btn-obsidian py-2 px-3 font-mono text-xs tracking-wider uppercase"
            >
              [SOLO DEMO]
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playButtonClick();
                onOpenProjector();
              }}
              className="eclipse-btn-obsidian py-2 px-3 font-mono text-xs tracking-wider uppercase tabular-nums"
            >
              [PROJECTOR ({leaderboard.total})]
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#c69c5d]/20 text-[11px] font-mono text-[#a3947e]">
            <span>GATE: <strong className="text-[#e6c48a]">SEALED</strong></span>
            <span>ANTI-CHEAT: <strong className="text-[#ff0033]">ARMED</strong></span>
          </div>
        </form>

        <div className="h-2" />
      </div>

      {/* Sharp Matte Settings Modal (Zero Blur, Zero Rounded Corners) */}
      {settingsOpen && (
        <div
          onClick={() => setSettingsOpen(false)}
          className="fixed inset-0 z-50 bg-black/88 flex items-center justify-center p-5"
        >
          <div onClick={e => e.stopPropagation()} className="eclipse-slab-box max-w-sm w-full space-y-4">
            <span className="eclipse-slab-label">[ ARENA SETTINGS ]</span>
            <div className="flex items-center justify-between pt-1">
              <h3 className="font-display text-2xl tracking-[0.18em] text-[#e6c48a] uppercase">
                ARENA LAWS
              </h3>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="font-mono text-sm text-[#cbbba0] hover:text-white px-2 py-0.5 border border-[#c69c5d]/40"
              >
                [X]
              </button>
            </div>
            <GoldDivider />

            <div className="bg-[#030204] border border-[#dc2626]/40 p-3 font-mono text-xs text-gray-300 space-y-1">
              <div className="text-[11px] font-bold text-[#ff0033] uppercase tracking-wider">
                !! CASCADE &amp; ANTI-CHEAT LAWS !!
              </div>
              <p>Climb 60 levels. Wrong answers lock for 5s then drop to Recovery Rooms 1–4. Room 4 miss resets to Level 0. Tab switching, pasting, copying, or AI extensions trigger strikes.</p>
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="eclipse-btn-crimson w-full py-2.5 font-display text-lg uppercase tracking-widest"
            >
              RETURN TO TERMINAL
            </button>
          </div>
        </div>
      )}
    </EclipseStage>
  );
}
