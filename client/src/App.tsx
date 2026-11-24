import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import type {
  PlayerState,
  Question,
  AnswerResult,
  MatchConfig,
  MatchStatus,
  LeaderboardSnapshot,
  MatchPulse,
} from './types/game';
import { DEFAULT_CONFIG, SOCKET_EVENTS } from './types/game';
import {
  socket,
  getSessionId,
  savePlayerMeta,
  loadPlayerMeta,
  clearPlayerMeta,
} from './lib/socket';
import { soundFX } from './lib/sound';
import EclipseSky from './components/EclipseSky';
import LandingScreen from './components/screens/LandingScreen';
import JoinMatchScreen from './components/screens/JoinMatchScreen';
import PlayScreen from './components/player/PlayScreen';
import HostPortal from './components/host/HostPortal';
import ProjectorView from './components/projector/ProjectorView';

function GameRouter() {
  const navigate = useNavigate();

  const [connected, setConnected] = useState(socket.connected);
  const [soundEnabled, setSoundEnabled] = useState(soundFX.isEnabled());
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('live');
  const [matchCode, setMatchCode] = useState('A7K3P9');
  const [config, setConfig] = useState<MatchConfig>(DEFAULT_CONFIG);

  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [reconnectingSession, setReconnectingSession] = useState<boolean>(() => !!loadPlayerMeta());
  const [question, setQuestion] = useState<Question | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
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
  const [gameOverData, setGameOverData] = useState<{
    winners?: { junior?: PlayerState | null; senior?: PlayerState | null };
    message?: string;
  } | null>(null);

  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const toggleSound = () => setSoundEnabled(soundFX.toggle());

  // Global timer tick
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

  // Core Socket.io listeners + automatic reconnect recovery
  useEffect(() => {
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
            year: saved.year,
            matchCode: saved.matchCode,
          },
          (res: { ok: boolean }) => {
            setReconnectingSession(false);
            if (!res?.ok) {
              clearPlayerMeta();
            }
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

    const onQuestionShow = (q: Question) => {
      setQuestion(q);
    };

    const onAnswerResult = (res: AnswerResult & { player?: PlayerState }) => {
      setLastResult(res);
      if (res.player) setPlayer(res.player);
    };

    const onLeaderboard = (snap: LeaderboardSnapshot) => {
      setLeaderboard(snap);
      if (snap.matchCode) setMatchCode(snap.matchCode);
      if (snap.status) setMatchStatus(snap.status);
    };

    const onPlayersUpdate = (snap: { players: PlayerState[] }) => {
      setOtherPlayers(snap.players || []);
    };

    const onRank = (r: number) => {
      const prev = rankRef.current;
      rankRef.current = r;
      setRank(r);
      if (prev && prev !== r) {
        setRankFlash({ dir: r > prev ? 'down' : 'up', n: Math.abs(r - prev) });
        setTimeout(() => setRankFlash(null), 2800);
      }
    };

    const onPulse = (p: MatchPulse) => setPulse(p);

    const onTimerSync = ({ remainingMs }: { remainingMs: number | null }) => {
      if (remainingMs == null) setGlobalDeadline(null);
      else setGlobalDeadline(Date.now() + remainingMs);
    };

    const onMatchEnded = (data: {
      winners?: { junior?: PlayerState | null; senior?: PlayerState | null };
      message?: string;
    }) => {
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

    const safetyTimeout = window.setTimeout(() => {
      setReconnectingSession(false);
    }, 3500);

    return () => {
      clearTimeout(safetyTimeout);
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
  }, []);

  const handleJoinMatch = (code: string, name: string, year: number) => {
    setJoinLoading(true);
    setJoinError(null);
    const sessionId = getSessionId();
    socket
      .timeout(7000)
      .emit(
        SOCKET_EVENTS.JOIN,
        { sessionId, matchCode: code, name, year },
        (err: Error | null, res: { ok: boolean; error?: string }) => {
          setJoinLoading(false);
          if (err) {
            setJoinError('Cannot reach game server. Make sure the server is running on port 3001.');
            return;
          }
          if (!res?.ok) {
            setJoinError(res?.error || 'Unable to join match.');
            return;
          }
          savePlayerMeta({ name, year, matchCode: code });
          setGameOverData(null);
          setLastResult(null);
          navigate('/play');
        }
      );
  };

  const handleSubmitAnswer = useCallback((questionToken: string, optionId: string) => {
    socket.emit(SOCKET_EVENTS.ANSWER_SUBMIT, { questionToken, optionId });
  }, []);

  const handleReadyNext = useCallback(() => {
    socket.emit(SOCKET_EVENTS.READY_NEXT);
  }, []);

  const handleCheat = useCallback((kind: string) => {
    socket.emit(SOCKET_EVENTS.CHEAT, { kind });
  }, []);

  const handleSever = useCallback(() => {
    socket.emit(SOCKET_EVENTS.SEVER);
  }, []);

  const handleReenter = useCallback(() => {
    const saved = loadPlayerMeta();
    if (!saved) {
      navigate('/join');
      return;
    }
    setGameOverData(null);
    setLastResult(null);
    socket.emit(SOCKET_EVENTS.JOIN, {
      sessionId: getSessionId(),
      name: saved.name,
      year: saved.year,
      matchCode: saved.matchCode,
      reenter: true,
    });
  }, [navigate]);

  const handleLeaveToPortal = useCallback(() => {
    clearPlayerMeta();
    setPlayer(null);
    setQuestion(null);
    setLastResult(null);
    navigate('/');
  }, [navigate]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingScreen
            onJoinMatch={() => navigate(player ? '/play' : '/join')}
            onOpenDashboard={() => navigate('/host')}
            onOpenProjector={() => navigate('/projector')}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            connected={connected}
            leaderboard={leaderboard}
          />
        }
      />
      <Route
        path="/join"
        element={
          <JoinMatchScreen
            onJoin={handleJoinMatch}
            onBack={() => navigate('/')}
            errorMsg={joinError}
            loading={joinLoading}
            defaultCode={matchCode}
          />
        }
      />
      <Route
        path="/play"
        element={
          player ? (
            <PlayScreen
              player={player}
              question={question}
              otherPlayers={otherPlayers}
              config={config}
              matchStatus={matchStatus}
              connected={connected}
              rank={rank}
              rankFlash={rankFlash}
              pulse={pulse}
              globalTimeLeft={globalTimeLeft}
              lastResult={lastResult}
              gameOverData={gameOverData}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              onSubmit={handleSubmitAnswer}
              onReadyNext={handleReadyNext}
              onCheat={handleCheat}
              onSever={handleSever}
              onReenter={handleReenter}
              onLeave={handleLeaveToPortal}
            />
          ) : reconnectingSession ? (
            <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#060709] text-gray-200 p-6">
              <EclipseSky />
              <div className="relative z-10 text-center">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-cinzel text-sm tracking-[0.25em] uppercase text-red-400">
                  RESTORING ASCENSION STATE...
                </p>
              </div>
            </div>
          ) : (
            <Navigate to="/join" replace />
          )
        }
      />
      <Route
        path="/host"
        element={
          <HostPortal
            onBackHome={() => navigate('/')}
            onOpenProjector={() => navigate('/projector')}
            globalTimeLeft={globalTimeLeft}
          />
        }
      />
      <Route
        path="/projector"
        element={
          <ProjectorView
            onBack={() => navigate('/')}
            globalTimeLeft={globalTimeLeft}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GameRouter />
    </BrowserRouter>
  );
}
