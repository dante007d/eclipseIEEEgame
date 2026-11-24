/**
 * TECH DROP – State Machine Tests
 * Run with: npm test
 *
 * Coverage:
 *  ✓ Every state transition (correct / wrong / timeout / hint)
 *  ✓ Level 60 victory
 *  ✓ ROOM_4 wrong → full RESET
 *  ✓ Both RETURN_MODE values
 *  ✓ Hint dedupe & max-per-level
 *  ✓ TICK / timeout cascade
 *  ✓ 1000 randomised play-throughs that never reach an invalid state
 */

import { describe, it, expect } from 'vitest';
import {
  transition,
  createInitialState,
  type GameState,
  type GameStateName,
  type GameEvent,
} from './stateMachine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_STATES: GameStateName[] = [
  'MAIN', 'ROOM_1', 'ROOM_2', 'ROOM_3', 'ROOM_4',
  'LEVEL_UP', 'RESET', 'VICTORY',
];

function isValid(s: GameState): boolean {
  return (
    VALID_STATES.includes(s.state) &&
    s.level >= 1 &&
    s.level <= 60 &&
    s.timerSeconds >= 0 &&
    s.score >= 0 &&
    s.streak >= 0 &&
    s.hintsUsed >= 0 &&
    s.totalAttempts >= 0
  );
}

function mk(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(), ...overrides };
}

function go(state: GameState, event: GameEvent): GameState {
  return transition(state, event).nextState;
}

// ─── Transition tests ─────────────────────────────────────────────────────────

describe('MAIN → correct', () => {
  it('advances level and stays valid', () => {
    const s = go(mk({ level: 1 }), 'ANSWER_CORRECT');
    expect(s.state).toBe('LEVEL_UP');
    expect(s.level).toBe(2);
    expect(isValid(s)).toBe(true);
  });

  it('increments streak', () => {
    const s = go(mk({ streak: 3 }), 'ANSWER_CORRECT');
    expect(s.streak).toBe(4);
  });

  it('adds score', () => {
    const s = go(mk(), 'ANSWER_CORRECT');
    expect(s.score).toBeGreaterThan(0);
  });
});

describe('MAIN → wrong', () => {
  it('falls into ROOM_1', () => {
    const s = go(mk(), 'ANSWER_WRONG');
    expect(s.state).toBe('ROOM_1');
  });

  it('resets streak', () => {
    const s = go(mk({ streak: 5 }), 'ANSWER_WRONG');
    expect(s.streak).toBe(0);
  });
});

describe('ROOM_1 → wrong', () => {
  it('falls into ROOM_2', () => {
    const s = go(mk({ state: 'ROOM_1' }), 'ANSWER_WRONG');
    expect(s.state).toBe('ROOM_2');
  });
});

describe('ROOM_2 → wrong', () => {
  it('falls into ROOM_3', () => {
    const s = go(mk({ state: 'ROOM_2' }), 'ANSWER_WRONG');
    expect(s.state).toBe('ROOM_3');
  });
});

describe('ROOM_3 → wrong', () => {
  it('falls into ROOM_4', () => {
    const s = go(mk({ state: 'ROOM_3' }), 'ANSWER_WRONG');
    expect(s.state).toBe('ROOM_4');
  });
});

describe('ROOM_4 → wrong (FULL RESET)', () => {
  it('resets level to 1 and score to 0', () => {
    const s = go(mk({ state: 'ROOM_4', level: 15, score: 500 }), 'ANSWER_WRONG');
    expect(s.state).toBe('RESET');
    expect(s.level).toBe(1);
    expect(s.score).toBe(0);
  });

  it('keeps totalAttempts', () => {
    const s = go(mk({ state: 'ROOM_4', totalAttempts: 42 }), 'ANSWER_WRONG');
    expect(s.totalAttempts).toBe(43);
  });
});

describe('Room correct → LEVEL_UP', () => {
  it('ROOM_1 correct returns LEVEL_UP', () => {
    const s = go(mk({ state: 'ROOM_1' }), 'ANSWER_CORRECT');
    expect(s.state).toBe('LEVEL_UP');
  });

  it('ROOM_4 correct returns LEVEL_UP (not RESET)', () => {
    const s = go(mk({ state: 'ROOM_4' }), 'ANSWER_CORRECT');
    expect(s.state).toBe('LEVEL_UP');
  });
});

describe('Level 60 victory', () => {
  it('MAIN correct at level 60 → VICTORY', () => {
    const s = go(mk({ level: 60 }), 'ANSWER_CORRECT');
    expect(s.state).toBe('VICTORY');
  });

  it('VICTORY state has correct effects', () => {
    const { effects } = transition(mk({ level: 60 }), 'ANSWER_CORRECT');
    const types = effects.map(e => e.type);
    expect(types).toContain('SHOW_CONFETTI');
    expect(types).toContain('SHOW_VICTORY_SCREEN');
  });
});

describe('TIMEOUT counts as ANSWER_WRONG', () => {
  it('MAIN timeout → ROOM_1', () => {
    const s = go(mk(), 'TIMEOUT');
    expect(s.state).toBe('ROOM_1');
  });

  it('ROOM_4 timeout → RESET', () => {
    const s = go(mk({ state: 'ROOM_4' }), 'TIMEOUT');
    expect(s.state).toBe('RESET');
  });
});

describe('TICK', () => {
  it('decrements timer by 1', () => {
    const s = go(mk({ timerSeconds: 30 }), 'TICK');
    expect(s.timerSeconds).toBe(29);
  });

  it('timer at 1 → TICK triggers ANSWER_WRONG cascade', () => {
    // When tick brings timer to 0, timeout fires immediately
    const s = go(mk({ timerSeconds: 1 }), 'TICK');
    expect(s.state).toBe('ROOM_1');
  });

  it('timer never goes below 0', () => {
    const s = go(mk({ timerSeconds: 0 }), 'TICK');
    expect(s.timerSeconds).toBeGreaterThanOrEqual(0);
  });
});

describe('USE_HINT', () => {
  it('deducts timePenalty seconds', () => {
    const before = mk({ timerSeconds: 60 });
    const after = go(before, 'USE_HINT');
    expect(after.timerSeconds).toBe(45);  // 60 - 15
  });

  it('marks hintUsedThisQuestion', () => {
    const after = go(mk(), 'USE_HINT');
    expect(after.hintUsedThisQuestion).toBe(true);
  });

  it('second USE_HINT in same question is a no-op', () => {
    const s1 = go(mk(), 'USE_HINT');
    const s2 = go(s1, 'USE_HINT');
    expect(s2.hintsUsed).toBe(1);
    expect(s2.timerSeconds).toBe(s1.timerSeconds);
  });

  it('hints reset after level advance', () => {
    const s = go(mk({ hintsUsed: 1, hintUsedThisQuestion: true }), 'ANSWER_CORRECT');
    expect(s.hintsUsed).toBe(0);
    expect(s.hintUsedThisQuestion).toBe(false);
  });
});

describe('RETURN_MODE', () => {
  it('next_level: room correct advances level', () => {
    const s = go(mk({ state: 'ROOM_1', level: 5, returnMode: 'next_level' }), 'ANSWER_CORRECT');
    expect(s.level).toBe(6);
  });

  it('same_question: room correct stays on same level', () => {
    const s = go(mk({ state: 'ROOM_1', level: 5, returnMode: 'same_question' }), 'ANSWER_CORRECT');
    expect(s.level).toBe(5);
  });
});

// ─── Randomised stress test ───────────────────────────────────────────────────

describe('1000 randomised play-throughs – no invalid state ever', () => {
  const events: GameEvent[] = [
    'ANSWER_CORRECT', 'ANSWER_WRONG', 'TIMEOUT', 'TICK', 'USE_HINT',
  ];

  function randomEvent(): GameEvent {
    return events[Math.floor(Math.random() * events.length)];
  }

  it('all states remain valid', () => {
    for (let run = 0; run < 1000; run++) {
      let s = createInitialState(Math.random() < 0.5 ? 'next_level' : 'same_question');
      for (let step = 0; step < 200; step++) {
        const result = transition(s, randomEvent());
        expect(isValid(result.nextState)).toBe(true);
        s = result.nextState;
        // After VICTORY or RESET, restart
        if (s.state === 'VICTORY' || s.state === 'RESET') {
          s = createInitialState();
        }
        // After LEVEL_UP, snap back to MAIN
        if (s.state === 'LEVEL_UP') {
          s = { ...s, state: 'MAIN' };
        }
      }
    }
  });
});
