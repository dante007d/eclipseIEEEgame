import { useState, useEffect, useRef, useCallback, type ClipboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getThemeForLevel, getRoomBg } from '../../theme/levelThemes';
import type {
  PlayerState,
  Question,
  AnswerResult,
  Transition,
  MatchConfig,
  MatchStatus,
  MatchPulse,
  FeedItem,
} from '../../types/game';
import { CHEAT_TITLES, CHEAT_ROASTS, TIMER_INSULTS, WIN_ART, LOSE_ART } from '../../../../shared/flavor.js';
import { incrementStrikes } from '../../lib/socket';
import { soundFX } from '../../lib/sound';
import EclipseSky from '../EclipseSky';
import PlayerLivePanel from './PlayerLivePanel';
import OutcomeOverlay from './OutcomeOverlay';
import RecoveryRoomTransition from '../screens/RecoveryRoomTransition';
import LevelClearedScreen from '../screens/LevelClearedScreen';

interface PlayScreenProps {
  player: PlayerState;
  question: Question | null;
  otherPlayers: PlayerState[];
  config: MatchConfig;
  matchStatus: MatchStatus;
  connected: boolean;
  rank: number | null;
  rankFlash: { dir: 'up' | 'down'; n: number } | null;
  pulse: MatchPulse;
  globalTimeLeft: number | null;
  lastResult: AnswerResult | null;
  gameOverData: {
    winners?: { junior?: PlayerState | null; senior?: PlayerState | null };
    message?: string;
  } | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSubmit: (questionToken: string, optionId: string) => void;
  onReadyNext: () => void;
  onCheat: (kind: string) => void;
  onSever: () => void;
  onReenter: () => void;
  onLeave: () => void;
}

const AWAY_MS = 1500;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function secsLeft(deadlineAt: number) {
  return Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m < 10 ? '0' : ''}${m}:${ss < 10 ? '0' : ''}${ss}`;
}

function formatClock(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
}

function feedText(f: FeedItem): string {
  switch (f.t) {
    case 'lv': return `${f.n} ASCENDED TO LV ${f.lv}`;
    case 'fall': return `${f.n} DROPPED TO ROOM ${f.room}`;
    case 'room4': return `⚠ ${f.n} ENTERED ROOM 4 (DANGER)`;
    case 'reset': return `💀 ${f.n} COLLAPSED TO LV 0`;
    case 'won': return `🏆 ${f.n} CONQUERED LEVEL 60`;
    case 'dead': return `${f.n} SEVERED THE CYCLE`;
    case 'dq': return `${f.n} WAS DISQUALIFIED`;
    case 'cheat': return `🚨 ${f.n} CAUGHT CHEATING`;
    default: return '';
  }
}

export default function PlayScreen({
  player,
  question,
  otherPlayers,
  config,
  matchStatus,
  connected,
  rank,
  rankFlash,
  pulse,
  globalTimeLeft,
  lastResult,
  gameOverData,
  soundEnabled,
  onToggleSound,
  onSubmit,
  onReadyNext,
  onCheat,
  onSever,
  onReenter,
  onLeave,
}: PlayScreenProps) {
  const theme = getThemeForLevel(player.level);
  const isInRoom = player.phase === 'ROOM';
  const screenBg = isInRoom ? getRoomBg(theme, player.room) : theme.bg;

  // Countdown timer synced to server deadline
  const [timeLeft, setTimeLeft] = useState(() => (question ? secsLeft(question.deadlineAt) : config.mainTimerSec));
  const [insultToast, setInsultToast] = useState<string | null>(null);
  const insultedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!question || matchStatus !== 'live') return;
    setTimeLeft(secsLeft(question.deadlineAt));
    const interval = setInterval(() => {
      const left = secsLeft(question.deadlineAt);
      setTimeLeft(left);
      if (left <= 15 && left > 0 && insultedTokenRef.current !== question.questionToken) {
        insultedTokenRef.current = question.questionToken;
        setInsultToast(pick(TIMER_INSULTS));
        setTimeout(() => setInsultToast(null), 4000);
      }
      if (left > 0 && left <= 5) {
        soundFX.playTick();
      }
    }, 350);
    return () => clearInterval(interval);
  }, [question, matchStatus]);

  const totalSec = isInRoom ? config.roomTimerSec : config.mainTimerSec;
  const timerFraction = totalSec > 0 ? Math.min(1, timeLeft / totalSec) : 0;

  // Answer selection & transition overlays
  const [selected, setSelected] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [confirmSeverModal, setConfirmSeverModal] = useState(false);

  const [activeTransition, setActiveTransition] = useState<{
    transition: Transition;
    roast?: string;
    pointsGained?: number;
    newRoom?: number;
    newLevel?: number;
    isTimeout?: boolean;
    key: number;
  } | null>(null);
  const [showRoomGate, setShowRoomGate] = useState<{ room: number; roast?: string; isTimeout?: boolean } | null>(null);
  const [showLevelCleared, setShowLevelCleared] = useState<{ level: number; pointsGained?: number } | null>(null);

  // Reset selected state whenever a new questionToken arrives
  useEffect(() => {
    setSelected(null);
  }, [question?.questionToken]);

  // Trigger dramatic transition overlays & audio on server answer:result
  const lastResultRef = useRef<AnswerResult | null>(null);
  useEffect(() => {
    if (!lastResult || lastResult === lastResultRef.current) return;
    lastResultRef.current = lastResult;

    const { transition, roast, pointsGained, newRoom, newLevel } = lastResult;
    if (transition === 'ADVANCE') {
      soundFX.playAdvance();
      setShowLevelCleared({ level: newLevel ?? player.level, pointsGained });
    } else if (transition === 'FINISH') {
      soundFX.playVictory();
      setActiveTransition({ transition, pointsGained, key: Date.now() });
    } else if (transition === 'RETURN_TO_MAIN') {
      soundFX.playReturn();
      setActiveTransition({ transition, pointsGained, newLevel, key: Date.now() });
    } else if (transition === 'ENTER_ROOM' || transition === 'NEXT_ROOM') {
      soundFX.playFall(newRoom ?? 1);
      setShowRoomGate({ room: newRoom ?? 1, roast });
    } else if (transition === 'RESET') {
      soundFX.playReset();
      setActiveTransition({ transition, roast, key: Date.now() });
    }
  }, [lastResult, player.level]);

  // Auto-dismiss OutcomeOverlay
  useEffect(() => {
    if (!activeTransition) return;
    const t = setTimeout(() => {
      setActiveTransition(null);
      onReadyNext();
    }, 1800);
    return () => clearTimeout(t);
  }, [activeTransition, onReadyNext]);

  const handleDismissRoomGate = useCallback(() => {
    setShowRoomGate(null);
    onReadyNext();
  }, [onReadyNext]);

  const handleDismissLevelCleared = useCallback(() => {
    setShowLevelCleared(null);
    onReadyNext();
  }, [onReadyNext]);

  const handleSelect = (optId: string) => {
    if (!question || selected || matchStatus !== 'live' || player.status !== 'active') return;
    setSelected(optId);
    onSubmit(question.questionToken, optId);
  };

  // ── Anti-Cheat System (ported from Ouroboros) ────────────────────────────
  const [veiled, setVeiled] = useState(false);
  const [cheatOverlay, setCheatOverlay] = useState<{
    title: string;
    roast: string;
    strike: number;
  } | null>(null);
  const cheatTimerRef = useRef<number | null>(null);
  const armedRef = useRef(false);

  const triggerCheat = useCallback(
    (kind: 'paste' | 'copy' | 'left' | 'screenshot') => {
      const strike = incrementStrikes();
      onCheat(kind);
      try {
        navigator.vibrate?.([200, 80, 200, 80, 400]);
      } catch {
        // unsupported
      }
      if (cheatTimerRef.current) clearTimeout(cheatTimerRef.current);
      setCheatOverlay({
        title: CHEAT_TITLES[kind] || CHEAT_TITLES.left,
        roast: pick(CHEAT_ROASTS[kind] || CHEAT_ROASTS.left),
        strike,
      });
      cheatTimerRef.current = window.setTimeout(() => setCheatOverlay(null), 4500);
    },
    [onCheat]
  );

  useEffect(() => {
    armedRef.current =
      matchStatus === 'live' &&
      player.status === 'active' &&
      !player.finished &&
      !!question &&
      !showRoomGate &&
      !showLevelCleared &&
      !activeTransition;
  }, [matchStatus, player.status, player.finished, question, showRoomGate, showLevelCleared, activeTransition]);

  useEffect(() => {
    let awayAt: number | null = null;

    const onPaste = (e: Event) => {
      e.preventDefault();
      if (armedRef.current) triggerCheat('paste');
    };
    const onCopy = (e: globalThis.ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.setData('text/plain', 'PROJECT ECLIPSE // ANTI-CHEAT LOGGED.');
      if (armedRef.current) triggerCheat('copy');
    };
    const onNoMenu = (e: Event) => {
      if (armedRef.current) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' && armedRef.current) triggerCheat('screenshot');
    };
    const goAway = () => {
      if (!armedRef.current || awayAt !== null) return;
      awayAt = Date.now();
      setVeiled(true);
    };
    const comeBack = () => {
      if (document.visibilityState === 'hidden') return;
      setVeiled(false);
      if (awayAt === null) return;
      const gone = Date.now() - awayAt;
      awayAt = null;
      if (gone >= AWAY_MS && armedRef.current) triggerCheat('left');
    };
    const onVisibility = () => (document.visibilityState === 'hidden' ? goAway() : comeBack());

    document.addEventListener('paste', onPaste, true);
    document.addEventListener('drop', onPaste, true);
    document.addEventListener('copy', onCopy, true);
    document.addEventListener('cut', onCopy, true);
    document.addEventListener('contextmenu', onNoMenu, true);
    document.addEventListener('dragstart', onNoMenu, true);
    document.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', goAway);
    window.addEventListener('focus', comeBack);
    window.addEventListener('pagehide', goAway);

    return () => {
      document.removeEventListener('paste', onPaste, true);
      document.removeEventListener('drop', onPaste, true);
      document.removeEventListener('copy', onCopy, true);
      document.removeEventListener('cut', onCopy, true);
      document.removeEventListener('contextmenu', onNoMenu, true);
      document.removeEventListener('dragstart', onNoMenu, true);
      document.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', goAway);
      window.removeEventListener('focus', comeBack);
      window.removeEventListener('pagehide', goAway);
    };
  }, [triggerCheat]);

  const preventCardCopy = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // ── End / Match Concluded / Disqualified View ─────────────────────────────
  const isEndState =
    player.finished ||
    player.status === 'won' ||
    player.status === 'dead' ||
    player.status === 'disqualified' ||
    matchStatus === 'ended';

  if (isEndState) {
    const isDQ = player.status === 'disqualified';
    const grp = player.group;
    const grpWinner = gameOverData?.winners?.[grp] || null;
    const iAmWinner = !isDQ && (player.finished || player.status === 'won' || (grpWinner && grpWinner.id === player.id));

    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#060709] overflow-y-auto">
        <EclipseSky glowIntensity={iAmWinner ? 'gold' : 'high'} />
        <div className="relative z-10 max-w-md w-full bg-[#0c0910]/90 border border-red-900/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <pre className={`font-mono text-[11px] leading-tight inline-block text-left mb-4 ${iAmWinner ? 'text-amber-300' : 'text-red-500'}`}>
            {iAmWinner ? WIN_ART : LOSE_ART}
          </pre>

          <h2 className={`font-cinzel text-2xl sm:text-3xl font-extrabold tracking-[0.2em] uppercase mb-2 ${iAmWinner ? 'text-amber-300' : 'text-red-500'}`}>
            {isDQ
              ? 'DISQUALIFIED'
              : iAmWinner
              ? 'ASCENSION COMPLETE'
              : matchStatus === 'ended'
              ? 'CYCLE CONCLUDED'
              : 'CYCLE SEVERED'}
          </h2>

          {gameOverData?.message && (
            <p className="font-mono text-xs text-amber-300/90 mb-4">{gameOverData.message}</p>
          )}

          <div className="bg-black/50 border border-red-950/70 rounded-2xl p-4 space-y-2.5 text-xs font-mono text-left mb-6">
            {grpWinner && (
              <div className="flex justify-between border-b border-red-950/40 pb-2 text-amber-300">
                <span>GROUP VICTOR</span>
                <span className="font-bold">{grpWinner.name.toUpperCase()} (LV {grpWinner.level})</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">ASCENDANT</span>
              <span className="text-white font-bold">{player.name.toUpperCase()}</span>
            </div>
            {rank && (
              <div className="flex justify-between">
                <span className="text-gray-400">STANDING</span>
                <span className="text-amber-400 font-bold">#{rank} OF {pulse.total || '--'}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">CURRENT LEVEL</span>
              <span className="text-white font-bold">{player.level} / {config.totalLevels}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">BEST LEVEL</span>
              <span className="text-emerald-400 font-bold">{player.bestLevel} / {config.totalLevels}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">FULL RESETS</span>
              <span className="text-red-400 font-bold">{player.resets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">SCORE</span>
              <span className="text-amber-300 font-bold">{player.score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">CHEAT STRIKES</span>
              <span className={player.cheats > 0 ? 'text-red-500 font-bold' : 'text-gray-300'}>{player.cheats}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {!isDQ && matchStatus !== 'ended' && (
              <button
                onClick={onReenter}
                className="w-full py-3.5 rounded-xl font-cinzel font-bold text-xs tracking-[0.2em] text-white uppercase bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#7f1d1d] border border-red-500/50 hover:brightness-110 transition-all"
              >
                Re-enter the Tower ▶
              </button>
            )}
            <button
              onClick={onLeave}
              className="w-full py-3 rounded-xl font-cinzel text-xs tracking-[0.15em] text-gray-300 uppercase bg-black/60 border border-gray-800 hover:border-gray-600 transition-colors"
            >
              Return to Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayLevel = Math.min(config.totalLevels, player.level + 1);
  const progressPct = (player.level / config.totalLevels) * 100;
  const latestFeed = pulse.feed.length > 0 ? pulse.feed[pulse.feed.length - 1] : null;

  return (
    <div
      className="relative min-h-screen w-full flex flex-col overflow-hidden select-none"
      style={{ background: screenBg, transition: 'background 0.6s ease' }}
    >
      <EclipseSky glowIntensity={isInRoom && player.room >= 3 ? 'high' : 'normal'} subtleCity={true} />

      {/* Atmospheric glow behind eclipse */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[90px] pointer-events-none"
        style={{ background: theme.glow, opacity: 0.35 }}
      />

      {/* ── Top HUD ── */}
      <header
        className="relative z-10 w-full border-b backdrop-blur-md"
        style={{ borderColor: theme.borderColor + 'aa', background: 'rgba(6,7,9,0.78)' }}
      >
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-amber-400 text-sm shrink-0">👑</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-cinzel text-xs sm:text-sm font-bold text-gray-100 tracking-wider truncate">
                    {player.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/60 border border-gray-800 font-mono text-[9px] text-gray-400">
                    YR {player.year}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-gray-400 flex items-center gap-2 flex-wrap">
                  <span>Score: <strong className="text-amber-300">{player.score}</strong></span>
                  <span>· Resets: <strong className="text-red-400">{player.resets}</strong></span>
                  <span>· Best: <strong className="text-gray-200">{player.bestLevel}</strong></span>
                  <span>· Rank: <strong className="text-white">#{rank ?? '--'}</strong>/{pulse.total || '--'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {globalTimeLeft !== null && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-700/70 font-mono text-[11px] text-red-300">
                  <span>⏳</span>
                  <span>{formatClock(globalTimeLeft)}</span>
                </div>
              )}
              <button
                onClick={onToggleSound}
                aria-label="Toggle Sound"
                className={`p-1.5 rounded-lg border transition-colors ${
                  soundEnabled ? 'border-red-500/60 text-red-300 bg-red-950/40' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
              <button
                aria-label="Toggle Live Players"
                onClick={() => setShowPanel(s => !s)}
                className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
              </button>
              <button
                aria-label="Sever or Leave"
                onClick={() => setConfirmSeverModal(true)}
                className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Live Ticker Strip */}
          <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-white/5 font-mono text-[10px] truncate">
            {!connected ? (
              <span className="text-amber-400 animate-pulse">!! SIGNAL LOST — RECONNECTING...</span>
            ) : rankFlash ? (
              <span className={rankFlash.dir === 'up' ? 'text-emerald-400' : 'text-red-400'}>
                {rankFlash.dir === 'up'
                  ? `▲ CLAWED PAST ${rankFlash.n} ASCENDANT${rankFlash.n > 1 ? 'S' : ''}`
                  : `▼ ${rankFlash.n} ASCENDANT${rankFlash.n > 1 ? 'S' : ''} OVERTOOK YOU`}
              </span>
            ) : latestFeed ? (
              <span className="text-gray-400 truncate">&gt; {feedText(latestFeed)}</span>
            ) : (
              <span className="text-gray-500">
                &gt; {pulse.online > 1 ? `${pulse.online - 1} OTHER ASCENDANTS IN THIS TRACK` : 'THE TOWER LISTENS...'}
              </span>
            )}
            {pulse.leader && (
              <span className="text-amber-400/90 shrink-0">
                LEADER: {pulse.leader.n} (LV {pulse.leader.lv})
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Play Container ── */}
      <main className="relative z-10 flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 py-3 overflow-y-auto">
        {/* 0-60 Progress Track */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-cinzel text-[10px] text-gray-400 tracking-wider">LEVEL</span>
            <span className="font-mono text-xs font-bold" style={{ color: theme.accent }}>
              {player.level} / {config.totalLevels}
            </span>
            <span className="ml-auto font-cinzel text-[10px] text-gray-400 tracking-wider">
              {theme.name.toUpperCase()}
            </span>
          </div>
          <div
            className="w-full h-2.5 rounded-full border overflow-hidden"
            style={{ background: theme.bgSecondary, borderColor: theme.borderColor }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${theme.accentSecondary}, ${theme.accent})` }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1 px-0.5 font-mono text-[9px] text-gray-600">
            {[0, 10, 20, 30, 40, 50, 60].map(n => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>

        {/* Phase Banner */}
        <div
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border mb-4"
          style={{
            background: isInRoom ? `${theme.accentSecondary}33` : `${theme.accent}1a`,
            borderColor: isInRoom ? (player.room >= 4 ? '#ef4444' : theme.accentSecondary) : theme.accent,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="font-cinzel text-xs font-extrabold tracking-[0.2em] uppercase"
              style={{ color: isInRoom ? (player.room >= 4 ? '#f87171' : theme.timerColor) : theme.accent }}
            >
              {isInRoom ? `RECOVERY ROOM ${player.room} / ${config.roomsPerLevel}` : 'MAIN QUESTION'}
            </span>
            {isInRoom && player.room >= config.roomsPerLevel && (
              <span className="font-mono text-[10px] text-red-400 font-bold animate-pulse">
                ⚠ DANGER — LAST CHANCE
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-gray-300 font-semibold">Lvl {displayLevel}</span>
        </div>

        {/* Insult Warning Banner on Low Time */}
        <AnimatePresence>
          {insultToast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 px-3 py-2 rounded-xl bg-amber-950/70 border border-amber-500/60 text-amber-200 font-mono text-xs text-center"
            >
              ⏳ {insultToast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer Ring + Question */}
        {question ? (
          <div className="flex flex-col items-center flex-1">
            {/* Timer Ring */}
            <div className="relative w-20 h-20 mb-3 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" className="stroke-gray-800" strokeWidth="4" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="transparent"
                  stroke={timerFraction > 0.35 ? theme.timerColor : '#ef4444'}
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 * (1 - timerFraction)}
                  style={{
                    transition: 'stroke-dashoffset 0.35s linear, stroke 0.3s',
                    filter: `drop-shadow(0 0 6px ${timerFraction > 0.35 ? theme.timerColor : '#ef4444'})`,
                  }}
                />
              </svg>
              <span className={`absolute font-mono text-sm font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-gray-100'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Topic & Difficulty Badge */}
            <div
              className="px-3 py-0.5 rounded-full border mb-3 font-cinzel text-[10px] font-bold tracking-wider uppercase"
              style={{ borderColor: theme.borderColor, color: theme.accent, background: theme.bgSecondary }}
            >
              {question.topic} · Difficulty {question.difficulty}
            </div>

            {/* Question Card with Anti-Cheat Watermark */}
            <div
              onCopy={preventCardCopy}
              className={`relative w-full rounded-2xl border p-5 sm:p-6 mb-5 text-center shadow-xl overflow-hidden ${veiled ? 'veiled-text' : ''}`}
              style={{ background: theme.bgSecondary, borderColor: theme.borderColor }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none opacity-[0.04] font-mono text-[11px] leading-6 tracking-widest -rotate-12 scale-125 select-none"
              >
                {`${player.name.toUpperCase()} // YR${player.year} // `.repeat(18)}
              </div>
              <p className="relative z-10 font-body text-base sm:text-lg leading-relaxed text-gray-100 font-medium">
                {question.text}
              </p>
            </div>

            {/* 4 Answer Options */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
              {question.options.map(opt => {
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    disabled={!!selected || matchStatus !== 'live'}
                    className="w-full flex items-center gap-3.5 px-4 py-4 rounded-xl border text-left transition-all min-h-[60px] active:scale-[0.98] disabled:cursor-not-allowed hover:brightness-110"
                    style={{
                      background: isSelected ? `${theme.accentSecondary}55` : theme.bgSecondary,
                      borderColor: isSelected ? theme.accent : theme.borderColor,
                      boxShadow: isSelected ? `0 0 20px ${theme.glow}` : 'none',
                    }}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center font-cinzel text-xs font-bold shrink-0 border"
                      style={{
                        background: isSelected ? theme.accent : 'transparent',
                        borderColor: isSelected ? theme.accent : theme.borderColor,
                        color: isSelected ? '#fff' : theme.accent,
                      }}
                    >
                      {opt.id}
                    </span>
                    <span className="font-body text-sm sm:text-[15px] text-gray-100 font-medium leading-snug">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center font-mono text-xs text-gray-400">
            Summoning next challenge...
          </div>
        )}
      </main>

      {/* Live Players Slide-out Drawer */}
      <AnimatePresence>
        {showPanel && (
          <PlayerLivePanel
            players={otherPlayers}
            myId={player.id}
            theme={theme}
            onClose={() => setShowPanel(false)}
          />
        )}
      </AnimatePresence>

      {/* Outcome Overlay (RETURN_TO_MAIN, RESET, FINISH) */}
      <AnimatePresence>
        {activeTransition && (
          <OutcomeOverlay
            key={activeTransition.key}
            transition={activeTransition.transition}
            theme={theme}
            roast={activeTransition.roast}
            pointsGained={activeTransition.pointsGained}
            newRoom={activeTransition.newRoom}
            newLevel={activeTransition.newLevel}
            onDismiss={() => {
              setActiveTransition(null);
              onReadyNext();
            }}
          />
        )}
      </AnimatePresence>

      {/* Dedicated Recovery Room Transition Screen */}
      {showRoomGate && (
        <RecoveryRoomTransition
          roomNumber={showRoomGate.room}
          roast={showRoomGate.roast}
          isTimeout={showRoomGate.isTimeout}
          onContinue={handleDismissRoomGate}
        />
      )}

      {/* Dedicated Level Cleared Screen */}
      {showLevelCleared && (
        <LevelClearedScreen
          currentLevel={showLevelCleared.level}
          pointsGained={showLevelCleared.pointsGained}
          onNextLevel={handleDismissLevelCleared}
        />
      )}

      {/* Match Paused Overlay */}
      {matchStatus === 'paused' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#0e0a12] border border-amber-500/60 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-4xl mb-3">⏸</div>
            <h3 className="font-cinzel text-xl font-bold tracking-[0.2em] text-amber-300 uppercase">
              MATCH PAUSED
            </h3>
            <p className="font-body text-xs text-gray-400 mt-2">
              Timers are frozen by the Host. Stand by for resumption.
            </p>
          </div>
        </div>
      )}

      {/* Ouroboros Anti-Cheat Roast Overlay */}
      {cheatOverlay && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 bg-red-950/90 backdrop-blur-sm">
          <div className="max-w-md w-full text-center border-2 border-red-500 bg-[#0c0507] rounded-3xl p-8 shadow-[0_0_60px_rgba(225,29,72,0.7)] animate-snappy-shake">
            <div className="font-cinzel text-2xl sm:text-3xl font-black text-red-500 tracking-wider uppercase mb-3">
              {cheatOverlay.title}
            </div>
            <div className="font-mono text-sm sm:text-base text-amber-300 mb-4 leading-relaxed">
              "{cheatOverlay.roast}"
            </div>
            <div className="font-mono text-xs text-red-300 uppercase tracking-widest animate-pulse">
              STRIKE {cheatOverlay.strike} LOGGED · THE CLOCK DID NOT STOP
            </div>
          </div>
        </div>
      )}

      {/* Confirm Sever / Leave Modal */}
      {confirmSeverModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm"
          onClick={() => setConfirmSeverModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0e0a12] border border-red-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
          >
            <h3 className="font-cinzel text-lg font-bold tracking-wider text-red-400 uppercase mb-2">
              SEVER THE CYCLE?
            </h3>
            <p className="font-body text-xs text-gray-300 leading-relaxed mb-6">
              You are currently at Level <strong className="text-white">{player.level}</strong> with{' '}
              <strong className="text-amber-300">{player.score}</strong> points. Leaving marks your run as severed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmSeverModal(false);
                  onSever();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-cinzel text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Yes, Sever
              </button>
              <button
                onClick={() => setConfirmSeverModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-black/60 border border-gray-700 text-gray-300 hover:text-white font-cinzel text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
