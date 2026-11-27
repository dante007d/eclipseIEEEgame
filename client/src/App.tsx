import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useEclipseBackend } from './lib/useEclipseBackend';
import EclipseSky from './components/EclipseSky';
import LandingScreen from './components/screens/LandingScreen';
import JoinMatchScreen from './components/screens/JoinMatchScreen';
import PlayScreen from './components/player/PlayScreen';
import HostPortal from './components/host/HostPortal';
import ProjectorView from './components/projector/ProjectorView';

function GameRouter() {
  const navigate = useNavigate();

  const backend = useEclipseBackend();

  const handleStartDemo = (name = 'DemoAscendant') => {
    backend.startDemo(name);
    navigate('/play');
  };

  const handleJoin = async (code: string, name: string) => {
    const role = await backend.joinMatch(code, name);
    if (role === 'admin') navigate('/host');
    else if (role === 'player') navigate('/play');
  };

  const handleLeave = () => {
    backend.leaveToPortal();
    navigate('/');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingScreen
            onEnterGame={handleJoin}
            onStartDemo={handleStartDemo}
            onOpenProjector={() => navigate('/projector')}
            connected={backend.connected}
            leaderboard={backend.leaderboard}
            errorMsg={backend.joinError}
            loading={backend.joinLoading}
          />
        }
      />
      <Route
        path="/join"
        element={
          <JoinMatchScreen
            onJoin={handleJoin}
            onStartDemo={handleStartDemo}
            onBack={() => navigate('/')}
            errorMsg={backend.joinError}
            loading={backend.joinLoading}
          />
        }
      />
      <Route
        path="/play"
        element={
          backend.player ? (
            <PlayScreen
              player={backend.player}
              question={backend.question}
              otherPlayers={backend.otherPlayers}
              config={backend.config}
              matchStatus={backend.matchStatus}
              connected={backend.connected}
              rank={backend.rank}
              rankFlash={backend.rankFlash}
              pulse={backend.pulse}
              globalTimeLeft={backend.globalTimeLeft}
              lastResult={backend.lastResult}
              gameOverData={backend.gameOverData}
              isDemo={backend.isDemo}
              demoHintAnswer={backend.demoHintAnswer}
              onDemoJump={backend.demoJumpLevel}
              onSubmit={backend.submitAnswer}
              onReadyNext={backend.readyNext}
              onCheat={backend.reportCheat}
              onSever={backend.severRun}
              onReenter={backend.reenterRun}
              onLeave={handleLeave}
            />
          ) : backend.reconnectingSession ? (
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
            globalTimeLeft={backend.globalTimeLeft}
          />
        }
      />
      <Route
        path="/projector"
        element={
          <ProjectorView
            onBack={() => navigate('/')}
            globalTimeLeft={backend.globalTimeLeft}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GameRouter />
    </BrowserRouter>
  );
}
