import crypto from 'node:crypto';
import { DEFAULT_CONFIG } from '../../shared/constants.js';

/**
 * Compute target difficulty for the player's current phase & room.
 * Rules:
 * - MAIN at cleared level L asks a question for level L + 1 (difficulty L + 1, capped at totalLevels).
 * - ROOM k uses max(1, round((L + 1) * roomDifficultyFractions[k - 1])), non-increasing across rooms.
 */
export function targetDifficultyFor(level, phase, room, config = DEFAULT_CONFIG) {
  const nextLv = Math.min(config.totalLevels, Math.max(1, level + 1));
  if (phase === 'MAIN' || room <= 0) {
    return nextLv;
  }
  const fractions = config.roomDifficultyFractions || DEFAULT_CONFIG.roomDifficultyFractions;
  const frac = fractions[Math.min(room - 1, fractions.length - 1)] ?? 0.2;
  return Math.max(1, Math.min(nextLv, Math.round(nextLv * frac)));
}

/**
 * Fisher-Yates shuffle returning a new array.
 */
export function shuffle(arr, rng = Math.random) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Select a question from the bank matching targetDifficulty (or nearest available),
 * never repeating seenIds unless the entire playable pool is exhausted, and never
 * picking excludeId back-to-back. Shuffles option order on every delivery and
 * issues a one-time questionToken.
 */
export function selectQuestion({
  bank,
  level,
  phase,
  room,
  seenIds = new Set(),
  excludeId = null,
  config = DEFAULT_CONFIG,
  rng = Math.random,
}) {
  const target = targetDifficultyFor(level, phase, room, config);
  const timerSec = phase === 'MAIN' ? config.mainTimerSec : config.roomTimerSec;

  // Prefer lv >= 1 questions; only fall back to lv 0 if the bank has nothing else.
  const playable = bank.filter(q => q && Array.isArray(q.options) && q.options.length >= 2 && q.lv >= 1);
  const fullPool = playable.length > 0 ? playable : bank;

  let candidates = fullPool.filter(q => !seenIds.has(q.id) && q.id !== excludeId);
  if (candidates.length === 0) {
    // Pool exhausted: allow previously seen questions, still avoiding immediate repeat
    candidates = fullPool.filter(q => q.id !== excludeId);
    if (candidates.length === 0) {
      candidates = fullPool;
    }
  }

  // Exact match first, else nearest available difficulty
  let exact = candidates.filter(q => q.lv === target);
  if (exact.length === 0) {
    let bestDist = Infinity;
    for (const q of candidates) {
      const dist = Math.abs(q.lv - target);
      if (dist < bestDist) bestDist = dist;
    }
    const nearest = candidates.filter(q => Math.abs(q.lv - target) === bestDist);
    // In rooms, prefer lower difficulty if equidistant
    if (phase === 'ROOM') {
      const lowerOrEq = nearest.filter(q => q.lv <= target);
      exact = lowerOrEq.length > 0 ? lowerOrEq : nearest;
    } else {
      exact = nearest;
    }
  }

  const chosen = exact[Math.floor(rng() * exact.length)];
  const labels = ['A', 'B', 'C', 'D'];
  const indexedOptions = chosen.options.slice(0, 4).map((text, idx) => ({
    text,
    isCorrect: idx === chosen.a,
  }));
  const shuffledOptions = shuffle(indexedOptions, rng);

  let correctOptionId = 'A';
  const clientOptions = shuffledOptions.map((opt, idx) => {
    const id = labels[idx];
    if (opt.isCorrect) correctOptionId = id;
    return { id, text: opt.text };
  });

  const questionToken = crypto.randomBytes(12).toString('hex');
  const now = Date.now();

  return {
    questionId: chosen.id,
    correctOptionId,
    questionToken,
    clientQuestion: {
      questionToken,
      id: chosen.id,
      text: chosen.q,
      options: clientOptions,
      difficulty: chosen.lv,
      type: chosen.type || 'TECH',
      topic: chosen.topic || 'General',
      deadlineAt: now + timerSec * 1000,
      phase,
      room,
      targetLevel: Math.min(config.totalLevels, level + 1),
      hintAvailable: true,
    },
  };
}

/**
 * Pure Cascade transition evaluation for a player state.
 * Returns { nextPlayer, transition, pointsGained, correct }.
 */
export function evaluateCascadeAnswer({
  player,
  isCorrect,
  remainingSec = 0,
  config = DEFAULT_CONFIG,
  now = Date.now(),
}) {
  const next = { ...player };
  let transition;
  let pointsGained = 0;
  const safeRemaining = Math.max(0, Math.floor(remainingSec));

  if (next.phase === 'MAIN') {
    if (isCorrect) {
      next.level += 1;
      next.bestLevel = Math.max(next.bestLevel, next.level);
      next.solved += 1;
      next.streak += 1;
      next.mainFailsOnCurrentLevel = 0;
      next.levelUpdateTime = now;

      const base = 100;
      const timeBonus = safeRemaining * 2;
      const streakBonus = Math.floor(base * next.streak * 0.1);
      pointsGained = base + timeBonus + streakBonus;
      next.score += pointsGained;

      if (next.level >= config.totalLevels) {
        next.finished = true;
        next.finishedAt = now;
        next.finishTime = now;
        next.status = 'won';
        transition = 'FINISH';
      } else {
        transition = 'ADVANCE';
      }
    } else {
      next.fails += 1;
      next.streak = 0;
      next.mainFailsOnCurrentLevel = (next.mainFailsOnCurrentLevel || 0) + 1;

      if (
        config.maxMainFailsPerLevel !== null &&
        config.maxMainFailsPerLevel > 0 &&
        next.mainFailsOnCurrentLevel >= config.maxMainFailsPerLevel
      ) {
        next.level = 0;
        next.phase = 'MAIN';
        next.room = 0;
        next.resets += 1;
        next.score = 0;
        next.mainFailsOnCurrentLevel = 0;
        transition = 'RESET';
      } else {
        next.phase = 'ROOM';
        next.room = 1;
        transition = 'ENTER_ROOM';
      }
    }
  } else {
    // Player is in a Recovery Room (ROOM 1..4)
    if (isCorrect) {
      next.solved += 1;
      const base = 100;
      const timeBonus = safeRemaining * 2;
      pointsGained = Math.round((base + timeBonus) * 0.5);
      next.score += pointsGained;

      if (config.returnMode === 'next_level') {
        next.level += 1;
        next.bestLevel = Math.max(next.bestLevel, next.level);
        next.phase = 'MAIN';
        next.room = 0;
        next.mainFailsOnCurrentLevel = 0;
        next.levelUpdateTime = now;

        if (next.level >= config.totalLevels) {
          next.finished = true;
          next.finishedAt = now;
          next.finishTime = now;
          next.status = 'won';
          transition = 'FINISH';
        } else {
          transition = 'RETURN_TO_MAIN';
        }
      } else {
        // Default: same_question mode -> return to MAIN on the SAME level
        next.phase = 'MAIN';
        next.room = 0;
        transition = 'RETURN_TO_MAIN';
      }
    } else {
      next.fails += 1;
      next.streak = 0;
      if (next.room < config.roomsPerLevel) {
        next.room += 1;
        transition = 'NEXT_ROOM';
      } else {
        // Failed Room 4 (final room) -> FULL RESET
        next.level = 0;
        next.phase = 'MAIN';
        next.room = 0;
        next.resets += 1;
        next.score = 0;
        next.mainFailsOnCurrentLevel = 0;
        transition = 'RESET';
      }
    }
  }

  return {
    nextPlayer: next,
    transition,
    pointsGained,
    correct: isCorrect,
  };
}
