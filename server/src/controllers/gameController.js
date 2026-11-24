import crypto from 'node:crypto';
import { SOCKET_EVENTS } from '../../../shared/constants.js';
import { SAVAGES } from '../../../shared/flavor.js';
import { ENV } from '../config/env.js';
import { selectQuestion, evaluateCascadeAnswer } from '../cascadeEngine.js';
import {
  cleanName,
  cleanYear,
  cleanSession,
  groupOf,
  generateMatchCode,
  computeCoverageReport,
} from '../models/matchStore.js';
import { parseAndValidateQuestions } from '../models/questionValidator.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const codeDigest = (code) =>
  crypto.createHash('sha256').update(String(code ?? '').trim().toLowerCase()).digest();
const ADMIN_DIGEST = codeDigest(ENV.ADMIN_CODE);
const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};

export function attachGameController(io, matchContext) {
  const {
    store,
    markDirty,
    pushFeed,
    ranked,
    onlineCount,
    toClientPlayer,
    toLeanPlayer,
    newPlayer,
    pruneIdle,
    boardPayload,
  } = matchContext;

  const clearPlayerTimer = (player) => {
    if (player.questionTimer) {
      clearTimeout(player.questionTimer);
      player.questionTimer = null;
    }
  };

  const armQuestionTimeout = (player) => {
    clearPlayerTimer(player);
    if (!player.activeQuestion || player.activeQuestion.answered) return;
    if (store.status !== 'live' || player.status !== 'active') return;

    const msLeft = player.activeQuestion.clientQuestion.deadlineAt - Date.now();
    const waitMs = Math.max(100, msLeft + 250);
    const token = player.activeQuestion.token;

    player.questionTimer = setTimeout(() => {
      if (!player.activeQuestion || player.activeQuestion.token !== token || player.activeQuestion.answered) {
        return;
      }
      if (store.status !== 'live' || player.status !== 'active') return;
      handleAnswerEvaluation(player, null, true);
    }, waitMs);
  };

  const issueQuestion = (player, transitionDelayMs = 0) => {
    clearPlayerTimer(player);
    if (player.status !== 'active' || player.finished) {
      player.activeQuestion = null;
      return null;
    }

    const bank = store.banks.all && store.banks.all.length > 0 ? store.banks.all : store.banks.junior;
    const sel = selectQuestion({
      bank,
      level: player.level,
      phase: player.phase,
      room: player.room,
      seenIds: player.seenIds,
      excludeId: player.lastQuestionId,
      config: store.config,
    });

    if (transitionDelayMs > 0) {
      sel.clientQuestion.deadlineAt += transitionDelayMs;
    }

    player.lastQuestionId = sel.questionId;
    player.seenIds.add(sel.questionId);
    player.activeQuestion = {
      token: sel.questionToken,
      questionId: sel.questionId,
      correctOptionId: sel.correctOptionId,
      clientQuestion: sel.clientQuestion,
      answered: false,
      hintUsed: false,
      transitionPending: transitionDelayMs > 0,
    };

    if (store.status === 'paused') {
      player.pausedRemainingMs = Math.max(
        1000,
        (player.phase === 'MAIN' ? store.config.mainTimerSec : store.config.roomTimerSec) * 1000
      );
    } else {
      armQuestionTimeout(player);
    }

    if (player.socketId) {
      io.to(player.socketId).emit(SOCKET_EVENTS.QUESTION_SHOW, sel.clientQuestion);
    }
    return sel.clientQuestion;
  };

  const handleAnswerEvaluation = (player, optionId, isTimeout = false) => {
    if (!player.activeQuestion || player.activeQuestion.answered) return;
    if (player.status !== 'active' || store.status !== 'live') return;

    player.activeQuestion.answered = true;
    clearPlayerTimer(player);

    const remainingMs = Math.max(0, player.activeQuestion.clientQuestion.deadlineAt - Date.now());
    const remainingSec = Math.ceil(remainingMs / 1000);
    const isCorrect = !isTimeout && optionId === player.activeQuestion.correctOptionId;

    const prevLevel = player.level;
    const prevRoom = player.room;

    const evalRes = evaluateCascadeAnswer({
      player,
      isCorrect,
      remainingSec,
      config: store.config,
    });

    // Apply evaluated changes back onto the persistent player object
    Object.assign(player, evalRes.nextPlayer);

    const grp = groupOf(player);
    const { transition, pointsGained } = evalRes;

    // Push live ticker events
    if (transition === 'ADVANCE') {
      pushFeed({ t: 'lv', n: player.name, lv: player.level, g: grp });
    } else if (transition === 'FINISH') {
      pushFeed({ t: 'won', n: player.name, lv: player.level, g: grp });
    } else if (transition === 'ENTER_ROOM' || transition === 'NEXT_ROOM') {
      if (player.room >= store.config.roomsPerLevel) {
        pushFeed({ t: 'room4', n: player.name, lv: player.level + 1, room: player.room, g: grp });
      } else {
        pushFeed({ t: 'fall', n: player.name, lv: player.level + 1, room: player.room, g: grp });
      }
    } else if (transition === 'RESET') {
      pushFeed({ t: 'reset', n: player.name, lv: prevLevel, g: grp });
    }

    const roast = !isCorrect ? pick(SAVAGES) : undefined;
    const resultPayload = {
      correct: isCorrect,
      isTimeout,
      transition,
      pointsGained,
      roast,
      previousRoom: prevRoom,
      newRoom: player.room,
      newLevel: player.level,
      player: toClientPlayer(player),
    };

    if (player.socketId) {
      io.to(player.socketId).emit(SOCKET_EVENTS.ANSWER_RESULT, resultPayload);
      io.to(player.socketId).emit(SOCKET_EVENTS.MATCH_STATE, {
        player: toClientPlayer(player),
        config: store.config,
        status: store.status,
        matchCode: store.matchCode,
      });
    }

    if (player.status === 'active' && !player.finished) {
      // Allow transition / 5-second ragebait reveal before active question clock begins
      issueQuestion(player, isCorrect ? 2200 : 5500);
    } else {
      player.activeQuestion = null;
    }

    markDirty();
  };

  const finishGame = () => {
    if (store.status === 'ended') return;
    store.status = 'ended';
    store.globalTimer = null;

    for (const p of store.players.values()) {
      clearPlayerTimer(p);
    }

    const list = ranked();
    const winners = {};
    for (const g of ['junior', 'senior']) {
      const top = list.find(p => groupOf(p) === g && p.status !== 'disqualified');
      winners[g] = top ? toClientPlayer(top) : null;
    }

    store.lastGameOver = {
      at: Date.now(),
      winners,
      winner: winners.junior || winners.senior || null,
      message: 'THE ECLIPSE CYCLE HAS CONCLUDED.',
      standings: list.map(toClientPlayer),
    };

    io.emit(SOCKET_EVENTS.TIMER_SYNC, { remainingMs: null });
    io.emit(SOCKET_EVENTS.MATCH_STATUS, { status: store.status, matchCode: store.matchCode });
    io.emit(SOCKET_EVENTS.MATCH_ENDED, store.lastGameOver);
    markDirty();
  };

  const emitAdminSnapshot = (target = io.to('admin')) => {
    target.emit(SOCKET_EVENTS.LEADERBOARD, boardPayload(ranked(), Infinity));
    target.emit('host:meta', {
      matchCode: store.matchCode,
      status: store.status,
      config: store.config,
      validationReports: store.validationReports,
    });
  };

  io.on('connection', (socket) => {
    socket.data.tokens = ENV.RATE_BURST;
    socket.data.last = Date.now();
    socket.data.created = 0;
    socket.data.authFails = 0;

    socket.use((packet, next) => {
      if (socket.data.isAdmin) return next();
      const now = Date.now();
      socket.data.tokens = Math.min(
        ENV.RATE_BURST,
        socket.data.tokens + ((now - socket.data.last) / 1000) * ENV.RATE_PER_SEC
      );
      socket.data.last = now;
      if (socket.data.tokens < 1) return;
      socket.data.tokens -= 1;
      next();
    });

    const on = (event, handler) =>
      socket.on(event, (...args) => {
        try {
          handler(...args);
        } catch (err) {
          console.error(`[!] '${event}' handler failed:`, err);
        }
      });

    const adminOn = (event, handler) =>
      on(event, (...args) => {
        if (socket.data.isAdmin) handler(...args);
      });

    const currentPlayer = () => store.players.get(socket.data.sessionId);

    // Sync match status & global timer immediately on connect
    socket.emit(SOCKET_EVENTS.MATCH_STATUS, {
      status: store.status,
      matchCode: store.matchCode,
      config: store.config,
    });

    if (store.globalTimer && store.status !== 'ended') {
      const rem =
        store.status === 'paused' && store.globalTimer.pausedRemainingMs != null
          ? store.globalTimer.pausedRemainingMs
          : Math.max(0, store.globalTimer.endTime - Date.now());
      socket.emit(SOCKET_EVENTS.TIMER_SYNC, { remainingMs: rem });
    }

    on(SOCKET_EVENTS.LOBBY, (watching) => {
      if (watching) {
        socket.join('lobby');
        socket.emit(
          SOCKET_EVENTS.LEADERBOARD,
          store.lobbyCache || boardPayload(ranked(), ENV.LOBBY_ROWS)
        );
      } else {
        socket.leave('lobby');
      }
    });

    on(SOCKET_EVENTS.JOIN, (data, ack) => {
      if (!data || typeof data !== 'object') {
        ack?.({ ok: false, error: 'Invalid join payload.' });
        return;
      }

      const enteredCode = String(data.matchCode ?? '').trim().toUpperCase();
      if (enteredCode !== store.matchCode && enteredCode !== ENV.PLAYER_CODE) {
        ack?.({ ok: false, error: 'Invalid Match Code.' });
        return;
      }

      const sessionId = cleanSession(data.sessionId);
      if (!sessionId) {
        ack?.({ ok: false, error: 'Invalid session token.' });
        return;
      }

      const name = cleanName(data.name);
      const year = cleanYear(data.year);

      let player = store.players.get(sessionId);
      if (!player) {
        if (++socket.data.created > 8) {
          ack?.({ ok: false, error: 'Too many sessions created from this tab.' });
          return;
        }
        if (store.players.size >= ENV.MAX_PLAYERS && !pruneIdle()) {
          socket.emit(SOCKET_EVENTS.SERVER_FULL);
          ack?.({ ok: false, error: 'Match arena is full.' });
          return;
        }
        player = newPlayer(sessionId, name, year);
        store.players.set(sessionId, player);
        store.publicToSession.set(player.publicId, sessionId);
        store.totalSoulsConsumed++;
      } else {
        if (data.name) player.name = name;
        if (data.year) player.year = year;
        if (data.reenter && player.status !== 'disqualified') {
          // Player explicitly re-entering from end screen
          clearPlayerTimer(player);
          player.level = 0;
          player.phase = 'MAIN';
          player.room = 0;
          player.resets = 0;
          player.solved = 0;
          player.fails = 0;
          player.hintsUsed = 0;
          player.score = 0;
          player.streak = 0;
          player.mainFailsOnCurrentLevel = 0;
          player.finished = false;
          player.finishTime = null;
          player.startTime = Date.now();
          player.levelUpdateTime = Date.now();
          player.status = 'active';
          player.seenIds.clear();
          player.lastQuestionId = null;
          player.activeQuestion = null;
        }
      }

      const prev = store.players.get(socket.data.sessionId);
      if (prev && prev !== player && prev.socketId === socket.id) {
        prev.online = false;
        prev.socketId = null;
      }

      socket.data.sessionId = sessionId;
      player.socketId = socket.id;
      player.online = true;
      player.sentRank = null;

      socket.join('players');
      for (const g of ['junior', 'senior']) socket.leave(`players-${g}`);
      socket.join(`players-${groupOf(player)}`);

      const clientPlayer = toClientPlayer(player);
      socket.emit(SOCKET_EVENTS.JOINED, {
        id: player.publicId,
        status: player.status,
        player: clientPlayer,
        config: store.config,
        matchStatus: store.status,
        matchCode: store.matchCode,
      });

      socket.emit(SOCKET_EVENTS.MATCH_STATE, {
        player: clientPlayer,
        config: store.config,
        status: store.status,
        matchCode: store.matchCode,
      });

      if (player.status === 'disqualified') {
        socket.emit(SOCKET_EVENTS.FORCE_DQ);
      } else if (store.status === 'ended' && store.lastGameOver) {
        socket.emit(SOCKET_EVENTS.MATCH_ENDED, store.lastGameOver);
      } else if (player.status === 'active' && !player.finished) {
        // Restore active unanswered question if still valid, otherwise issue fresh question
        if (player.activeQuestion && !player.activeQuestion.answered) {
          const remaining = player.activeQuestion.clientQuestion.deadlineAt - Date.now();
          if (remaining > 500 || store.status === 'paused') {
            socket.emit(SOCKET_EVENTS.QUESTION_SHOW, player.activeQuestion.clientQuestion);
          } else if (store.status === 'live') {
            handleAnswerEvaluation(player, null, true);
          }
        } else {
          issueQuestion(player, 0);
        }
      }

      ack?.({ ok: true, id: player.publicId });
      markDirty();
    });

    on(SOCKET_EVENTS.READY_NEXT, () => {
      const player = currentPlayer();
      if (!player || !player.activeQuestion || player.activeQuestion.answered) return;
      if (!player.activeQuestion.transitionPending) return;
      player.activeQuestion.transitionPending = false;
      const timerSec = player.phase === 'MAIN' ? store.config.mainTimerSec : store.config.roomTimerSec;
      player.activeQuestion.clientQuestion.deadlineAt = Date.now() + timerSec * 1000;
      if (store.status === 'live') armQuestionTimeout(player);
      socket.emit(SOCKET_EVENTS.QUESTION_SHOW, player.activeQuestion.clientQuestion);
    });

    on(SOCKET_EVENTS.ANSWER_SUBMIT, (payload) => {
      const player = currentPlayer();
      if (!player || !payload || typeof payload !== 'object') return;
      if (!player.activeQuestion || player.activeQuestion.answered) return;
      if (payload.questionToken !== player.activeQuestion.token) return;
      if (store.status !== 'live' || player.status !== 'active') return;

      const isLate =
        payload.optionId === '__TIMEOUT__' ||
        Date.now() > player.activeQuestion.clientQuestion.deadlineAt + 800;
      handleAnswerEvaluation(player, String(payload.optionId ?? ''), isLate);
    });

    on(SOCKET_EVENTS.CHEAT, (data) => {
      const player = currentPlayer();
      if (!player) return;
      player.cheats = Math.min(player.cheats + 1, 1e4);
      const kind = typeof data?.kind === 'string' ? data.kind.slice(0, 16) : 'unknown';
      console.log(`[!] Cheat strike ${player.cheats} for ${player.name}: ${kind}`);
      const now = Date.now();
      if (now - player.lastCheatFeed > 8000) {
        player.lastCheatFeed = now;
        pushFeed({ t: 'cheat', n: player.name, g: groupOf(player) });
      }
      markDirty();
    });

    on(SOCKET_EVENTS.SEVER, () => {
      const player = currentPlayer();
      if (!player || player.status !== 'active') return;
      clearPlayerTimer(player);
      player.activeQuestion = null;
      player.status = 'dead';
      pushFeed({ t: 'dead', n: player.name, g: groupOf(player) });
      socket.emit(SOCKET_EVENTS.MATCH_STATE, {
        player: toClientPlayer(player),
        config: store.config,
        status: store.status,
        matchCode: store.matchCode,
      });
      markDirty();
    });

    // ── HOST / ADMIN ───────────────────────────────────────────────────────
    on(SOCKET_EVENTS.ADMIN_AUTH, (code, ack) => {
      if (typeof ack !== 'function') return;
      if (socket.data.authFails >= 8) return ack({ ok: false, error: 'Locked after failed attempts.' });
      if (crypto.timingSafeEqual(codeDigest(code), ADMIN_DIGEST)) {
        socket.data.isAdmin = true;
        socket.join('admin');
        ack({ ok: true });
        emitAdminSnapshot(socket);
      } else {
        socket.data.authFails++;
        ack({ ok: false, error: 'Invalid Host Passcode.' });
      }
    });

    adminOn(SOCKET_EVENTS.ADMIN_LEAVE, () => {
      socket.data.isAdmin = false;
      socket.leave('admin');
    });

    adminOn(SOCKET_EVENTS.HOST_CREATE_OR_UPDATE_CONFIG, (nextCfg, ack) => {
      if (!nextCfg || typeof nextCfg !== 'object') return;
      const cfg = store.config;
      if (nextCfg.totalLevels != null) cfg.totalLevels = num(nextCfg.totalLevels, 5, 60);
      if (nextCfg.roomsPerLevel != null) cfg.roomsPerLevel = num(nextCfg.roomsPerLevel, 1, 4);
      if (nextCfg.mainTimerSec != null) cfg.mainTimerSec = num(nextCfg.mainTimerSec, 10, 180);
      if (nextCfg.roomTimerSec != null) cfg.roomTimerSec = num(nextCfg.roomTimerSec, 10, 120);
      if (Array.isArray(nextCfg.roomDifficultyFractions) && nextCfg.roomDifficultyFractions.length === 4) {
        cfg.roomDifficultyFractions = nextCfg.roomDifficultyFractions.map(f => num(f, 0.1, 1.0));
      }
      cfg.matchDurationMinutes =
        nextCfg.matchDurationMinutes === null || nextCfg.matchDurationMinutes === ''
          ? null
          : num(nextCfg.matchDurationMinutes, 1, 1440);
      cfg.maxMainFailsPerLevel =
        nextCfg.maxMainFailsPerLevel === null || nextCfg.maxMainFailsPerLevel === ''
          ? null
          : num(nextCfg.maxMainFailsPerLevel, 1, 20);
      if (nextCfg.returnMode === 'same_question' || nextCfg.returnMode === 'next_level') {
        cfg.returnMode = nextCfg.returnMode;
      }

      io.emit(SOCKET_EVENTS.MATCH_STATUS, {
        status: store.status,
        matchCode: store.matchCode,
        config: store.config,
      });
      emitAdminSnapshot();
      ack?.({ ok: true, config: store.config });
    });

    adminOn(SOCKET_EVENTS.HOST_REGEN_CODE, (ack) => {
      store.matchCode = generateMatchCode();
      io.emit(SOCKET_EVENTS.MATCH_STATUS, {
        status: store.status,
        matchCode: store.matchCode,
        config: store.config,
      });
      emitAdminSnapshot();
      markDirty();
      ack?.({ ok: true, matchCode: store.matchCode });
    });

    adminOn(SOCKET_EVENTS.HOST_UPLOAD_QUESTIONS, (payload, ack) => {
      if (!payload || typeof payload.rawText !== 'string') {
        ack?.({ ok: false, error: 'Missing question data.' });
        return;
      }
      const parsed = parseAndValidateQuestions(payload.rawText);
      if (!parsed.ok) {
        ack?.({ ok: false, error: parsed.error });
        return;
      }
      const target = payload.targetGroup || 'all';
      if (target === 'all' || target === 'both') {
        store.banks.all = parsed.questions;
        store.validationReports.all = { ...parsed.report, targetGroup: 'all' };
      }
      if (target === 'junior' || target === 'both') {
        store.banks.junior = parsed.questions;
        store.validationReports.junior = { ...parsed.report, targetGroup: 'junior' };
      }
      if (target === 'senior' || target === 'both') {
        store.banks.senior = parsed.questions;
        store.validationReports.senior = { ...parsed.report, targetGroup: 'senior' };
      }
      emitAdminSnapshot();
      ack?.({ ok: true, report: parsed.report });
    });

    adminOn(SOCKET_EVENTS.HOST_SET_STATUS, (newStatus) => {
      if (!['pending', 'live', 'paused', 'ended'].includes(newStatus)) return;
      const prevStatus = store.status;

      if (newStatus === 'ended') {
        finishGame();
        return;
      }

      if (newStatus === 'paused' && prevStatus === 'live') {
        store.status = 'paused';
        const now = Date.now();
        if (store.globalTimer) {
          store.globalTimer.pausedRemainingMs = Math.max(0, store.globalTimer.endTime - now);
        }
        for (const p of store.players.values()) {
          clearPlayerTimer(p);
          if (p.activeQuestion && !p.activeQuestion.answered) {
            p.pausedRemainingMs = Math.max(1000, p.activeQuestion.clientQuestion.deadlineAt - now);
          }
        }
      } else if (newStatus === 'live') {
        store.status = 'live';
        store.lastGameOver = null;
        const now = Date.now();
        if (store.globalTimer && store.globalTimer.pausedRemainingMs != null) {
          store.globalTimer.endTime = now + store.globalTimer.pausedRemainingMs;
          store.globalTimer.pausedRemainingMs = null;
          io.emit(SOCKET_EVENTS.TIMER_SYNC, { remainingMs: store.globalTimer.endTime - now });
        }
        for (const p of store.players.values()) {
          if (p.status === 'active' && !p.finished) {
            if (p.activeQuestion && !p.activeQuestion.answered) {
              const rem = p.pausedRemainingMs ?? (p.phase === 'MAIN' ? store.config.mainTimerSec : store.config.roomTimerSec) * 1000;
              p.activeQuestion.clientQuestion.deadlineAt = now + rem;
              p.pausedRemainingMs = null;
              armQuestionTimeout(p);
              if (p.socketId) {
                io.to(p.socketId).emit(SOCKET_EVENTS.QUESTION_SHOW, p.activeQuestion.clientQuestion);
              }
            } else {
              issueQuestion(p, 0);
            }
          }
        }
      } else {
        store.status = newStatus;
      }

      io.emit(SOCKET_EVENTS.MATCH_STATUS, {
        status: store.status,
        matchCode: store.matchCode,
        config: store.config,
      });
      emitAdminSnapshot();
      markDirty();
    });

    adminOn(SOCKET_EVENTS.HOST_START_GLOBAL_TIMER, (durationSeconds) => {
      const seconds = num(durationSeconds, 10, 24 * 3600);
      store.globalTimer = { endTime: Date.now() + seconds * 1000, pausedRemainingMs: null };
      if (store.status === 'ended' || store.status === 'pending') {
        store.status = 'live';
      }
      store.lastGameOver = null;
      io.emit(SOCKET_EVENTS.TIMER_SYNC, { remainingMs: seconds * 1000 });
      io.emit(SOCKET_EVENTS.MATCH_STATUS, { status: store.status, matchCode: store.matchCode });
      emitAdminSnapshot();
    });

    adminOn(SOCKET_EVENTS.HOST_DISQUALIFY, (publicId) => {
      const target = store.players.get(store.publicToSession.get(publicId));
      if (!target) return;
      clearPlayerTimer(target);
      target.activeQuestion = null;
      target.status = 'disqualified';
      if (target.socketId) io.to(target.socketId).emit(SOCKET_EVENTS.FORCE_DQ);
      pushFeed({ t: 'dq', n: target.name, g: groupOf(target) });
      markDirty();
    });

    adminOn(SOCKET_EVENTS.HOST_RESET_ALL, () => {
      for (const p of store.players.values()) clearPlayerTimer(p);
      store.players.clear();
      store.publicToSession.clear();
      store.feed = [];
      store.lastGameOver = null;
      store.globalTimer = null;
      store.status = 'live';
      io.emit(SOCKET_EVENTS.TIMER_SYNC, { remainingMs: null });
      io.emit(SOCKET_EVENTS.MATCH_STATUS, { status: store.status, matchCode: store.matchCode });
      markDirty();
    });

    on('projector:join', () => {
      socket.join('projector');
      socket.emit(SOCKET_EVENTS.PLAYERS_UPDATE, boardPayload(ranked(), Infinity));
    });

    socket.on('disconnect', () => {
      const player = currentPlayer();
      if (player && player.socketId === socket.id) {
        player.online = false;
        player.socketId = null;
        markDirty();
      }
    });
  });

  // ── BROADCAST TICK ────────────────────────────────────────────────────────
  function tick() {
    if (!store.dirty) return;
    store.dirty = false;

    const list = ranked();
    const rooms = io.sockets.adapter.rooms;

    store.lobbyCache = boardPayload(list, ENV.LOBBY_ROWS, toLeanPlayer);
    if (rooms.get('lobby')?.size) io.to('lobby').emit(SOCKET_EVENTS.LEADERBOARD, store.lobbyCache);
    if (rooms.get('admin')?.size) io.to('admin').emit(SOCKET_EVENTS.LEADERBOARD, boardPayload(list, Infinity, toClientPlayer));
    if (rooms.get('projector')?.size) {
      io.to('projector').emit(SOCKET_EVENTS.PLAYERS_UPDATE, boardPayload(list, Infinity, toLeanPlayer));
    }
    if (rooms.get('players')?.size) {
      // Send compact top-25 + Room 4 Danger Zone lean snapshot to player sockets
      const top25 = list.slice(0, 25);
      const topIds = new Set(top25.map(p => p.publicId));
      const compactList = [
        ...top25,
        ...list.filter(p => p.room >= store.config.roomsPerLevel && p.status === 'active' && !topIds.has(p.publicId)),
      ];
      io.to('players').emit(SOCKET_EVENTS.PLAYERS_UPDATE, {
        players: compactList.map(toLeanPlayer),
        totalSouls: store.totalSoulsConsumed,
        total: list.length,
        online: onlineCount(),
        matchCode: store.matchCode,
        status: store.status,
      });
    }

    // Single unified rank across all active players in the match
    list.forEach((p, i) => {
      const rank = i + 1;
      if (p.socketId && p.sentRank !== rank) {
        io.sockets.sockets.get(p.socketId)?.emit(SOCKET_EVENTS.RANK, rank);
        p.sentRank = rank;
      }
    });
    if (rooms.get('players')?.size) {
      io.to('players').emit(SOCKET_EVENTS.PULSE, {
        total: list.length,
        online: onlineCount(),
        leader: list[0] ? { n: list[0].name, lv: list[0].level } : null,
        feed: store.feed,
      });
    }
    store.feed = [];
  }

  const tickInterval = setInterval(() => {
    try {
      tick();
    } catch (err) {
      console.error('[!] tick failed:', err);
    }
  }, ENV.TICK_MS);

  const globalTimerCheck = setInterval(() => {
    if (store.globalTimer && store.status === 'live' && Date.now() >= store.globalTimer.endTime) {
      finishGame();
    }
  }, 1000);

  const timerSyncInterval = setInterval(() => {
    if (store.globalTimer && store.status === 'live') {
      io.emit(SOCKET_EVENTS.TIMER_SYNC, {
        remainingMs: Math.max(0, store.globalTimer.endTime - Date.now()),
      });
    }
  }, ENV.TIMER_SYNC_MS);

  return () => {
    clearInterval(tickInterval);
    clearInterval(globalTimerCheck);
    clearInterval(timerSyncInterval);
  };
}
