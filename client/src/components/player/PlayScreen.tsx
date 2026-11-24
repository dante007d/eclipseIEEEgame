/**
 * xe2 Player – Play Screen
 * Features:
 *  - 0-60 progress track
 *  - Phase banner (MAIN / ROOM k/4) with darkening bg per depth
 *  - Timer ring with theme-coloured arc
 *  - Question card
 *  - 4 large tap targets (mobile-first, min 56px)
 *  - Live players mini-panel (collapsible)
 *  - Outcome overlay (rise / drop / climb / collapse / finish)
 *  - Cosmetic theme change every 10 levels
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getThemeForLevel, getRoomBg } from '../../theme/levelThemes';
import type { PlayerState, Question, AnswerResult, Transition } from '../../types/game';

import PlayerLivePanel from './PlayerLivePanel';
import OutcomeOverlay from './OutcomeOverlay';

// ─── Mock data for standalone preview ────────────────────────────────────────

const MOCK_PLAYERS: PlayerState[] = [
  { id: '1', name: 'Orion',   level: 18, phase: 'MAIN', room: 0, resets: 0, finished: false, bestLevel: 18 },
  { id: '2', name: 'Verdant', level: 16, phase: 'ROOM', room: 2, resets: 1, finished: false, bestLevel: 16 },
  { id: '3', name: 'Cipher',  level: 15, phase: 'ROOM', room: 4, resets: 0, finished: false, bestLevel: 15 },
  { id: '4', name: 'Nova',    level: 20, phase: 'MAIN', room: 0, resets: 2, finished: false, bestLevel: 22 },
  { id: '5', name: 'Echo',    level: 12, phase: 'ROOM', room: 3, resets: 3, finished: false, bestLevel: 14 },
];

const MOCK_QUESTION: Question = {
  questionToken: 'tok_preview',
  text: 'Which data structure uses LIFO (Last In, First Out) ordering?',
  options: [
    { id: 'A', text: 'Queue' },
    { id: 'B', text: 'Stack' },
    { id: 'C', text: 'Linked List' },
    { id: 'D', text: 'Hash Map' },
  ],
  difficulty: 18,
  topic: 'Data Structures',
  deadlineAt: Date.now() + 45_000,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlayScreenProps {
  /** If undefined, renders with mock data for preview */
  player?: PlayerState;
  question?: Question;
  otherPlayers?: PlayerState[];
  onSubmit?: (optionId: string) => void;
  onLeave?: () => void;
  /** Preview-only: simulate outcome */
  previewTransition?: Transition | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function secsLeft(deadlineAt: number) {
  return Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m < 10 ? '0' : ''}${m}:${ss < 10 ? '0' : ''}${ss}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PlayScreen({
  player: propPlayer,
  question: propQuestion,
  otherPlayers: propOthers,
  onSubmit,
  onLeave,
  previewTransition,
}: PlayScreenProps) {
  const player = propPlayer ?? {
    id: 'preview',
    name: 'You',
    level: 18,
    phase: 'MAIN' as const,
    room: 0,
    resets: 0,
    finished: false,
    bestLevel: 18,
  };
  const question = propQuestion ?? MOCK_QUESTION;
  const others = propOthers ?? MOCK_PLAYERS.filter(p => p.id !== 'preview');

  const theme = getThemeForLevel(player.level);
  const isInRoom = player.phase === 'ROOM';

  // Timer
  const [timeLeft, setTimeLeft] = useState(() => secsLeft(question.deadlineAt));
  useEffect(() => {
    setTimeLeft(secsLeft(question.deadlineAt));
    const interval = setInterval(() => {
      setTimeLeft(secsLeft(question.deadlineAt));
    }, 500);
    return () => clearInterval(interval);
  }, [question.deadlineAt]);

  const totalSec = isInRoom ? 30 : 45;
  const timerFraction = totalSec > 0 ? timeLeft / totalSec : 0;

  // Selected option & result
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [outcome, setOutcome] = useState<Transition | null>(previewTransition ?? null);

  // Reset when question changes
  useEffect(() => {
    setSelected(null);
    setResult(null);
  }, [question.questionToken]);

  const handleSelect = useCallback((optId: string) => {
    if (selected || result) return;
    setSelected(optId);
    onSubmit?.(optId);

    // Preview simulation: pick random outcome
    if (!onSubmit) {
      const isCorrect = optId === 'B'; // mock correct
      const transition: Transition = isCorrect
        ? player.phase === 'MAIN' ? 'ADVANCE' : 'RETURN_TO_MAIN'
        : player.phase === 'MAIN' ? 'ENTER_ROOM' : 'NEXT_ROOM';
      setTimeout(() => {
        setResult({ correct: isCorrect, transition });
        setOutcome(transition);
      }, 500);
    }
  }, [selected, result, onSubmit, player.phase]);

  // dismiss outcome after 2.5 s
  useEffect(() => {
    if (!outcome) return;
    const t = setTimeout(() => setOutcome(null), 2500);
    return () => clearTimeout(t);
  }, [outcome]);

  // bg changes with room depth
  const screenBg = isInRoom
    ? getRoomBg(theme, player.room)
    : theme.bg;

  const displayLevel = player.level + 1; // question is always for next level
  const progressPct = (player.level / 60) * 100;

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ background: screenBg, transition: 'background 0.6s ease' }}
    >
      {/* ── Atmospheric glow behind eclipse ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[80px] pointer-events-none"
        style={{ background: theme.glow, opacity: 0.35 }}
      />

      {/* ── Top HUD ── */}
      <div
        className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2 border-b"
        style={{ borderColor: theme.borderColor + '99' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-sm">👑</span>
          <div>
            <div className="font-cinzel text-xs font-bold text-gray-200 tracking-wider">{player.name}</div>
            <div className="font-mono text-[10px] text-gray-500">
              Resets: {player.resets} · Best: {player.bestLevel}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle player panel"
            onClick={() => setShowPanel(s => !s)}
            className="text-gray-400 hover:text-gray-200 p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
          </button>
          <button
            aria-label="Leave match"
            onClick={onLeave}
            className="text-gray-500 hover:text-gray-300 p-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 0-60 Progress Track ── */}
      <div className="relative z-10 px-4 py-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-cinzel text-[10px] text-gray-500 tracking-wider">LEVEL</span>
          <span className="font-mono text-xs font-bold" style={{ color: theme.accent }}>
            {player.level} / 60
          </span>
          <span className="ml-auto font-cinzel text-[10px] text-gray-500 tracking-wider">
            {theme.name.toUpperCase()}
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full border"
          style={{ background: theme.bgSecondary, borderColor: theme.borderColor }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${theme.accentSecondary}, ${theme.accent})` }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        {/* Level pip markers every 10 */}
        <div className="flex justify-between mt-1 px-0.5">
          {[0, 10, 20, 30, 40, 50, 60].map(n => (
            <span key={n} className="font-mono text-[9px] text-gray-700">{n}</span>
          ))}
        </div>
      </div>

      {/* ── Phase Banner ── */}
      <div className="relative z-10 px-4 py-1.5">
        <div
          className="w-full flex items-center justify-between px-4 py-2 rounded-xl border"
          style={{
            background: isInRoom ? `${theme.accentSecondary}22` : `${theme.accent}18`,
            borderColor: isInRoom ? theme.accentSecondary : theme.accent,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="font-cinzel text-xs font-extrabold tracking-[0.2em] uppercase"
              style={{ color: isInRoom ? theme.timerColor : theme.accent }}
            >
              {isInRoom ? `ROOM ${player.room} / 4` : 'MAIN QUESTION'}
            </span>
            {isInRoom && (
              <span className="font-mono text-[10px] text-red-400">
                {player.room >= 4 ? '⚠️ DANGER' : ''}
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-gray-500">Lvl {displayLevel}</span>
        </div>
      </div>

      {/* ── Live player panel (slide in) ── */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            className="absolute inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PlayerLivePanel
              players={others}
              theme={theme}
              onClose={() => setShowPanel(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Timer Ring + Question ── */}
      <div className="relative z-10 flex flex-col items-center px-4 py-2 flex-1 overflow-y-auto">
        {/* Timer Ring */}
        <div className="relative w-20 h-20 mb-3 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" className="stroke-gray-800" strokeWidth="4" fill="transparent" />
            <circle
              cx="40" cy="40" r="34"
              strokeWidth="4"
              strokeLinecap="round"
              fill="transparent"
              stroke={timerFraction > 0.4 ? theme.timerColor : '#ef4444'}
              strokeDasharray={213.6}
              strokeDashoffset={213.6 * (1 - timerFraction)}
              style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.4s', filter: `drop-shadow(0 0 6px ${theme.timerColor})` }}
            />
          </svg>
          <span className="absolute font-mono text-sm font-bold text-gray-100">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Topic badge */}
        <div
          className="px-3 py-0.5 rounded-full border mb-3 font-cinzel text-[10px] font-bold tracking-wider uppercase"
          style={{ borderColor: theme.borderColor, color: theme.accent, background: theme.bgSecondary }}
        >
          {question.topic} · Difficulty {question.difficulty}
        </div>

        {/* Question card */}
        <div
          className="w-full rounded-2xl border p-4 mb-4 text-center shadow-xl"
          style={{ background: theme.bgSecondary, borderColor: theme.borderColor }}
        >
          <p className="font-body text-sm leading-relaxed text-gray-100">
            {question.text}
          </p>
        </div>

        {/* 4 answer options – large tap targets */}
        <div className="w-full flex flex-col gap-2.5 pb-4">
          {question.options.map(opt => {
            const isSelected = selected === opt.id;
            const isCorrect = result?.correct && isSelected;
            const isWrong = result && isSelected && !result.correct;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={!!selected}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border text-left transition-all min-h-[56px] active:scale-[0.98] disabled:cursor-not-allowed"
                style={{
                  background: isCorrect
                    ? '#14532d'
                    : isWrong
                    ? '#450a0a'
                    : isSelected
                    ? `${theme.accentSecondary}44`
                    : theme.bgSecondary,
                  borderColor: isCorrect
                    ? '#22c55e'
                    : isWrong
                    ? '#ef4444'
                    : isSelected
                    ? theme.accent
                    : theme.borderColor,
                  boxShadow: isSelected
                    ? `0 0 20px ${isCorrect ? 'rgba(34,197,94,0.3)' : isWrong ? 'rgba(239,68,68,0.3)' : theme.glow}`
                    : 'none',
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
                <span className="font-body text-sm text-gray-200 font-medium">{opt.text}</span>
                {isCorrect && <span className="ml-auto text-green-400">✓</span>}
                {isWrong && <span className="ml-auto text-red-400">✗</span>}
              </button>
            );
          })}
        </div>

        {/* Explanation after answer */}
        <AnimatePresence>
          {result?.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full rounded-xl border p-3 mb-4 text-center"
              style={{ borderColor: theme.borderColor, background: theme.bgSecondary }}
            >
              <p className="font-body text-xs text-gray-400 leading-relaxed">{result.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Outcome overlay ── */}
      <AnimatePresence>
        {outcome && (
          <OutcomeOverlay transition={outcome} theme={theme} />
        )}
      </AnimatePresence>
    </div>
  );
}
