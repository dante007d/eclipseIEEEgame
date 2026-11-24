# TECH DROP – How the Game Rules Work

## Concept

TECH DROP is a 60-level college tech-hunt where every level has **5 questions**:
one MAIN question and four progressively easier ROOM questions (R1–R4).

## The Cascade (Fall-Down) Mechanic

```
MAIN (hardest)
  ↓ wrong
ROOM 1 – BUFFER  (lime)
  ↓ wrong
ROOM 2 – CACHE   (tangerine)
  ↓ wrong
ROOM 3 – SANDBOX (pink)
  ↓ wrong
ROOM 4 – VOID    (violet)
  ↓ wrong → FULL RESET 💀
```

| Event | Result |
|---|---|
| Correct on MAIN | Advance to level + 1 |
| Correct on any ROOM | Return to main level |
| Wrong on MAIN | Fall into Room 1 |
| Wrong on Room k (k < 4) | Fall into Room k+1 |
| Wrong on Room 4 | **Full reset** – back to level 1, score zeroed |
| Level 60 correct | 🎉 Victory! |
| Timeout | Same as a wrong answer |

## Timers

Each room has its own countdown (configurable):

| Room | Default |
|---|---|
| MAIN | 90 s |
| BUFFER (R1) | 75 s |
| CACHE (R2) | 60 s |
| SANDBOX (R3) | 45 s |
| VOID (R4) | 30 s |

## Hints

- Max **1 hint per level**
- Costs **15 seconds** off the active timer (or a flat score penalty)
- Once used, the same question cannot receive another hint

## Scoring

```
score = (basePerLevel + timeBonus + streakBonus) × multiplier

timeBonus   = remainingSeconds × 2
streakBonus = basePerLevel × streak × 0.1  (MAIN only)
multiplier  = 1.0 (MAIN correct)  |  0.5 (room recovery)
```

## Return Mode

Controlled by `RETURN_MODE` in `src/theme/tokens.ts`:

| Value | Behaviour |
|---|---|
| `"next_level"` *(default)* | Room recovery advances to level + 1 |
| `"same_question"` | Room recovery replays the current level with an alternate question variant |

## State Machine

Implemented as a pure reducer in `src/engine/stateMachine.ts`:

```
States: MAIN | ROOM_1 | ROOM_2 | ROOM_3 | ROOM_4 | LEVEL_UP | RESET | VICTORY
Events: ANSWER_CORRECT | ANSWER_WRONG | TIMEOUT | USE_HINT | TICK

transition(state, event) → { nextState, effects[] }
```

Effects are **data values** (not function calls). The UI layer reads them and
triggers animations, sounds, and persistence accordingly.
Fully unit-tested in `src/engine/stateMachine.test.ts` including 1 000
randomised play-throughs.
