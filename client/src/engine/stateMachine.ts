/**
 * TECH DROP – State Machine (pure, no UI, no network)
 *
 * States: MAIN | ROOM_1 | ROOM_2 | ROOM_3 | ROOM_4 | LEVEL_UP | RESET | VICTORY
 * Events: ANSWER_CORRECT | ANSWER_WRONG | TIMEOUT | USE_HINT | TICK
 *
 * Rules (from xe spec):
 *  - Correct MAIN    → LEVEL_UP (or VICTORY if level === 60)
 *  - Wrong  MAIN     → ROOM_1
 *  - Wrong  ROOM_k (k < 4) → ROOM_{k+1}
 *  - Wrong  ROOM_4   → RESET (progress zeroed, attempts kept)
 *  - Correct ROOM_k  → LEVEL_UP (RETURN_MODE config controls same / next)
 *  - Timeout counts as ANSWER_WRONG
 *  - Hint: costs HINT_CONFIG.timePenalty seconds (or score penalty)
 *
 * Effects are values, not function calls – the UI layer interprets them.
 */

import type { ReturnMode } from '@/theme/tokens';
import { TIMER_DEFAULTS, SCORE_CONFIG, HINT_CONFIG } from '@/theme/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameStateName =
  | 'MAIN'
  | 'ROOM_1'
  | 'ROOM_2'
  | 'ROOM_3'
  | 'ROOM_4'
  | 'LEVEL_UP'
  | 'RESET'
  | 'VICTORY';

export type GameEvent =
  | 'ANSWER_CORRECT'
  | 'ANSWER_WRONG'
  | 'TIMEOUT'
  | 'USE_HINT'
  | 'TICK';          // 1-second heartbeat for the timer

export type Effect =
  | { type: 'PLAY_ANIMATION'; name: string }
  | { type: 'PLAY_SOUND';     name: string; pitch?: number }
  | { type: 'SAVE_PROGRESS' }
  | { type: 'SHOW_CONFETTI' }
  | { type: 'SHOW_RESET_SCREEN' }
  | { type: 'SHOW_VICTORY_SCREEN' }
  | { type: 'TIMER_START'; seconds: number }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_ADJUST'; delta: number };   // negative = penalty

export interface GameState {
  /** Current state node. */
  state:        GameStateName;
  /** Current level (1-60). */
  level:        number;
  /** Remaining seconds on the timer for the active question. */
  timerSeconds: number;
  /** Total score accumulated. */
  score:        number;
  /** Consecutive correct MAIN answers for streak bonus. */
  streak:       number;
  /** Number of hints used in the current level. */
  hintsUsed:    number;
  /** Historical attempts (kept even after RESET). */
  totalAttempts: number;
  /** Whether a hint was already used in this question. */
  hintUsedThisQuestion: boolean;
  /** Config: what happens after a room recovery. */
  returnMode:   ReturnMode;
}

export interface TransitionResult {
  nextState: GameState;
  effects:   Effect[];
}

// ─── Room rank helper ─────────────────────────────────────────────────────────

function roomRank(s: GameStateName): number {
  const map: Partial<Record<GameStateName, number>> = {
    MAIN:   0,
    ROOM_1: 1,
    ROOM_2: 2,
    ROOM_3: 3,
    ROOM_4: 4,
  };
  return map[s] ?? -1;
}

function roomIdForRank(rank: number): GameStateName {
  const names: GameStateName[] = ['MAIN', 'ROOM_1', 'ROOM_2', 'ROOM_3', 'ROOM_4'];
  return names[rank] ?? 'MAIN';
}

/** Map state to the room token key for timer defaults. */
function timerKey(s: GameStateName): keyof typeof TIMER_DEFAULTS {
  const map: Record<GameStateName, keyof typeof TIMER_DEFAULTS> = {
    MAIN:    'MAIN',
    ROOM_1:  'BUFFER',
    ROOM_2:  'CACHE',
    ROOM_3:  'SANDBOX',
    ROOM_4:  'VOID',
    LEVEL_UP:'MAIN',
    RESET:   'MAIN',
    VICTORY: 'MAIN',
  };
  return map[s];
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function computeScore(
  state:  GameState,
  isMain: boolean,
): number {
  const base = SCORE_CONFIG.basePerLevel;
  const timeBonus = state.timerSeconds * SCORE_CONFIG.timeBonusPerSecond;
  const streakBonus = isMain
    ? Math.floor(base * state.streak * SCORE_CONFIG.streakBonusMultiplier)
    : 0;
  const multiplier = isMain ? 1 : SCORE_CONFIG.roomRecoveryMultiplier;
  return Math.round((base + timeBonus + streakBonus) * multiplier);
}

// ─── Initial state factory ────────────────────────────────────────────────────

export function createInitialState(
  returnMode: ReturnMode = 'next_level',
): GameState {
  return {
    state:                 'MAIN',
    level:                  1,
    timerSeconds:          TIMER_DEFAULTS.MAIN,
    score:                  0,
    streak:                 0,
    hintsUsed:              0,
    totalAttempts:          0,
    hintUsedThisQuestion:  false,
    returnMode,
  };
}

// ─── Pure transition function ──────────────────────────────────────────────────

/**
 * transition(state, event) → { nextState, effects[] }
 *
 * This is a pure function: same inputs always produce the same output.
 * The UI / audio / persistence layer reads effects[] and acts on them.
 */
export function transition(
  state: GameState,
  event: GameEvent,
): TransitionResult {
  const effects: Effect[] = [];

  // ── TICK: timer countdown ──────────────────────────────────────────────────
  if (event === 'TICK') {
    const newSeconds = Math.max(0, state.timerSeconds - 1);
    if (newSeconds === 0) {
      // Timeout → treat as ANSWER_WRONG
      return transition({ ...state, timerSeconds: 0 }, 'ANSWER_WRONG');
    }
    return {
      nextState: { ...state, timerSeconds: newSeconds },
      effects:   [],
    };
  }

  // ── USE_HINT ───────────────────────────────────────────────────────────────
  if (event === 'USE_HINT') {
    if (state.hintUsedThisQuestion || state.hintsUsed >= HINT_CONFIG.maxPerLevel) {
      // Already used – no-op
      return { nextState: state, effects: [] };
    }
    const penalty = HINT_CONFIG.timePenalty;
    const newSeconds = Math.max(0, state.timerSeconds - penalty);
    effects.push({ type: 'TIMER_ADJUST', delta: -penalty });
    effects.push({ type: 'PLAY_SOUND', name: 'hint', pitch: 1.2 });
    return {
      nextState: {
        ...state,
        timerSeconds:         newSeconds,
        hintsUsed:            state.hintsUsed + 1,
        hintUsedThisQuestion: true,
      },
      effects,
    };
  }

  const rank = roomRank(state.state);
  const isMain = state.state === 'MAIN';

  // ── ANSWER_CORRECT ────────────────────────────────────────────────────────
  if (event === 'ANSWER_CORRECT') {
    const gained = computeScore(state, isMain);
    const newScore = state.score + gained;
    const newAttempts = state.totalAttempts + 1;

    // Level 60 victory
    if (isMain && state.level === 60) {
      effects.push({ type: 'SHOW_CONFETTI' });
      effects.push({ type: 'SHOW_VICTORY_SCREEN' });
      effects.push({ type: 'PLAY_SOUND', name: 'victory', pitch: 1.3 });
      effects.push({ type: 'PLAY_ANIMATION', name: 'rocketLaunch' });
      effects.push({ type: 'SAVE_PROGRESS' });
      return {
        nextState: { ...state, state: 'VICTORY', score: newScore, totalAttempts: newAttempts },
        effects,
      };
    }

    // Advance to next level
    const nextLevel = isMain ? state.level + 1 : (
      state.returnMode === 'next_level' ? state.level + 1 : state.level
    );

    effects.push({ type: 'PLAY_ANIMATION', name: 'squishDrop' });
    effects.push({ type: 'PLAY_SOUND', name: 'correct', pitch: 1.0 + (nextLevel * 0.01) });
    if (isMain) effects.push({ type: 'SHOW_CONFETTI' });
    effects.push({ type: 'SAVE_PROGRESS' });
    effects.push({ type: 'TIMER_START', seconds: TIMER_DEFAULTS.MAIN });

    return {
      nextState: {
        ...state,
        state:                'LEVEL_UP',
        level:                 nextLevel,
        timerSeconds:          TIMER_DEFAULTS.MAIN,
        score:                 newScore,
        streak:                isMain ? state.streak + 1 : state.streak,
        hintsUsed:             0,
        hintUsedThisQuestion:  false,
        totalAttempts:         newAttempts,
      },
      effects,
    };
  }

  // ── ANSWER_WRONG / TIMEOUT ────────────────────────────────────────────────
  if (event === 'ANSWER_WRONG' || event === 'TIMEOUT') {
    const newAttempts = state.totalAttempts + 1;

    // Wrong in ROOM_4 → full RESET
    if (state.state === 'ROOM_4') {
      effects.push({ type: 'PLAY_ANIMATION', name: 'glitchlessBoom' });
      effects.push({ type: 'PLAY_SOUND', name: 'reset', pitch: 0.6 });
      effects.push({ type: 'SHOW_RESET_SCREEN' });
      effects.push({ type: 'SAVE_PROGRESS' });
      return {
        nextState: {
          // Stay in 'RESET' so the UI can show the reset screen;
          // the UI snaps back to MAIN after the animation.
          state:                 'RESET' as GameStateName,
          level:                  1,
          timerSeconds:          TIMER_DEFAULTS.MAIN,
          score:                  0,
          streak:                 0,
          hintsUsed:              0,
          hintUsedThisQuestion:  false,
          returnMode:             state.returnMode,
          totalAttempts:          newAttempts,
        },
        effects,
      };
    }

    // Wrong in MAIN → ROOM_1
    // Wrong in ROOM_k (k < 4) → ROOM_{k+1}
    const nextRank = rank + 1;
    const nextStateName = roomIdForRank(nextRank) as GameStateName;
    const nextTimerKey = timerKey(nextStateName);
    const nextSeconds = TIMER_DEFAULTS[nextTimerKey];

    effects.push({ type: 'PLAY_ANIMATION', name: 'shake' });
    effects.push({ type: 'PLAY_SOUND', name: 'wrong', pitch: 0.8 - (nextRank * 0.1) });
    effects.push({ type: 'TIMER_START', seconds: nextSeconds });

    return {
      nextState: {
        ...state,
        state:                nextStateName,
        timerSeconds:          nextSeconds,
        streak:                0,              // streak broken on wrong
        hintsUsed:             0,
        hintUsedThisQuestion:  false,
        totalAttempts:         newAttempts,
      },
      effects,
    };
  }

  // Fallback – should never happen in valid usage
  return { nextState: state, effects: [] };
}
