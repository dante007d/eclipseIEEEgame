/**
 * NOTE: This is a front-end-only gate and not real security.
 * Validates team credentials locally per the xe3 specification.
 */

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GateTeam {
  name: string;
  code: string;
}

export interface GateConfig {
  mode: 'list' | 'any';
  TEAMS: GateTeam[];
}

export const GATE_CONFIG: GateConfig = {
  mode: 'list', // "list" = check against TEAMS below, "any" = accept any non-empty name + code
  TEAMS: [
    { name: 'Team Alpha', code: 'ALPHA123' },
    { name: 'Team Beta',  code: 'BETA456' },
    { name: 'Orion',      code: 'ECLIPSE2026' },
    { name: 'Verdant',    code: 'ASCEND77' },
    { name: 'Cipher',     code: 'CIPHER99' },
  ],
};

const SESSION_KEY = 'eclipse_team_session';

export function getGateSession(): { teamName: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setGateSession(teamName: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ teamName }));
  } catch {
    // sessionStorage unavailable
  }
}

export function clearGateSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

interface EntryGateProps {
  onSuccess: (teamName: string) => void;
}

export default function EntryGate({ onSuccess }: EntryGateProps) {
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const teamInputRef = useRef<HTMLInputElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);

  // Auto-focus first input on mount
  useEffect(() => {
    teamInputRef.current?.focus();
  }, []);

  // Trap focus inside gate while open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !gateRef.current) return;
      const focusable = gateRef.current.querySelectorAll<HTMLElement>(
        'input, button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = teamName.trim();
    const trimmedCode = teamCode;

    // Inline validation for empty fields
    if (!trimmedName && !trimmedCode) {
      setErrorMsg('Team name and code are required');
      triggerShake();
      return;
    }
    if (!trimmedName) {
      setErrorMsg('Team name is required');
      triggerShake();
      return;
    }
    if (!trimmedCode) {
      setErrorMsg('Team code is required');
      triggerShake();
      return;
    }

    // Validate credentials against GATE_CONFIG
    let matchedName: string | null = null;
    if (GATE_CONFIG.mode === 'any') {
      matchedName = trimmedName;
    } else {
      const match = GATE_CONFIG.TEAMS.find(
        (t) =>
          t.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
          t.code === trimmedCode
      );
      if (match) {
        matchedName = match.name;
      }
    }

    if (!matchedName) {
      setErrorMsg('Team name or code is incorrect');
      triggerShake();
      return;
    }

    // Success flow: physical button press → bold split-curtain wipe transition
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsWiping(true);
      setGateSession(matchedName!);

      // Complete transition into the main site after color-block sweep
      setTimeout(() => {
        onSuccess(matchedName!);
      }, 750);
    }, 400);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 420);
  };

  return (
    <div
      ref={gateRef}
      role="dialog"
      aria-modal="true"
      aria-label="Tournament Entry Gate"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#F5F2EB] overflow-hidden"
    >
      {/* Background Graphic Grid with Brutalist Typography Watermark */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 border-[8px] border-[#111111]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(#111111 1.5px, transparent 1.5px), linear-gradient(90deg, #111111 1.5px, transparent 1.5px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="font-display font-black text-[22vw] text-[#111111]/[0.03] select-none leading-none tracking-tighter uppercase">
          ECLIPSE
        </div>
      </div>

      {/* ── THE ACCESS PASS / TICKET CARD ── */}
      <div
        className={`relative w-full max-w-md bg-[#FFFFFF] border-[3px] border-[#111111] shadow-[10px_10px_0_#111111] z-10 transition-transform ${
          isShaking ? 'animate-snappy-shake' : ''
        }`}
      >
        {/* Ticket Header & Perforations */}
        <div className="bg-[#111111] text-[#FFFFFF] px-6 py-4 flex items-center justify-between border-b-[3px] border-[#111111]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#CCFF00] inline-block" />
            <span className="font-mono text-xs font-bold tracking-widest uppercase">
              OFFICIAL ENTRY PASS
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-widest text-[#CCFF00]">
            NO. 60-LEVEL
          </span>
        </div>

        {/* Barcode Strip Graphic */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between border-b-2 border-dashed border-[#111111]/30">
          <div className="flex gap-1 h-6 items-center">
            {[4, 2, 6, 1, 3, 5, 2, 8, 3, 2, 5, 1, 4, 7, 2, 3, 6, 2, 4, 1].map((w, i) => (
              <div
                key={i}
                className="bg-[#111111] h-full"
                style={{ width: `${w * 1.5}px` }}
              />
            ))}
          </div>
          <span className="font-mono text-[11px] font-bold text-[#111111]">
            AUTH-GATE // V3
          </span>
        </div>

        {/* Gate Body: EXACTLY site name, 2 inputs, 1 join button */}
        <div className="p-6 sm:p-8">
          {/* Site Name / Heading */}
          <div className="mb-6">
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-[#111111] uppercase leading-none">
              PROJECT ECLIPSE
            </h1>
            <p className="font-mono text-xs font-bold text-[#FF2A14] tracking-widest uppercase mt-1">
              THE ASCENSION QUIZ
            </p>
          </div>

          {/* Inline Error Message */}
          <div aria-live="polite" className="min-h-[28px] mb-4">
            {errorMsg && (
              <div className="py-2 px-3 bg-[#FF2A14] text-[#FFFFFF] border-2 border-[#111111] font-mono text-xs font-bold flex items-center gap-2">
                <span>[!]</span>
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Input 1: Team Name */}
            <div>
              <label
                htmlFor="gate-team-name"
                className="block font-mono text-xs font-bold tracking-wider text-[#111111] uppercase mb-1.5"
              >
                TEAM NAME
              </label>
              <input
                id="gate-team-name"
                ref={teamInputRef}
                autoFocus
                type="text"
                value={teamName}
                onChange={(e) => {
                  setTeamName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. Team Alpha"
                autoComplete="off"
                className="w-full h-12 px-4 bg-[#F5F2EB] border-[3px] border-[#111111] font-mono text-sm font-bold text-[#111111] outline-none focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#CCFF00] shadow-[3px_3px_0_#111111] transition-all placeholder:text-[#777570] pointer-events-auto cursor-text"
              />
            </div>

            {/* Input 2: Team Code */}
            <div>
              <label
                htmlFor="gate-team-code"
                className="block font-mono text-xs font-bold tracking-wider text-[#111111] uppercase mb-1.5"
              >
                TEAM CODE
              </label>
              <div className="relative flex items-center">
                <input
                  id="gate-team-code"
                  type={showCode ? 'text' : 'password'}
                  value={teamCode}
                  onChange={(e) => {
                    setTeamCode(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Enter secret code"
                  autoComplete="current-password"
                  className="w-full h-12 pl-4 pr-20 bg-[#F5F2EB] border-[3px] border-[#111111] font-mono text-sm font-bold text-[#111111] outline-none focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#CCFF00] shadow-[3px_3px_0_#111111] transition-all placeholder:text-[#777570] pointer-events-auto cursor-text"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  aria-label={showCode ? 'Hide code' : 'Show code'}
                  className="absolute right-2 px-2.5 py-1 text-[11px] font-mono font-bold bg-[#111111] text-[#FFFFFF] hover:bg-[#CCFF00] hover:text-[#111111] transition-colors"
                >
                  {showCode ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Demo Credential Cue (Clickable helper) */}
            <div
              onClick={() => {
                setTeamName('Team Alpha');
                setTeamCode('ALPHA123');
                if (errorMsg) setErrorMsg(null);
              }}
              title="Click to auto-fill demo credentials"
              className="text-[10px] font-mono text-[#777570] border border-dashed border-[#111111]/40 p-2 cursor-pointer hover:bg-[#CCFF00]/20 hover:border-[#111111] transition-colors flex items-center justify-between"
            >
              <span>
                PASS: <strong className="text-[#111111]">Team Alpha</strong> // CODE:{' '}
                <strong className="text-[#111111]">ALPHA123</strong>
              </span>
              <span className="text-[9px] font-bold bg-[#111111] text-[#CCFF00] px-1.5 py-0.5">
                AUTO-FILL
              </span>
            </div>

            {/* One Button: Join */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#CCFF00] hover:bg-[#b8e600] text-[#111111] font-display font-black text-lg tracking-wider uppercase btn-press flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-3 border-[#111111] border-t-transparent rounded-full animate-spin" />
                  <span>CHECKING...</span>
                </>
              ) : (
                <span>JOIN [→]</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── BOLD COLOR-BLOCK SWEEP TRANSITION OVERLAY ── */}
      <AnimatePresence>
        {isWiping && (
          <div className="fixed inset-0 z-[10000] pointer-events-none flex flex-col sm:flex-row">
            {/* Split Panel Left / Top */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '-100%' }}
              transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
              className="flex-1 bg-[#111111] border-r-4 border-[#CCFF00] flex items-center justify-center p-8"
            >
              <span className="font-display font-black text-5xl text-[#CCFF00] uppercase tracking-tighter">
                ACCESS
              </span>
            </motion.div>
            {/* Split Panel Right / Bottom */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
              className="flex-1 bg-[#CCFF00] border-l-4 border-[#111111] flex items-center justify-center p-8"
            >
              <span className="font-display font-black text-5xl text-[#111111] uppercase tracking-tighter">
                GRANTED
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
