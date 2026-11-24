import { useState, useEffect, type FormEvent } from 'react';
import type { MatchConfig, MatchStatus, PlayerState, ValidationReport, YearGroup } from '../../types/game';
import { SOCKET_EVENTS } from '../../types/game';
import { socket, loadAdminCode, saveAdminCode, clearAdminCode } from '../../lib/socket';
import EclipseSky from '../EclipseSky';
import HostLiveDashboard from './HostLiveDashboard';
import HostCreateScreen from './HostCreateScreen';

interface HostPortalProps {
  onBackHome: () => void;
  onOpenProjector: () => void;
  globalTimeLeft: number | null;
}

export default function HostPortal({ onBackHome, onOpenProjector, globalTimeLeft }: HostPortalProps) {
  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'setup'>('live');

  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [matchCode, setMatchCode] = useState('A7K3P9');
  const [status, setStatus] = useState<MatchStatus>('live');
  const [config, setConfig] = useState<MatchConfig | undefined>(undefined);
  const [validationReports, setValidationReports] = useState<{
    junior?: ValidationReport;
    senior?: ValidationReport;
  }>({});

  // Auto-auth if admin code was saved in sessionStorage
  useEffect(() => {
    const saved = loadAdminCode();
    if (saved) {
      socket.emit(SOCKET_EVENTS.ADMIN_AUTH, saved, (res: { ok: boolean }) => {
        if (res?.ok) setAuthed(true);
        else clearAdminCode();
      });
    }
  }, []);

  useEffect(() => {
    const onLeaderboard = (data: { players: PlayerState[]; matchCode?: string; status?: MatchStatus }) => {
      setPlayers(data.players || []);
      if (data.matchCode) setMatchCode(data.matchCode);
      if (data.status) setStatus(data.status);
    };
    const onMeta = (meta: {
      matchCode: string;
      status: MatchStatus;
      config: MatchConfig;
      validationReports: { junior?: ValidationReport; senior?: ValidationReport };
    }) => {
      setMatchCode(meta.matchCode);
      setStatus(meta.status);
      setConfig(meta.config);
      setValidationReports(meta.validationReports || {});
    };

    socket.on(SOCKET_EVENTS.LEADERBOARD, onLeaderboard);
    socket.on('host:meta', onMeta);
    return () => {
      socket.off(SOCKET_EVENTS.LEADERBOARD, onLeaderboard);
      socket.off('host:meta', onMeta);
    };
  }, []);

  const handleAuth = (e: FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setChecking(true);
    setAuthError(null);
    socket.timeout(6000).emit(SOCKET_EVENTS.ADMIN_AUTH, passcode.trim(), (err: Error | null, res: { ok: boolean; error?: string }) => {
      setChecking(false);
      if (err) {
        setAuthError('Server did not respond. Ensure backend server is running.');
        return;
      }
      if (res?.ok) {
        saveAdminCode(passcode.trim());
        setAuthed(true);
      } else {
        setAuthError(res?.error || 'Invalid Host Passcode.');
      }
    });
  };

  const handleLogout = () => {
    socket.emit(SOCKET_EVENTS.ADMIN_LEAVE);
    clearAdminCode();
    setAuthed(false);
    onBackHome();
  };

  if (!authed) {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#060709]">
        <EclipseSky />
        <div className="relative z-10 w-full max-w-sm bg-[#0c0910]/95 border border-red-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBackHome}
              className="text-gray-400 hover:text-white font-cinzel text-xs tracking-wider"
            >
              ← BACK
            </button>
            <span className="font-cinzel text-[10px] tracking-[0.25em] text-red-500 font-bold uppercase">
              HOST PORTAL
            </span>
          </div>

          <h2 className="font-cinzel text-2xl font-bold tracking-[0.2em] text-white uppercase text-center mb-2">
            HOST ACCESS
          </h2>
          <p className="font-body text-xs text-gray-400 text-center mb-6">
            Enter host passcode to oversee match telemetry, configure rules, or export standings.
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              placeholder="Host Passcode (default: ECLIPSE2026)"
              className="w-full py-3 px-4 rounded-xl bg-black/60 border border-red-950/80 focus:border-red-500 font-mono text-sm text-white outline-none"
              autoFocus
            />

            {authError && (
              <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-600 text-red-200 font-mono text-xs text-center">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={checking}
              className="w-full py-3.5 rounded-xl font-cinzel font-bold text-xs tracking-[0.2em] text-white uppercase bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#7f1d1d] border border-red-500/50 hover:brightness-110 transition-all"
            >
              {checking ? 'VERIFYING...' : 'UNLOCK DASHBOARD ▶'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#060709] text-gray-100">
      {/* Top Host Nav Strip */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-red-950/60 bg-[#08060b] flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3.5 py-1.5 rounded-lg font-cinzel text-xs font-bold tracking-wider uppercase transition-colors ${
              activeTab === 'live'
                ? 'bg-red-700 text-white'
                : 'bg-black/40 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            Live Dashboard
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-3.5 py-1.5 rounded-lg font-cinzel text-xs font-bold tracking-wider uppercase transition-colors ${
              activeTab === 'setup'
                ? 'bg-red-700 text-white'
                : 'bg-black/40 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            Match Config &amp; Questions
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProjector}
            className="px-3 py-1.5 rounded-lg font-cinzel text-xs font-bold tracking-wider uppercase text-amber-300 bg-amber-950/30 border border-amber-700/50 hover:bg-amber-900/40"
          >
            Projector View
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg font-cinzel text-xs font-bold tracking-wider uppercase text-gray-300 bg-black/50 border border-gray-800 hover:text-white"
          >
            Exit Host
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'live' ? (
          <HostLiveDashboard
            players={players}
            status={status}
            matchCode={matchCode}
            globalTimeLeft={globalTimeLeft}
            onSetStatus={s => socket.emit(SOCKET_EVENTS.HOST_SET_STATUS, s)}
            onStartGlobalTimer={sec => socket.emit(SOCKET_EVENTS.HOST_START_GLOBAL_TIMER, sec)}
            onDisqualify={id => socket.emit(SOCKET_EVENTS.HOST_DISQUALIFY, id)}
            onResetAll={() => socket.emit(SOCKET_EVENTS.HOST_RESET_ALL)}
          />
        ) : (
          <HostCreateScreen
            config={config}
            matchCode={matchCode}
            validationReports={validationReports}
            onSaveConfig={cfg => socket.emit(SOCKET_EVENTS.HOST_CREATE_OR_UPDATE_CONFIG, cfg)}
            onRegenerateCode={() => socket.emit(SOCKET_EVENTS.HOST_REGEN_CODE)}
            onUploadQuestions={(rawText, targetGroup: YearGroup | 'both', cb) =>
              socket.emit(SOCKET_EVENTS.HOST_UPLOAD_QUESTIONS, { rawText, targetGroup }, cb)
            }
          />
        )}
      </div>
    </div>
  );
}
