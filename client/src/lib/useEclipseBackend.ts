import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  PlayerState,
  Question,
  AnswerResult,
  MatchConfig,
  MatchStatus,
  LeaderboardSnapshot,
  MatchPulse,
  FeedItem,
} from '../types/game';
import { DEFAULT_CONFIG, SOCKET_EVENTS } from '../types/game';
import {
  socket,
  ensureSocketConnected,
  getSessionId,
  savePlayerMeta,
  loadPlayerMeta,
  clearPlayerMeta,
  saveAdminCode,
} from './socket';
import { getBackendMode, getSupabaseConfigError, tryGetSupabase } from './supabaseClient';
import { soundFX } from './sound';
import {
  createInitialDemoState,
  createDemoQuestion,
  evaluateDemoAnswer,
  stepDemoBots,
  type DemoSessionState,
} from './demoEngine';

export interface GameOverData {
  winners?: { junior?: PlayerState | null; senior?: PlayerState | null };
  message?: string;
}

export function useEclipseBackend() {
  const mode = getBackendMode();

  const [isDemo, setIsDemo] = useState(false);
  const [demoHintAnswer, setDemoHintAnswer] = useState<string | null>(null);
  const demoRef = useRef<DemoSessionState | null>(null);

  const [connected, setConnected] = useState(() => (mode === 'supabase' ? true : socket.connected));
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('pending');
  const [matchCode, setMatchCode] = useState('DANTE');
  const [config, setConfig] = useState<MatchConfig>(DEFAULT_CONFIG);

  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [reconnectingSession, setReconnectingSession] = useState<boolean>(() => !!loadPlayerMeta());
  const [question, setQuestion] = useState<Question | null>(null);
  const [lastResult, setLastResult] = useState<(AnswerResult & { selectedOptionId?: string }) | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<PlayerState[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardSnapshot>({
    players: [],
    totalSouls: 0,
    total: 0,
    online: 0,
  });

  const [rank, setRank] = useState<number | null>(null);
  const [rankFlash, setRankFlash] = useState<{ dir: 'up' | 'down'; n: number } | null>(null);
  const rankRef = useRef<number | null>(null);

  const [pulse, setPulse] = useState<MatchPulse>({ total: 0, online: 0, leader: null, feed: [] });
  const [globalDeadline, setGlobalDeadline] = useState<number | null>(null);
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);

  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const lastSubmittedOptionRef = useRef<string | undefined>(undefined);
  const matchStatusRef = useRef<MatchStatus>(matchStatus);
  matchStatusRef.current = matchStatus;
  const playerRef = useRef<PlayerState | null>(player);
  playerRef.current = player;
  const questionRef = useRef<Question | null>(question);
  questionRef.current = question;
  const pendingAdvanceTimerRef = useRef<number | null>(null);
  const lastAutoReadyRef = useRef<number>(0);
  const syncSupabasePulseRef = useRef<(() => Promise<void>) | null>(null);

  const updateRankWithFlash = useCallback((nextRank: number | null) => {
    if (nextRank == null) return;
    const prev = rankRef.current;
    rankRef.current = nextRank;
    setRank(nextRank);
    if (prev && prev !== nextRank) {
      setRankFlash({ dir: nextRank > prev ? 'down' : 'up', n: Math.abs(nextRank - prev) });
      setTimeout(() => setRankFlash(null), 2800);
    }
  }, []);

  // Global timer countdown
  useEffect(() => {
    if (!globalDeadline) {
      setGlobalTimeLeft(null);
      return;
    }
    const update = () => {
      setGlobalTimeLeft(Math.max(0, Math.ceil((globalDeadline - Date.now()) / 1000)));
    };
    update();
    const t = setInterval(update, 500);
    return () => clearInterval(t);
  }, [globalDeadline]);

  // Stop ambient loop if match ends / player finishes or severs
  useEffect(() => {
    if (
      matchStatus === 'ended' ||
      player?.finished ||
      player?.status === 'won' ||
      player?.status === 'dead' ||
      player?.status === 'disqualified'
    ) {
      soundFX.stopAmbient();
    }
  }, [matchStatus, player?.finished, player?.status]);

  // ── DEMO MODE BOT SIMULATION ───────────────────────────────────────────────
  useEffect(() => {
    if (!isDemo) return;
    const t = setInterval(() => {
      if (!demoRef.current) return;
      const { bots, pulse: botPulse } = stepDemoBots(demoRef.current.bots);
      demoRef.current = { ...demoRef.current, bots };
      const all = [demoRef.current.player, ...bots].sort((a, b) => b.level - a.level);
      setOtherPlayers(all);
      setPulse(botPulse);
      const myRank = all.findIndex(p => p.id === demoRef.current?.player.id) + 1;
      updateRankWithFlash(myRank);
    }, 4500);
    return () => clearInterval(t);
  }, [isDemo, updateRankWithFlash]);

  // ── SUPABASE MODE ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'supabase' || isDemo) return;
    const supabase = tryGetSupabase();
    if (!supabase) {
      setConnected(false);
      setReconnectingSession(false);
      return;
    }
    let cancelled = false;

    const applyPulseData = (data: {
      ok?: boolean;
      matchCode?: string;
      status?: MatchStatus;
      config?: MatchConfig;
      globalRemainingMs?: number | null;
      total?: number;
      online?: number;
      grpTotal?: number;
      grpOnline?: number;
      leader?: { n: string; lv: number } | null;
      rank?: number | null;
      myStatus?: PlayerState['status'];
      topPlayers?: PlayerState[];
      feed?: FeedItem[];
      lastGameOver?: GameOverData | null;
    }) => {
      if (!data?.ok || cancelled) return;
      setConnected(true);
      if (data.matchCode) setMatchCode(data.matchCode);
      if (data.status) setMatchStatus(data.status);
      if (data.config) setConfig(data.config);
      if (data.globalRemainingMs != null) {
        setGlobalDeadline(Date.now() + data.globalRemainingMs);
      } else {
        setGlobalDeadline(null);
      }
      const now = Date.now();
      // Self-healing Question fetch when match is live and active player has no question loaded
      if (
        data.status === 'live' &&
        playerRef.current &&
        playerRef.current.status === 'active' &&
        !playerRef.current.finished &&
        !questionRef.current &&
        !pendingAdvanceTimerRef.current &&
        now - lastAutoReadyRef.current >= 2000
      ) {
        lastAutoReadyRef.current = now;
        const savedMeta = loadPlayerMeta();
        supabase
          .rpc('eclipse_ready_next', {
            p_match_code: data.matchCode || savedMeta?.matchCode || 'DANTE',
            p_session_id: getSessionId(),
          })
          .then(({ data: qRes }) => {
            if (!cancelled && qRes?.ok && qRes.question) {
              setQuestion(qRes.question);
            }
          }, () => {});
      }
      if (data.rank != null) updateRankWithFlash(data.rank);
      if (data.myStatus === 'disqualified') {
        setPlayer(prev => (prev ? { ...prev, status: 'disqualified' } : prev));
      }
      if (data.lastGameOver && data.status === 'ended') {
        setGameOverData(data.lastGameOver);
      }
      if (data.topPlayers) {
        setOtherPlayers(data.topPlayers);
        setLeaderboard({
          players: data.topPlayers,
          totalSouls: data.total || 0,
          total: data.total || 0,
          online: data.online || 0,
          matchCode: data.matchCode,
          status: data.status,
        });
      }
      setPulse({
        total: data.grpTotal ?? data.total ?? 0,
        online: data.grpOnline ?? data.online ?? 0,
        leader: data.leader ?? null,
        feed: data.feed || [],
      });
    };

    const pollPulse = async () => {
      try {
        const saved = loadPlayerMeta();
        const { data, error } = await supabase.rpc('eclipse_get_pulse', {
          p_match_code: saved?.matchCode || 'DANTE',
          p_session_id: saved ? getSessionId() : null,
        });
        if (!error && data) applyPulseData(data);
      } catch {
        if (!cancelled) setConnected(false);
      }
    };

    const saved = loadPlayerMeta();
    if (saved) {
      (async () => {
        try {
          const { data, error } = await supabase.rpc('eclipse_join_match', {
            p_match_code: saved.matchCode,
            p_session_id: getSessionId(),
            p_name: saved.name,
            p_year: 1,
            p_reenter: false,
          });
          if (!cancelled && !error && data?.ok) {
            setPlayer(data.player);
            if (data.question) setQuestion(data.question);
            if (data.config) setConfig(data.config);
            if (data.matchStatus) setMatchStatus(data.matchStatus);
            if (data.matchCode) setMatchCode(data.matchCode);
            if (data.rank != null) updateRankWithFlash(data.rank);
            if (data.lastGameOver) setGameOverData(data.lastGameOver);
          } else if (!cancelled) {
            clearPlayerMeta();
          }
        } finally {
          if (!cancelled) setReconnectingSession(false);
        }
      })();
    } else {
      setReconnectingSession(false);
    }

    syncSupabasePulseRef.current = pollPulse;
    pollPulse();

    let timerId: number;
    const scheduleNext = () => {
      const isWaiting = Boolean(
        playerRef.current && (matchStatusRef.current === 'pending' || matchStatusRef.current === 'paused')
      );
      const jitterMs = isWaiting
        ? 1800 + Math.floor(Math.random() * 1000)
        : 6000 + Math.floor(Math.random() * 4000);
      timerId = window.setTimeout(async () => {
        await pollPulse();
        if (!cancelled) scheduleNext();
      }, jitterMs);
    };
    scheduleNext();

    return () => {
      cancelled = true;
      syncSupabasePulseRef.current = null;
      clearTimeout(timerId);
    };
  }, [mode, isDemo, updateRankWithFlash]);

  // Instant <50ms Supabase Realtime broadcast listener for Start / Pause / Hold / Resume / Reset
  useEffect(() => {
    if (mode !== 'supabase' || isDemo) return;
    const supabase = tryGetSupabase();
    if (!supabase) return;
    let cancelled = false;
    let staggerTimer: number | null = null;
    const channelCode = loadPlayerMeta()?.matchCode || matchCode || 'DANTE';

    const signalChannel = supabase
      .channel(`eclipse:match:${channelCode}`)
      .on('broadcast', { event: 'match_signal' }, ({ payload }) => {
        if (cancelled || !payload) return;
        const nextStatus = payload.status as MatchStatus | undefined;
        if (nextStatus) setMatchStatus(nextStatus);
        if (payload.globalRemainingMs !== undefined) {
          setGlobalDeadline(
            payload.globalRemainingMs == null ? null : Date.now() + Number(payload.globalRemainingMs)
          );
        }
        if (payload.reset) {
          setQuestion(null);
          setLastResult(null);
          setGameOverData(null);
          syncSupabasePulseRef.current?.();
          return;
        }
        if (
          nextStatus === 'live' &&
          playerRef.current &&
          playerRef.current.status === 'active' &&
          !playerRef.current.finished &&
          !questionRef.current &&
          !pendingAdvanceTimerRef.current
        ) {
          // Stagger 500 concurrent clients over ~1.2s to prevent start-button thundering-herd spikes
          if (staggerTimer) clearTimeout(staggerTimer);
          const staggerMs = 40 + Math.floor(Math.random() * 1200);
          staggerTimer = window.setTimeout(() => {
            if (cancelled || questionRef.current || pendingAdvanceTimerRef.current) return;
            lastAutoReadyRef.current = Date.now();
            const savedMeta = loadPlayerMeta();
            supabase
              .rpc('eclipse_ready_next', {
                p_match_code: savedMeta?.matchCode || channelCode,
                p_session_id: getSessionId(),
              })
              .then(({ data: qRes }) => {
                if (!cancelled && qRes?.ok && qRes.question) {
                  setQuestion(qRes.question);
                }
              }, () => {});
          }, staggerMs);
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      if (staggerTimer) clearTimeout(staggerTimer);
      supabase.removeChannel(signalChannel);
    };
  }, [mode, isDemo, matchCode]);

  // Fast 1.2s fallback sync while a joined player is waiting or paused
  useEffect(() => {
    if (mode !== 'supabase' || isDemo || !player) return;
    if (matchStatus !== 'pending' && matchStatus !== 'paused') return;
    syncSupabasePulseRef.current?.();
    const id = window.setInterval(() => {
      syncSupabasePulseRef.current?.();
    }, 1200);
    return () => clearInterval(id);
  }, [mode, isDemo, player, matchStatus]);

  // ── SOCKET.IO MODE ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'socket' || isDemo) return;

    const onConnect = () => {
      setConnected(true);
      socket.emit(SOCKET_EVENTS.LOBBY, true);

      const saved = loadPlayerMeta();
      if (saved) {
        socket.emit(
          SOCKET_EVENTS.JOIN,
          {
            sessionId: getSessionId(),
            name: saved.name,
            year: 1,
            matchCode: saved.matchCode,
          },
          (res: { ok: boolean }) => {
            setReconnectingSession(false);
            if (!res?.ok) clearPlayerMeta();
          }
        );
      } else {
        setReconnectingSession(false);
      }
    };

    const onDisconnect = () => setConnected(false);
    const onMatchStatus = (payload: { status: MatchStatus; matchCode?: string; config?: MatchConfig }) => {
      if (payload.status) setMatchStatus(payload.status);
      if (payload.matchCode) setMatchCode(payload.matchCode);
      if (payload.config) setConfig(payload.config);
    };
    const onJoined = (data: {
      player: PlayerState;
      config: MatchConfig;
      matchStatus: MatchStatus;
      matchCode: string;
    }) => {
      setReconnectingSession(false);
      setPlayer(data.player);
      if (data.config) setConfig(data.config);
      if (data.matchStatus) setMatchStatus(data.matchStatus);
      if (data.matchCode) setMatchCode(data.matchCode);
    };
    const onMatchState = (data: {
      player: PlayerState;
      config?: MatchConfig;
      status?: MatchStatus;
      matchCode?: string;
    }) => {
      setPlayer(data.player);
      if (data.config) setConfig(data.config);
      if (data.status) setMatchStatus(data.status);
      if (data.matchCode) setMatchCode(data.matchCode);
    };
    const onQuestionShow = (q: Question) => setQuestion(q);
    const onAnswerResult = (res: AnswerResult & { player?: PlayerState }) => {
      setLastResult({ ...res, selectedOptionId: lastSubmittedOptionRef.current });
      if (res.player) setPlayer(res.player);
    };
    const onLeaderboard = (snap: LeaderboardSnapshot) => {
      setLeaderboard(snap);
      if (snap.matchCode) setMatchCode(snap.matchCode);
      if (snap.status) setMatchStatus(snap.status);
    };
    const onPlayersUpdate = (snap: { players: PlayerState[] }) => setOtherPlayers(snap.players || []);
    const onRank = (r: number) => updateRankWithFlash(r);
    const onPulse = (p: MatchPulse) => setPulse(p);
    const onTimerSync = ({ remainingMs }: { remainingMs: number | null }) => {
      setGlobalDeadline(remainingMs == null ? null : Date.now() + remainingMs);
    };
    const onMatchEnded = (data: GameOverData) => {
      setGameOverData(data);
      setMatchStatus('ended');
    };
    const onForceDQ = () => {
      setPlayer(prev => (prev ? { ...prev, status: 'disqualified' } : prev));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_EVENTS.MATCH_STATUS, onMatchStatus);
    socket.on(SOCKET_EVENTS.JOINED, onJoined);
    socket.on(SOCKET_EVENTS.MATCH_STATE, onMatchState);
    socket.on(SOCKET_EVENTS.QUESTION_SHOW, onQuestionShow);
    socket.on(SOCKET_EVENTS.ANSWER_RESULT, onAnswerResult);
    socket.on(SOCKET_EVENTS.LEADERBOARD, onLeaderboard);
    socket.on(SOCKET_EVENTS.PLAYERS_UPDATE, onPlayersUpdate);
    socket.on(SOCKET_EVENTS.RANK, onRank);
    socket.on(SOCKET_EVENTS.PULSE, onPulse);
    socket.on(SOCKET_EVENTS.TIMER_SYNC, onTimerSync);
    socket.on(SOCKET_EVENTS.MATCH_ENDED, onMatchEnded);
    socket.on(SOCKET_EVENTS.FORCE_DQ, onForceDQ);

    if (socket.connected) onConnect();
    const safety = window.setTimeout(() => setReconnectingSession(false), 3000);

    return () => {
      clearTimeout(safety);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SOCKET_EVENTS.MATCH_STATUS, onMatchStatus);
      socket.off(SOCKET_EVENTS.JOINED, onJoined);
      socket.off(SOCKET_EVENTS.MATCH_STATE, onMatchState);
      socket.off(SOCKET_EVENTS.QUESTION_SHOW, onQuestionShow);
      socket.off(SOCKET_EVENTS.ANSWER_RESULT, onAnswerResult);
      socket.off(SOCKET_EVENTS.LEADERBOARD, onLeaderboard);
      socket.off(SOCKET_EVENTS.PLAYERS_UPDATE, onPlayersUpdate);
      socket.off(SOCKET_EVENTS.RANK, onRank);
      socket.off(SOCKET_EVENTS.PULSE, onPulse);
      socket.off(SOCKET_EVENTS.TIMER_SYNC, onTimerSync);
      socket.off(SOCKET_EVENTS.MATCH_ENDED, onMatchEnded);
      socket.off(SOCKET_EVENTS.FORCE_DQ, onForceDQ);
    };
  }, [mode, isDemo, updateRankWithFlash]);

  // ── UNIFIED ACTIONS ────────────────────────────────────────────────────────

  const startDemo = useCallback((name = 'Orion') => {
    soundFX.unlockOnInteraction();
    soundFX.playMatchJoined();
    const initial = createInitialDemoState(name.trim() || 'Orion', 1);
    demoRef.current = initial;
    setIsDemo(true);
    setConnected(true);
    setMatchStatus('live');
    setMatchCode('DEMO00');
    setConfig(initial.config);
    setPlayer(initial.player);
    setQuestion(initial.question);
    setDemoHintAnswer(initial.correctOptionId);
    setLastResult(null);
    setGameOverData(null);
    const all = [initial.player, ...initial.bots].sort((a, b) => b.level - a.level);
    setOtherPlayers(all);
    setPulse({
      total: all.length,
      online: all.length,
      leader: { n: all[0].name, lv: all[0].level },
      feed: [{ t: 'lv', n: 'Orion', lv: 24, g: 'senior' }],
    });
    updateRankWithFlash(all.findIndex(p => p.id === initial.player.id) + 1);
  }, [updateRankWithFlash]);

  const demoJumpLevel = useCallback((targetLevel: number, targetRoom = 0) => {
    if (!demoRef.current) return;
    const prev = demoRef.current;
    const p: PlayerState = {
      ...prev.player,
      level: targetLevel,
      bestLevel: Math.max(prev.player.bestLevel, targetLevel),
      phase: targetRoom > 0 ? 'ROOM' : 'MAIN',
      room: targetRoom,
      finished: false,
      status: 'active',
    };
    const issued = createDemoQuestion(p.level, p.phase, p.room, prev.seenIds, prev.question.id, prev.config);
    demoRef.current = {
      ...prev,
      player: p,
      question: issued.question,
      correctOptionId: issued.correctOptionId,
    };
    setPlayer(p);
    setQuestion(issued.question);
    setDemoHintAnswer(issued.correctOptionId);
    setLastResult(null);
  }, []);

  /** Try authenticating entered code as Admin Secret Code first */
  const tryAdminCode = useCallback(async (code: string): Promise<boolean> => {
    const clean = code.trim();
    if (!clean) return false;
    if (mode === 'supabase') {
      const supabase = tryGetSupabase();
      if (!supabase) return false;
      try {
        const { data, error } = await supabase.rpc('eclipse_host_auth', {
          p_admin_code: clean,
          p_match_code: matchCode,
        });
        if (!error && data?.ok) {
          saveAdminCode(clean);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    ensureSocketConnected();
    return new Promise((resolve) => {
      socket.timeout(3500).emit(SOCKET_EVENTS.ADMIN_AUTH, clean, (err: Error | null, res: { ok: boolean }) => {
        if (!err && res?.ok) {
          saveAdminCode(clean);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }, [mode, matchCode]);

  const joinMatch = useCallback(async (code: string, name: string): Promise<'player' | 'admin' | 'error'> => {
    setIsDemo(false);
    demoRef.current = null;
    setDemoHintAnswer(null);
    setJoinLoading(true);
    setJoinError(null);
    soundFX.unlockOnInteraction();

    const cfgError = getSupabaseConfigError();
    if (cfgError) {
      setJoinLoading(false);
      setJoinError(cfgError);
      return 'error';
    }

    // Check if the entered code is the Admin Control Code!
    const isAdmin = await tryAdminCode(code);
    if (isAdmin) {
      setJoinLoading(false);
      soundFX.playMatchJoined();
      return 'admin';
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setJoinLoading(false);
      setJoinError('Enter your name to join the match.');
      return 'error';
    }

    const sessionId = getSessionId();

    if (mode === 'supabase') {
      const supabase = tryGetSupabase();
      if (!supabase) {
        setJoinLoading(false);
        setJoinError(getSupabaseConfigError() || 'Supabase client is not configured.');
        return 'error';
      }
      try {
        const { data, error } = await supabase.rpc('eclipse_join_match', {
          p_match_code: code,
          p_session_id: sessionId,
          p_name: trimmedName,
          p_year: 1,
          p_reenter: false,
        });
        setJoinLoading(false);
        if (error || !data?.ok) {
          setJoinError(error?.message || data?.error || 'Invalid code or match unavailable.');
          return 'error';
        }
        savePlayerMeta({ name: trimmedName, year: 1, matchCode: data.matchCode || code });
        setPlayer(data.player);
        setQuestion(data.matchStatus === 'pending' ? null : (data.question ?? null));
        if (data.config) setConfig(data.config);
        if (data.matchStatus) setMatchStatus(data.matchStatus);
        if (data.matchCode) setMatchCode(data.matchCode);
        if (data.rank != null) updateRankWithFlash(data.rank);
        setGameOverData(null);
        setLastResult(null);
        soundFX.playMatchJoined();
        return 'player';
      } catch (e) {
        setJoinLoading(false);
        setJoinError(e instanceof Error ? e.message : 'Supabase join failed.');
        return 'error';
      }
    }

    ensureSocketConnected();
    return new Promise((resolve) => {
      socket.timeout(6000).emit(
        SOCKET_EVENTS.JOIN,
        { sessionId, matchCode: code, name: trimmedName, year: 1 },
        (err: Error | null, res: { ok: boolean; error?: string }) => {
          setJoinLoading(false);
          if (err) {
            setJoinError('Cannot reach server. Launch Solo Demo or start the backend server.');
            resolve('error');
            return;
          }
          if (!res?.ok) {
            setJoinError(res?.error || 'Invalid code.');
            resolve('error');
            return;
          }
          savePlayerMeta({ name: trimmedName, year: 1, matchCode: code });
          setGameOverData(null);
          setLastResult(null);
          soundFX.playMatchJoined();
          resolve('player');
        }
      );
    });
  }, [mode, tryAdminCode, updateRankWithFlash]);

  const readyNext = useCallback(async () => {
    if (isDemo && demoRef.current) {
      const cur = demoRef.current;
      const timerSec = cur.player.phase === 'MAIN' ? cur.config.mainTimerSec : cur.config.roomTimerSec;
      const refreshedQ = { ...cur.question, deadlineAt: Date.now() + timerSec * 1000 };
      demoRef.current = { ...cur, question: refreshedQ };
      setQuestion(refreshedQ);
      return;
    }

    if (mode === 'supabase') {
      const supabase = tryGetSupabase();
      if (!supabase) return;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const { data, error } = await supabase.rpc('eclipse_ready_next', {
            p_match_code: matchCode,
            p_session_id: getSessionId(),
          });
          if (!error && data?.ok) {
            if (data.question) setQuestion(data.question);
            return;
          }
        } catch {
          // Retry once on transient network spike
        }
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 250 + Math.floor(Math.random() * 250)));
        }
      }
      return;
    }

    socket.emit(SOCKET_EVENTS.READY_NEXT);
  }, [isDemo, mode, matchCode]);

  const submittingTokenRef = useRef<string | null>(null);
  const submitAnswer = useCallback(async (questionToken: string, optionId: string) => {
    lastSubmittedOptionRef.current = optionId;
    if (pendingAdvanceTimerRef.current) {
      clearTimeout(pendingAdvanceTimerRef.current);
      pendingAdvanceTimerRef.current = null;
    }

    if (isDemo && demoRef.current) {
      const { nextState, result } = evaluateDemoAnswer(demoRef.current, optionId);
      demoRef.current = nextState;
      setLastResult({ ...result, selectedOptionId: optionId });
      pendingAdvanceTimerRef.current = window.setTimeout(() => {
        pendingAdvanceTimerRef.current = null;
        setPlayer(nextState.player);
        setQuestion(nextState.question);
        setDemoHintAnswer(nextState.correctOptionId);
      }, result.correct ? 600 : 4900);
      return;
    }

    if (mode === 'supabase') {
      if (submittingTokenRef.current === questionToken) return;
      submittingTokenRef.current = questionToken;
      const supabase = tryGetSupabase();
      if (!supabase) {
        submittingTokenRef.current = null;
        return;
      }
      try {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const { data, error } = await supabase.rpc('eclipse_submit_answer', {
              p_match_code: matchCode,
              p_session_id: getSessionId(),
              p_question_token: questionToken,
              p_option_id: optionId,
            });
            if (!error && data?.ok) {
              setLastResult({ ...data.result, player: data.player, selectedOptionId: optionId });
              pendingAdvanceTimerRef.current = window.setTimeout(() => {
                pendingAdvanceTimerRef.current = null;
                if (data.player) setPlayer(data.player);
                if (data.nextQuestion) setQuestion(data.nextQuestion);
                if (data.rank != null) updateRankWithFlash(data.rank);
              }, data.result?.correct ? 600 : 4900);
              return;
            }
            if (!error && data && !data.ok) {
              await readyNext();
              return;
            }
          } catch {
            // Retry once on transient RPC timeout/error
          }
          if (attempt === 0) {
            await new Promise(r => setTimeout(r, 300 + Math.floor(Math.random() * 250)));
          }
        }
        await readyNext();
      } finally {
        submittingTokenRef.current = null;
      }
      return;
    }

    socket.emit(SOCKET_EVENTS.ANSWER_SUBMIT, { questionToken, optionId });
  }, [isDemo, mode, matchCode, readyNext, updateRankWithFlash]);

  const reportCheat = useCallback(async (kind: string) => {
    if (isDemo && demoRef.current) {
      const p = { ...demoRef.current.player, cheats: demoRef.current.player.cheats + 1 };
      demoRef.current = { ...demoRef.current, player: p };
      setPlayer(p);
      return;
    }
    if (mode === 'supabase') {
      const supabase = tryGetSupabase();
      if (!supabase) return;
      await supabase.rpc('eclipse_report_cheat', {
        p_match_code: matchCode,
        p_session_id: getSessionId(),
        p_kind: kind,
      });
      return;
    }
    socket.emit(SOCKET_EVENTS.CHEAT, { kind });
  }, [isDemo, mode, matchCode]);

  const severRun = useCallback(async () => {
    soundFX.stopAmbient();
    if (isDemo && demoRef.current) {
      const p: PlayerState = { ...demoRef.current.player, status: 'dead' };
      demoRef.current = { ...demoRef.current, player: p };
      setPlayer(p);
      return;
    }
    if (mode === 'supabase') {
      const supabase = tryGetSupabase();
      if (!supabase) return;
      const { data } = await supabase.rpc('eclipse_sever_run', {
        p_match_code: matchCode,
        p_session_id: getSessionId(),
      });
      if (data?.ok && data.player) setPlayer(data.player);
      return;
    }
    socket.emit(SOCKET_EVENTS.SEVER);
  }, [isDemo, mode, matchCode]);

  const reenterRun = useCallback(async () => {
    soundFX.unlockOnInteraction();
    soundFX.playMatchJoined();
    if (pendingAdvanceTimerRef.current) {
      clearTimeout(pendingAdvanceTimerRef.current);
      pendingAdvanceTimerRef.current = null;
    }
    if (isDemo) {
      startDemo(player?.name || 'Orion');
      return;
    }
    const saved = loadPlayerMeta();
    if (!saved) return;
    setGameOverData(null);
    setLastResult(null);

    if (mode === 'supabase') {
      const supabase = tryGetSupabase();
      if (!supabase) return;
      try {
        const { data } = await supabase.rpc('eclipse_join_match', {
          p_match_code: saved.matchCode,
          p_session_id: getSessionId(),
          p_name: saved.name,
          p_year: 1,
          p_reenter: true,
        });
        if (data?.ok) {
          setPlayer(data.player);
          setQuestion(data.question ?? null);
          if (data.config) setConfig(data.config);
          if (data.matchStatus) setMatchStatus(data.matchStatus);
          if (data.matchCode) setMatchCode(data.matchCode);
          if (data.rank != null) updateRankWithFlash(data.rank);
        }
      } catch {
        // Ignore transient re-entry failures
      }
      return;
    }

    socket.emit(SOCKET_EVENTS.JOIN, {
      sessionId: getSessionId(),
      name: saved.name,
      year: 1,
      matchCode: saved.matchCode,
      reenter: true,
    });
  }, [isDemo, mode, player?.name, startDemo, updateRankWithFlash]);

  const leaveToPortal = useCallback(() => {
    soundFX.stopAmbient();
    if (pendingAdvanceTimerRef.current) {
      clearTimeout(pendingAdvanceTimerRef.current);
      pendingAdvanceTimerRef.current = null;
    }
    submittingTokenRef.current = null;
    clearPlayerMeta();
    setIsDemo(false);
    demoRef.current = null;
    setDemoHintAnswer(null);
    setPlayer(null);
    setQuestion(null);
    setLastResult(null);
  }, []);

  return {
    mode,
    isDemo,
    demoHintAnswer,
    connected,
    matchStatus,
    matchCode,
    config,
    player,
    reconnectingSession,
    question,
    lastResult,
    otherPlayers,
    leaderboard,
    rank,
    rankFlash,
    pulse,
    globalTimeLeft,
    gameOverData,
    joinLoading,
    joinError,
    setJoinError,
    startDemo,
    demoJumpLevel,
    joinMatch,
    submitAnswer,
    readyNext,
    reportCheat,
    severRun,
    reenterRun,
    leaveToPortal,
  };
}
