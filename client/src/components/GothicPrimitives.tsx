import { type CSSProperties, type ReactNode } from 'react';

export interface WhisperItem {
  id: number;
  text: string;
  side: 'l' | 'r';
  y: number;
}

interface EclipseStageProps {
  backgroundImage: string;
  overlayClassName?: string;
  redPulse?: boolean;
  brightenDoorway?: boolean;
  maxWidthClass?: string;
  squeeze?: number;
  unstable?: boolean;
  globalClockLabel?: string | null;
  whisper?: WhisperItem | null;
  children: ReactNode;
}

/**
 * Cross-platform Ouroboros-infused Tactical Obsidian Stage:
 * - Preserves full-bleed background eclipse artwork around the outside
 * - Adds Ouroboros scanlines, top drip strip, live telemetry tickers,
 *   closing chamber squeeze walls (--squeeze 0..1), and margin whispers
 * - Zero frosted glass or rounded bubbles
 */
export function EclipseStage({
  backgroundImage,
  overlayClassName = 'bg-gradient-to-b from-black/45 via-black/60 to-black/88',
  redPulse: _redPulse = false,
  brightenDoorway = false,
  maxWidthClass = 'max-w-3xl',
  squeeze = 0.12,
  unstable = false,
  globalClockLabel = null,
  whisper = null,
  children,
}: EclipseStageProps) {
  const stageStyle = { '--squeeze': Math.min(1, Math.max(0, squeeze)) } as CSSProperties;

  return (
    <div
      className="relative min-h-screen w-full bg-[#050305] flex flex-col overflow-x-hidden"
      style={stageStyle}
    >
      {/* Full-bleed edge-to-edge background artwork */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-500 ${
          brightenDoorway ? 'brightness-105' : ''
        }`}
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Slow subtle low-contrast eclipse aura drift (no red color wash) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none animate-aura-drift bg-[radial-gradient(circle_at_50%_22%,rgba(198,156,93,0.08),transparent_62%)]"
      />

      {/* Dark readability scrim */}
      <div aria-hidden="true" className={`fixed inset-0 pointer-events-none transition-colors duration-500 ${overlayClassName}`} />

      {/* Ouroboros CRT Scanlines & Closing Chamber Frame (neutral black/gold, no red filter) */}
      <div aria-hidden="true" className="eclipse-scanlines" />
      <div aria-hidden="true" className="eclipse-pressure">
        <div className="eclipse-vignette" />
        <i className="eclipse-wall eclipse-wall-t" />
        <i className="eclipse-wall eclipse-wall-b" />
        <i className="eclipse-wall eclipse-wall-l" />
        <i className="eclipse-wall eclipse-wall-r" />
      </div>

      {/* Whisper in chamber gutter behind cards */}
      {whisper && (
        <div
          key={whisper.id}
          aria-hidden="true"
          className={`eclipse-whisper ${whisper.side === 'l' ? 'left-3 sm:left-8 text-left' : 'right-3 sm:right-8 text-right'}`}
          style={{ top: `${whisper.y}%` }}
        >
          {whisper.text}
        </div>
      )}

      {/* Top Ouroboros Telemetry Ticker */}
      <div className="eclipse-ticker shrink-0">
        <div className={`eclipse-ttag ${globalClockLabel ? 'eclipse-ttag-blood' : 'eclipse-ttag-gold'}`}>
          {globalClockLabel ? `CYCLE ENDS ${globalClockLabel}` : 'SYS'}
        </div>
        <div className="eclipse-tscroll">
          --- PROJECT ECLIPSE // THE CYCLE IS FEEDING --- SIGNAL INTEGRITY: COLLAPSING --- YOU HAVE BEEN HERE BEFORE AND YOU WILL COME HERE AGAIN ---
        </div>
      </div>

      {/* Foreground Tactical Stage */}
      <div
        className={`relative z-10 flex-1 flex flex-col w-full ${maxWidthClass} mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-5 screen-enter ${
          unstable ? 'animate-unstable' : ''
        }`}
      >
        {children}
      </div>

      {/* Bottom Ouroboros Telemetry Ticker */}
      <div className="eclipse-ticker eclipse-ticker-bot shrink-0">
        <div className="eclipse-ttag eclipse-ttag-violet">oo</div>
        <div className="eclipse-tscroll">
          ### IN CAUDA VENENUM ### THE ECLIPSE REMEMBERS EVERY MISS ### NO EXTERNAL TOOLS OR AI ASSISTANTS PERMITTED ###
        </div>
      </div>
    </div>
  );
}

export const PortraitStage = EclipseStage;

/** Crisp Antique Gold Horizontal Tactical Rule */
export function GoldDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#c69c5d]/75" />
      <span className="w-2 h-2 bg-[#c69c5d]" />
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#c69c5d]/75" />
    </div>
  );
}

/** 1. Top Player Bar (Solid Matte Obsidian Slab, Zero Glass / Zero Rounded Corners) */
export function PlayerTopBar({
  name,
  level,
  room,
  resets,
  rightSlot,
}: {
  name: string;
  level: number;
  room: number;
  resets: number;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="gothic-panel px-3.5 sm:px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 bg-[#14090b] border border-[#c69c5d] flex items-center justify-center shrink-0 font-mono text-xs font-bold text-[#e6c48a]">
          ID
        </div>
        <span className="font-display text-xl sm:text-2xl text-[#f3ece0] tracking-wider uppercase truncate leading-none">
          {name}
        </span>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5 font-mono text-xs text-[#cbbba0] tabular-nums shrink-0">
        <span className="border-l border-[#c69c5d]/35 pl-2.5">
          LV <strong className="text-[#e6c48a]">{level}</strong>
        </span>
        <span className="border-l border-[#c69c5d]/35 pl-2.5">
          RM <strong className={room > 0 ? 'text-[#ff0033]' : 'text-white'}>{room}</strong>
        </span>
        <span className="border-l border-[#c69c5d]/35 pl-2.5">
          RST <strong className="text-white">{resets}</strong>
        </span>
        {rightSlot}
      </div>
    </div>
  );
}

/** 2. Level Progress Track: 60 crisp square telemetry markers */
export function LevelProgressPath({
  level,
  total = 60,
}: {
  level: number;
  total?: number;
}) {
  const currentStep = Math.min(total, level + 1);

  return (
    <div className="flex flex-col items-center w-full py-0.5">
      <div className="flex items-center justify-between w-full mb-1 px-0.5">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#cbbba0] uppercase">
          ASCENSION TRACK
        </span>
        <span className="font-mono text-xs font-bold text-[#e6c48a] tabular-nums">
          CHAMBER {level} / {total}
        </span>
      </div>

      <div
        className="w-full flex items-center gap-[2px] px-1.5 py-1.5 bg-[#050305] border border-[#c69c5d]/45"
        role="progressbar"
        aria-valuenow={level}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Level ${level} of ${total}`}
      >
        {Array.from({ length: total }, (_, idx) => {
          const step = idx + 1;
          const isCompleted = step <= level;
          const isCurrent = step === currentStep;
          const isMilestone = step % 10 === 0;

          return (
            <div
              key={step}
              title={`Level ${step}`}
              className={`flex-1 transition-all duration-200 ${
                isCurrent
                  ? 'h-3 bg-[#ff0033] shadow-[0_0_8px_rgba(255,0,51,0.85)]'
                  : isCompleted
                  ? 'h-2 bg-[#c69c5d]'
                  : isMilestone
                  ? 'h-2 bg-[#c69c5d]/35'
                  : 'h-1.5 bg-white/10'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

/** 6. Recovery Depth Markers: "ROOM X / 4" with crisp square danger nodes */
export function RoomDepthIndicator({
  room,
  totalRooms = 4,
}: {
  room: number;
  totalRooms?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="font-mono text-xs font-bold tracking-[0.22em] text-[#f3ece0] uppercase tabular-nums">
        ROOM {room} / {totalRooms}
      </div>
      <div className="flex items-center justify-center w-52">
        {Array.from({ length: totalRooms }).map((_, idx) => {
          const rNum = idx + 1;
          const isCurrent = rNum === room;
          const isPassed = rNum < room;
          return (
            <div key={rNum} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-3.5 h-3.5 border transition-all duration-200 ${
                  isCurrent
                    ? 'bg-[#ff0033] border-white shadow-[0_0_12px_rgba(255,0,51,0.95)] scale-110'
                    : isPassed
                    ? 'bg-[#450a0a] border-[#dc2626]'
                    : 'bg-[#070407] border-[#c69c5d]/65'
                }`}
              />
              {idx < totalRooms - 1 && (
                <div
                  className={`h-[1px] flex-1 ${
                    rNum < room ? 'bg-[#ff0033]' : 'bg-[#c69c5d]/40'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 3. Ouroboros Segmented Countdown Bar + Tactical Digital Readout (Zero Glass Bubbles) */
export function EclipseTimerRing({
  seconds,
  total,
  variant = 'main',
}: {
  seconds: number;
  total: number;
  variant?: 'main' | 'recovery';
}) {
  const frac = total > 0 ? Math.min(1, Math.max(0, seconds / total)) : 0;
  const isWarning = seconds > 0 && seconds <= 10;
  const isTense = variant === 'recovery' || frac <= 0.5;
  const fillBg = isWarning ? '#ff0033' : isTense ? '#d97706' : '#c69c5d';

  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  const formatted = `${mm < 10 ? '0' : ''}${mm}:${ss < 10 ? '0' : ''}${ss}`;

  return (
    <div className="w-full gothic-panel px-3.5 py-2.5 flex items-center gap-3">
      <div className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-[#cbbba0] uppercase">
        {variant === 'recovery' ? 'R-CLOCK' : 'T-CLOCK'}
      </div>
      <div className="flex-1 eclipse-clock-bar">
        <div
          className="eclipse-clock-fill"
          style={{
            transform: `scaleX(${frac})`,
            backgroundColor: fillBg,
          }}
        />
      </div>
      <div
        className={`shrink-0 font-display text-2xl sm:text-3xl leading-none tabular-nums min-w-[4.5ch] text-right ${
          isWarning
            ? 'text-[#ff0033] animate-timer-pulse drop-shadow-[0_0_8px_rgba(255,0,51,0.85)]'
            : variant === 'recovery'
            ? 'text-amber-400'
            : 'text-[#e6c48a]'
        }`}
      >
        {formatted}
      </div>
    </div>
  );
}

/** 7. Sharp Terminal Navigation Dock (Players | Standings | Menu & Audio) */
export function BottomNavDock({
  onPlayers,
  onLeaderboard,
  onInfo,
  activeTab,
}: {
  onPlayers: () => void;
  onLeaderboard: () => void;
  onInfo: () => void;
  activeTab?: 'players' | 'leaderboard' | 'info' | null;
}) {
  return (
    <div className="gothic-panel grid grid-cols-3 divide-x divide-[#c69c5d]/35">
      <button
        type="button"
        onClick={onPlayers}
        aria-label="Live Players"
        className={`py-2.5 flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
          activeTab === 'players' ? 'bg-[#7f0d16] text-white' : 'text-[#d9c39e] hover:bg-[#191015] hover:text-white'
        }`}
      >
        <span>[P]</span>
        <span>Players</span>
      </button>
      <button
        type="button"
        onClick={onLeaderboard}
        aria-label="Standings"
        className={`py-2.5 flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
          activeTab === 'leaderboard' ? 'bg-[#7f0d16] text-white' : 'text-[#d9c39e] hover:bg-[#191015] hover:text-white'
        }`}
      >
        <span>[#]</span>
        <span>Standings</span>
      </button>
      <button
        type="button"
        onClick={onInfo}
        aria-label="Menu & Audio Controls"
        className={`py-2.5 flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
          activeTab === 'info' ? 'bg-[#7f0d16] text-white' : 'text-[#d9c39e] hover:bg-[#191015] hover:text-white'
        }`}
      >
        <span>[=]</span>
        <span>Menu</span>
      </button>
    </div>
  );
}
