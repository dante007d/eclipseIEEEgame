import { DEMO_QUESTIONS, type DemoQuestion } from './demoQuestions';
import { SAVAGES, pickUnique, type UniquePoolTracker } from '../../../shared/flavor.js';
import type {
  AnswerResult,
  MatchConfig,
  MatchPulse,
  PlayerState,
  Question,
  Transition,
} from '../types/game';
import { DEFAULT_CONFIG } from '../types/game';

const INITIAL_BOTS: PlayerState[] = [
  { id: 'bot-1', name: 'Orion', year: 3, group: 'senior', level: 24, phase: 'MAIN', room: 0, resets: 0, bestLevel: 24, solved: 24, fails: 1, hintsUsed: 0, cheats: 0, score: 3420, streak: 6, finished: false, online: true, status: 'active', time: 185 },
  { id: 'bot-2', name: 'Cipher', year: 2, group: 'senior', level: 19, phase: 'ROOM', room: 4, resets: 1, bestLevel: 21, solved: 20, fails: 5, hintsUsed: 0, cheats: 0, score: 1920, streak: 0, finished: false, online: true, status: 'active', time: 210 },
  { id: 'bot-3', name: 'Verdant', year: 1, group: 'junior', level: 18, phase: 'ROOM', room: 2, resets: 0, bestLevel: 18, solved: 19, fails: 2, hintsUsed: 0, cheats: 0, score: 2150, streak: 0, finished: false, online: true, status: 'active', time: 164 },
  { id: 'bot-4', name: 'Nova', year: 4, group: 'senior', level: 14, phase: 'MAIN', room: 0, resets: 2, bestLevel: 22, solved: 31, fails: 11, hintsUsed: 0, cheats: 0, score: 1680, streak: 3, finished: false, online: true, status: 'active', time: 242 },
  { id: 'bot-5', name: 'Echo', year: 1, group: 'junior', level: 11, phase: 'ROOM', room: 4, resets: 1, bestLevel: 13, solved: 14, fails: 7, hintsUsed: 0, cheats: 0, score: 1140, streak: 0, finished: false, online: true, status: 'active', time: 190 },
  { id: 'bot-6', name: 'Atlas', year: 2, group: 'senior', level: 8, phase: 'MAIN', room: 0, resets: 0, bestLevel: 8, solved: 8, fails: 0, hintsUsed: 0, cheats: 0, score: 980, streak: 8, finished: false, online: true, status: 'active', time: 92 },
];

export interface DemoSessionState {
  player: PlayerState;
  question: Question;
  correctOptionId: string;
  bots: PlayerState[];
  seenIds: string[];
  roastTracker?: UniquePoolTracker;
  config: MatchConfig;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createDemoQuestion(
  level: number,
  phase: 'MAIN' | 'ROOM',
  room: number,
  seenIds: string[],
  lastId: string | null,
  config: MatchConfig
): { question: Question; correctOptionId: string; pickedId: string } {
  const nextLv = Math.min(config.totalLevels, Math.max(1, level + 1));
  const target =
    phase === 'MAIN' || room <= 0
      ? nextLv
      : Math.max(1, Math.round(nextLv * (config.roomDifficultyFractions[room - 1] ?? 0.2)));

  let pool = DEMO_QUESTIONS.filter(q => !seenIds.includes(q.id) && q.id !== lastId);
  if (pool.length === 0) {
    pool = DEMO_QUESTIONS.filter(q => q.id !== lastId);
  }
  if (pool.length === 0) pool = DEMO_QUESTIONS;

  const sorted = [...pool].sort((a: DemoQuestion, b: DemoQuestion) => {
    const da = Math.abs(a.lv - target);
    const db = Math.abs(b.lv - target);
    return da - db;
  });
  const chosen = sorted[0];

  const labels = ['A', 'B', 'C', 'D'];
  const indexed = chosen.options.map((text, idx) => ({ text, ok: idx === chosen.a }));
  const shuffled = shuffle(indexed);

  let correctOptionId = 'A';
  const options = shuffled.map((item, idx) => {
    const id = labels[idx];
    if (item.ok) correctOptionId = id;
    return { id, text: item.text };
  });

  const timerSec = phase === 'MAIN' ? config.mainTimerSec : config.roomTimerSec;
  return {
    pickedId: chosen.id,
    correctOptionId,
    question: {
      questionToken: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      id: chosen.id,
      text: chosen.q,
      options,
      difficulty: target,
      type: 'DEMO',
      topic: chosen.topic,
      deadlineAt: Date.now() + timerSec * 1000,
      phase,
      room,
      targetLevel: nextLv,
    },
  };
}

export function createInitialDemoState(name = 'DemoAscendant', year = 1): DemoSessionState {
  const config = { ...DEFAULT_CONFIG };
  const player: PlayerState = {
    id: 'demo-player',
    name,
    year,
    group: year >= 2 ? 'senior' : 'junior',
    level: 0,
    phase: 'MAIN',
    room: 0,
    resets: 0,
    bestLevel: 0,
    solved: 0,
    fails: 0,
    hintsUsed: 0,
    cheats: 0,
    score: 0,
    streak: 0,
    finished: false,
    online: true,
    status: 'active',
    time: 0,
  };

  const issued = createDemoQuestion(0, 'MAIN', 0, [], null, config);
  return {
    player,
    question: issued.question,
    correctOptionId: issued.correctOptionId,
    bots: INITIAL_BOTS.map(b => ({ ...b })),
    seenIds: [issued.pickedId],
    roastTracker: { seen: new Set(), last: null },
    config,
  };
}

export function evaluateDemoAnswer(
  state: DemoSessionState,
  optionId: string | null
): {
  nextState: DemoSessionState;
  result: AnswerResult;
} {
  const isTimeout = optionId === null || optionId === '__TIMEOUT__';
  const isCorrect = !isTimeout && optionId === state.correctOptionId;
  const p = { ...state.player };
  const prevRoom = p.room;
  const remSec = Math.max(0, Math.ceil((state.question.deadlineAt - Date.now()) / 1000));
  let transition: Transition;
  let pointsGained = 0;

  if (p.phase === 'MAIN') {
    if (isCorrect) {
      p.level += 1;
      p.bestLevel = Math.max(p.bestLevel, p.level);
      p.solved += 1;
      p.streak += 1;
      pointsGained = 100 + remSec * 2 + Math.floor(100 * p.streak * 0.1);
      p.score += pointsGained;
      if (p.level >= state.config.totalLevels) {
        p.finished = true;
        p.status = 'won';
        transition = 'FINISH';
      } else {
        transition = 'ADVANCE';
      }
    } else {
      p.fails += 1;
      p.streak = 0;
      p.phase = 'ROOM';
      p.room = 1;
      transition = 'ENTER_ROOM';
    }
  } else {
    if (isCorrect) {
      p.solved += 1;
      pointsGained = Math.round((100 + remSec * 2) * 0.5);
      p.score += pointsGained;
      p.phase = 'MAIN';
      p.room = 0;
      transition = 'RETURN_TO_MAIN';
    } else {
      p.fails += 1;
      p.streak = 0;
      if (p.room < state.config.roomsPerLevel) {
        p.room += 1;
        transition = 'NEXT_ROOM';
      } else {
        p.level = 0;
        p.phase = 'MAIN';
        p.room = 0;
        p.resets += 1;
        p.score = 0;
        transition = 'RESET';
      }
    }
  }

  const nextIssued =
    p.status === 'active' && !p.finished
      ? createDemoQuestion(p.level, p.phase, p.room, state.seenIds, state.question.id, state.config)
      : null;

  const nextRoastTracker: UniquePoolTracker = {
    seen: new Set(state.roastTracker?.seen ?? []),
    last: state.roastTracker?.last ?? null,
  };
  const roast = isCorrect ? undefined : pickUnique(SAVAGES, nextRoastTracker);

  return {
    nextState: {
      ...state,
      player: p,
      question: nextIssued ? nextIssued.question : state.question,
      correctOptionId: nextIssued ? nextIssued.correctOptionId : state.correctOptionId,
      seenIds: nextIssued ? [...state.seenIds.slice(-15), nextIssued.pickedId] : state.seenIds,
      roastTracker: nextRoastTracker,
    },
    result: {
      correct: isCorrect,
      isTimeout,
      transition,
      pointsGained,
      roast,
      previousRoom: prevRoom,
      newRoom: p.room,
      newLevel: p.level,
    },
  };
}

export function stepDemoBots(bots: PlayerState[]): { bots: PlayerState[]; pulse: MatchPulse } {
  const nextBots = bots.map(b => ({ ...b }));
  const target = nextBots[Math.floor(Math.random() * nextBots.length)];
  const feed = [];

  if (Math.random() < 0.58) {
    if (target.phase === 'ROOM') {
      target.phase = 'MAIN';
      target.room = 0;
    } else if (target.level < 59) {
      target.level += 1;
      target.bestLevel = Math.max(target.bestLevel, target.level);
      feed.push({ t: 'lv' as const, n: target.name, lv: target.level, g: target.group });
    }
  } else {
    if (target.phase === 'MAIN') {
      target.phase = 'ROOM';
      target.room = 1;
      feed.push({ t: 'fall' as const, n: target.name, lv: target.level + 1, room: 1, g: target.group });
    } else if (target.room < 4) {
      target.room += 1;
      feed.push({
        t: target.room === 4 ? ('room4' as const) : ('fall' as const),
        n: target.name,
        lv: target.level + 1,
        room: target.room,
        g: target.group,
      });
    } else {
      target.level = 0;
      target.phase = 'MAIN';
      target.room = 0;
      target.resets += 1;
      feed.push({ t: 'reset' as const, n: target.name, lv: target.bestLevel, g: target.group });
    }
  }

  const sorted = [...nextBots].sort((a, b) => b.level - a.level);
  return {
    bots: nextBots,
    pulse: {
      total: nextBots.length + 1,
      online: nextBots.length + 1,
      leader: sorted[0] ? { n: sorted[0].name, lv: sorted[0].level } : null,
      feed,
    },
  };
}
