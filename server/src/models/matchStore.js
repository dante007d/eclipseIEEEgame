import crypto from 'node:crypto';
import { DEFAULT_CONFIG } from '../../../shared/constants.js';
import { ENV } from '../config/env.js';
import { JUNIOR } from '../questions/junior.js';
import { SENIOR } from '../questions/senior.js';

export function computeCoverageReport(bank, targetGroup = 'both') {
  const perDifficulty = {};
  for (const q of bank) {
    if (!q || q.lv < 1) continue;
    const d = Math.min(60, Math.max(1, q.lv));
    perDifficulty[d] = (perDifficulty[d] ?? 0) + 1;
  }
  const difficulties = Object.keys(perDifficulty).map(Number).sort((a, b) => a - b);
  const warnings = [];
  const errors = [];
  for (let d = 1; d <= 60; d++) {
    const cnt = perDifficulty[d] ?? 0;
    if (cnt === 0) errors.push(`Difficulty ${d}: no questions`);
    else if (cnt < 4) warnings.push(`Difficulty ${d}: only ${cnt} question(s) (< 4)`);
  }
  return {
    loaded: bank.filter(q => q.lv >= 1).length,
    difficulties,
    perDifficulty,
    warnings,
    errors,
    targetGroup,
  };
}

export const generateMatchCode = () =>
  Array.from({ length: 6 }, () =>
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
  ).join('');

export const cleanName = (name) =>
  String(name ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24) || 'UNKNOWN';

export const cleanYear = (y) => {
  const n = Number(y);
  return Number.isInteger(n) && n >= 1 && n <= 4 ? n : 1;
};

export const cleanSession = (id) =>
  typeof id === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(id) ? id : null;

export const groupOf = (p) => (p.year >= 2 ? 'senior' : 'junior');

export const rankTime = (p) =>
  Math.max(0, (p.finished && p.finishTime ? p.finishTime : p.levelUpdateTime) - p.startTime);

const isDQ = (p) => (p.status === 'disqualified' ? 1 : 0);

/**
 * Ranking rule:
 * 0. Non-disqualified before disqualified
 * 1. Current level descending (or finished at 60 first)
 * 2. Earlier timestamp to reach that level (or finishTime)
 * 3. Best level descending
 * 4. Fewer fails, fewer cheats
 */
export const byRank = (a, b) =>
  (isDQ(a) - isDQ(b)) ||
  (b.level - a.level) ||
  (rankTime(a) - rankTime(b)) ||
  (b.bestLevel - a.bestLevel) ||
  (a.fails - b.fails) ||
  (a.cheats - b.cheats);

export function createMatchStore() {
  const store = {
    matchCode: ENV.DEFAULT_MATCH_CODE,
    status: 'live', // 'pending' | 'live' | 'paused' | 'ended'
    config: { ...DEFAULT_CONFIG },
    banks: {
      junior: [...JUNIOR],
      senior: [...SENIOR],
    },
    validationReports: {
      junior: computeCoverageReport(JUNIOR, 'junior'),
      senior: computeCoverageReport(SENIOR, 'senior'),
    },
    players: new Map(),
    publicToSession: new Map(),
    totalSoulsConsumed: 0,
    globalTimer: null, // { endTime, pausedRemainingMs }
    lastGameOver: null,
    dirty: true,
    feed: [],
    lobbyCache: null,
  };

  const markDirty = () => { store.dirty = true; };

  const pushFeed = (item) => {
    store.feed.push(item);
    if (store.feed.length > 12) store.feed.shift();
  };

  const ranked = () => Array.from(store.players.values()).sort(byRank);

  const onlineCount = () => {
    let n = 0;
    for (const p of store.players.values()) if (p.online) n++;
    return n;
  };

  const toClientPlayer = (p) => ({
    id: p.publicId,
    name: p.name,
    year: p.year,
    group: groupOf(p),
    level: p.level,
    phase: p.phase,
    room: p.room,
    resets: p.resets,
    bestLevel: p.bestLevel,
    solved: p.solved,
    fails: p.fails,
    hintsUsed: p.hintsUsed,
    cheats: p.cheats,
    score: p.score,
    streak: p.streak,
    finished: p.finished,
    finishedAt: p.finishTime,
    online: p.online,
    status: p.status,
    time: rankTime(p) / 1000,
  });

  const newPlayer = (sessionId, name, year) => {
    const now = Date.now();
    let publicId;
    do {
      publicId = crypto.randomBytes(6).toString('hex');
    } while (store.publicToSession.has(publicId));

    return {
      sessionId,
      publicId,
      name,
      year,
      level: 0,
      phase: 'MAIN',
      room: 0,
      resets: 0,
      bestLevel: 0,
      solved: 0,
      fails: 0,
      hintsUsed: 0,
      cheats: 0,
      lastCheatFeed: 0,
      score: 0,
      streak: 0,
      mainFailsOnCurrentLevel: 0,
      finished: false,
      startTime: now,
      finishTime: null,
      levelUpdateTime: now,
      status: 'active',
      online: false,
      socketId: null,
      sentRank: null,
      seenIds: new Set(),
      lastQuestionId: null,
      activeQuestion: null,
      questionTimer: null,
      pausedRemainingMs: null,
    };
  };

  const pruneIdle = () => {
    for (const [sid, p] of store.players) {
      if (!p.online && p.solved === 0 && p.fails === 0) {
        if (p.questionTimer) clearTimeout(p.questionTimer);
        store.players.delete(sid);
        store.publicToSession.delete(p.publicId);
      }
    }
    return store.players.size < ENV.MAX_PLAYERS;
  };

  const boardPayload = (list, rows = Infinity) => ({
    players: list.slice(0, rows).map(toClientPlayer),
    totalSouls: store.totalSoulsConsumed,
    total: list.length,
    online: onlineCount(),
    matchCode: store.matchCode,
    status: store.status,
  });

  return {
    store,
    markDirty,
    pushFeed,
    ranked,
    onlineCount,
    toClientPlayer,
    newPlayer,
    pruneIdle,
    boardPayload,
  };
}
