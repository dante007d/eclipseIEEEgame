import { useState, useEffect, useCallback, type FormEvent } from 'react';
import type { MatchConfig, MatchStatus, PlayerState, ValidationReport, YearGroup } from '../../types/game';
import { GAME_NAME, SOCKET_EVENTS } from '../../types/game';
import { socket, ensureSocketConnected, loadAdminCode, saveAdminCode, clearAdminCode } from '../../lib/socket';
import { getBackendMode, getSupabaseConfigError, tryGetSupabase } from '../../lib/supabaseClient';
import { parseQuestionsForSupabase } from '../../lib/parseQuestionsClient';
import { EclipseStage, GoldDivider } from '../GothicPrimitives';
import HostLiveDashboard from './HostLiveDashboard';
import HostCreateScreen from './HostCreateScreen';

interface HostPortalProps {
  onBackHome: () => void;
  onOpenProjector: () => void;
  globalTimeLeft: number | null;
}

function buildReportFromMap(
  perDifficulty: Record<number, number>,
  targetGroup: YearGroup | 'both' | 'all' = 'all'
): ValidationReport {
  const difficulties = Object.keys(perDifficulty).map(Number).sort((a, b) => a - b);
  const warnings: string[] = [];
  const errors: string[] = [];
  let loaded = 0;
  for (let d = 1; d <= 60; d++) {
    const cnt = perDifficulty[d] ?? 0;
    loaded += cnt;
    if (cnt === 0) errors.push(`Difficulty ${d}: no questions`);
    else if (cnt < 4) warnings.push(`Difficulty ${d}: only ${cnt} question(s) (< 4)`);
  }
  return { loaded, difficulties, perDifficulty, warnings, errors, targetGroup };
}

function mergeDifficultyMaps(
  a?: Record<number, number>,
  b?: Record<number, number>
): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [k, v] of Object.entries(a ?? {})) out[Number(k)] = (out[Number(k)] ?? 0) + Number(v || 0);
  for (const [k, v] of Object.entries(b ?? {})) out[Number(k)] = (out[Number(k)] ?? 0) + Number(v || 0);
  return out;
}

export default function HostPortal({ onBackHome, onOpenProjector, globalTimeLeft }: HostPortalProps) {
  const mode = getBackendMode();

  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'setup'>('live');

  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [matchCode, setMatchCode] = useState('DANTE');
  const [status, setStatus] = useState<MatchStatus>('pending');
  const [config, setConfig] = useState<MatchConfig | undefined>(undefined);
  const [validationReports, setValidationReports] = useState<{
    all?: ValidationReport;
    junior?: ValidationReport;
    senior?: ValidationReport;
  }>({});
  const [supabaseTimerLeft, setSupabaseTimerLeft] = useState<number | null>(null);

  const applyStandingsPayload = useCallback((data: {
    players?: PlayerState[];
    matchCode?: string;
    status?: MatchStatus;
    config?: MatchConfig;
    globalRemainingMs?: number | null;
  }) => {
    if (!data) return;
    setPlayers(data.players || []);
    if (data.matchCode) setMatchCode(data.matchCode);
    if (data.status) setStatus(data.status);
    if (data.config) setConfig(data.config);
    if (data.globalRemainingMs != null) {
      setSupabaseTimerLeft(Math.ceil(data.globalRemainingMs / 1000));
    } else {
      setSupabaseTimerLeft(null);
    }
  }, []);

  const verifyAuth = useCallback(async (codeToVerify: string, silent = false) => {
    if (!silent) setChecking(true);
    setAuthError(null);

    const cfgError = getSupabaseConfigError();
    if (cfgError) {
      setChecking(false);
      if (!silent) setAuthError(cfgError);
      return;
    }

    if (mode === 'supabase') {
      const supabase = tryGetSupabase();
      if (!supabase) {
        setChecking(false);
        if (!silent) setAuthError('Supabase client could not be initialized.');
        return;
      }
      try {
        const { data, error } = await supabase.rpc('eclipse_host_auth', {
          p_admin_code: codeToVerify,
          p_match_code: matchCode,
        });
        setChecking(false);
        if (error || !data?.ok) {
          if (!silent) setAuthError(error?.message || data?.error || 'Invalid Host Passcode.');
          clearAdminCode();
          return;
        }
        saveAdminCode(codeToVerify);
        setAdminSecret(codeToVerify);
        setAuthed(true);
        if (data.standings) applyStandingsPayload(data.standings);
        if (data.perDifficulty) {
          const allMap = data.perDifficulty.all ?? mergeDifficultyMaps(data.perDifficulty.junior, data.perDifficulty.senior);
          setValidationReports({
            all: buildReportFromMap(allMap, 'all'),
            junior: buildReportFromMap(data.perDifficulty.junior || {}, 'junior'),
            senior: buildReportFromMap(data.perDifficulty.senior || {}, 'senior'),
          });
        }
      } catch (e) {
        setChecking(false);
        if (!silent) setAuthError(e instanceof Error ? e.message : 'Supabase auth failed.');
      }
      return;
    }

    ensureSocketConnected();
    socket.timeout(6000).emit(SOCKET_EVENTS.ADMIN_AUTH, codeToVerify, (err: Error | null, res: { ok: boolean; error?: string }) => {
      setChecking(false);
      if (err) {
        if (!silent) setAuthError('Server did not respond. Ensure backend server is running.');
        return;
      }
      if (res?.ok) {
        saveAdminCode(codeToVerify);
        setAdminSecret(codeToVerify);
        setAuthed(true);
      } else {
        clearAdminCode();
        if (!silent) setAuthError(res?.error || 'Invalid Host Passcode.');
      }
    });
  }, [mode, matchCode, applyStandingsPayload]);

  useEffect(() => {
    const saved = loadAdminCode();
    if (saved) verifyAuth(saved, true);
  }, [verifyAuth]);

  useEffect(() => {
    if (mode === 'supabase') {
      if (!authed) return;
      const supabase = tryGetSupabase();
      if (!supabase) return;
      const intervalMs = status === 'pending' ? 1500 : 3000;
      const t = setInterval(async () => {
        try {
          const { data } = await supabase.rpc('eclipse_get_standings', { p_match_code: matchCode });
          if (data?.ok) applyStandingsPayload(data);
        } catch {
          // Ignore transient polling failures
        }
      }, intervalMs);
      return () => clearInterval(t);
    }

    const onLeaderboard = (data: { players: PlayerState[]; matchCode?: string; status?: MatchStatus }) => {
      setPlayers(data.players || []);
      if (data.matchCode) setMatchCode(data.matchCode);
      if (data.status) setStatus(data.status);
    };
    const onMeta = (meta: {
      matchCode: string;
      status: MatchStatus;
      config: MatchConfig;
      validationReports: { all?: ValidationReport; junior?: ValidationReport; senior?: ValidationReport };
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
  }, [mode, authed, status, matchCode, applyStandingsPayload]);

  const handleAuth = (e: FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    verifyAuth(passcode.trim(), false);
  };

  const handleLogout = () => {
    if (mode === 'socket') socket.emit(SOCKET_EVENTS.ADMIN_LEAVE);
    clearAdminCode();
    setAuthed(false);
    onBackHome();
  };

  const runHostAction = async (action: string, payload: Record<string, unknown> = {}) => {
    if (mode !== 'supabase') return;
    const supabase = tryGetSupabase();
    if (!supabase) return;
    const targetCode = matchCode;
    const { data } = await supabase.rpc('eclipse_host_action', {
      p_admin_code: adminSecret,
      p_match_code: targetCode,
      p_action: action,
      p_payload: payload,
    });
    if (data?.ok && data.standings) {
      applyStandingsPayload(data.standings);
      if (action === 'set_status' || action === 'start_timer' || action === 'reset_all') {
        try {
          const ch = supabase.channel(`eclipse:match:${data.standings.matchCode || targetCode}`);
          await ch.send({
            type: 'broadcast',
            event: 'match_signal',
            payload: {
              status: data.standings.status,
              globalRemainingMs: data.standings.globalRemainingMs ?? null,
              reset: action === 'reset_all',
              at: Date.now(),
            },
          });
          supabase.removeChannel(ch);
        } catch {
          // Polling fallback handles status sync if realtime channel send fails
        }
      }
    }
  };

  if (!authed) {
    return (
      <EclipseStage
        backgroundImage="/images/recovery-guardian.jpg"
        overlayClassName="bg-gradient-to-b from-black/45 via-black/65 to-black/90"
        maxWidthClass="max-w-lg"
      >
        <div className="flex-1 flex flex-col justify-between p-5 sm:p-6">
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onBackHome}
              className="w-10 h-10 rounded-full bg-black/60 border border-[#c69c5d]/55 text-[#e6d7be] hover:text-white flex items-center justify-center"
              aria-label="Back"
            >
              ←
            </button>
            <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#e6c48a] uppercase">
              HOST PORTAL ({mode.toUpperCase()})
            </span>
          </div>

          <div className="my-auto gothic-panel rounded-2xl p-6 text-center">
            <h2 className="font-cinzel text-2xl font-bold tracking-[0.2em] text-[#f3ece0] uppercase">
              HOST ACCESS
            </h2>
            <GoldDivider className="my-3 w-40 mx-auto" />
            <p className="font-body text-xs text-gray-300 mb-5">
              Enter host passcode to oversee match telemetry, configure rules, or export standings.
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="password"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="Enter command passcode"
                className="w-full py-3 px-4 bg-[#030204] border border-[#c69c5d]/65 focus:border-[#ff0033] font-mono text-sm text-white outline-none"
                autoFocus
              />

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500 text-red-200 font-mono text-xs">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={checking}
                className="eclipse-btn-crimson w-full py-3.5 rounded-xl font-cinzel font-bold text-xs tracking-[0.2em] uppercase"
              >
                {checking ? 'VERIFYING...' : 'UNLOCK DASHBOARD ▶'}
              </button>
            </form>
          </div>
          <div className="h-4" />
        </div>
      </EclipseStage>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row bg-[#050406] text-gray-100 overflow-hidden">
      {/* Subtle full-bleed Eclipse Hall artwork */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center opacity-25 pointer-events-none"
        style={{ backgroundImage: 'url(/images/arena-hall.jpg)' }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-br from-black/75 via-black/85 to-black/92 pointer-events-none"
      />

      {/* Left Sidebar Rail */}
      <aside className="relative z-10 w-full md:w-64 bg-[#070407] border-b md:border-b-0 md:border-r border-[#c69c5d]/40 p-5 flex flex-col justify-between">
        <div>
          <div className="mb-6">
            <h2 className="font-cinzel text-lg font-bold tracking-[0.2em] text-[#f3ece0] uppercase">
              {GAME_NAME}
            </h2>
            <p className="font-cinzel text-[10px] tracking-[0.25em] text-red-500 font-semibold uppercase mt-0.5">
              HOST DASHBOARD
            </p>
          </div>

          <nav className="flex md:flex-col gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-semibold tracking-wider flex items-center gap-2.5 text-left transition-all whitespace-nowrap ${
                activeTab === 'live'
                  ? 'eclipse-btn-crimson'
                  : 'text-[#cbbba0] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>🎮</span>
              <span>Match Control</span>
            </button>

            <button
              onClick={() => setActiveTab('setup')}
              className={`px-4 py-2.5 rounded-xl font-cinzel text-xs font-semibold tracking-wider flex items-center gap-2.5 text-left transition-all whitespace-nowrap ${
                activeTab === 'setup'
                  ? 'eclipse-btn-crimson'
                  : 'text-[#cbbba0] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>❓</span>
              <span>Rules &amp; Questions</span>
            </button>

            <button
              onClick={onOpenProjector}
              className="px-4 py-2.5 rounded-xl font-cinzel text-xs font-semibold tracking-wider flex items-center gap-2.5 text-left text-amber-300 hover:bg-amber-950/30 transition-all whitespace-nowrap"
            >
              <span>📊</span>
              <span>Projector View</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 mt-4 border-t border-[#c69c5d]/20 hidden md:block">
          <button
            onClick={handleLogout}
            className="eclipse-btn-obsidian w-full py-2.5 px-3 rounded-xl font-cinzel text-xs tracking-wider uppercase"
          >
            Exit Host
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {activeTab === 'live' ? (
          <HostLiveDashboard
            players={players}
            status={status}
            matchCode={matchCode}
            globalTimeLeft={mode === 'supabase' ? supabaseTimerLeft : globalTimeLeft}
            onSetStatus={s =>
              mode === 'supabase'
                ? runHostAction('set_status', { status: s })
                : socket.emit(SOCKET_EVENTS.HOST_SET_STATUS, s)
            }
            onStartGlobalTimer={sec =>
              mode === 'supabase'
                ? runHostAction('start_timer', { seconds: sec })
                : socket.emit(SOCKET_EVENTS.HOST_START_GLOBAL_TIMER, sec)
            }
            onDisqualify={id =>
              mode === 'supabase'
                ? runHostAction('disqualify', { playerId: id })
                : socket.emit(SOCKET_EVENTS.HOST_DISQUALIFY, id)
            }
            onResetAll={() =>
              mode === 'supabase'
                ? runHostAction('reset_all')
                : socket.emit(SOCKET_EVENTS.HOST_RESET_ALL)
            }
          />
        ) : (
          <HostCreateScreen
            config={config}
            matchCode={matchCode}
            validationReports={validationReports}
            onSaveConfig={cfg =>
              mode === 'supabase'
                ? runHostAction('update_config', cfg as unknown as Record<string, unknown>)
                : socket.emit(SOCKET_EVENTS.HOST_CREATE_OR_UPDATE_CONFIG, cfg)
            }
            onRegenerateCode={() =>
              mode === 'supabase'
                ? runHostAction('regen_code')
                : socket.emit(SOCKET_EVENTS.HOST_REGEN_CODE)
            }
            onUploadQuestions={async (rawText, targetGroup: YearGroup | 'both' | 'all', cb) => {
              if (mode === 'supabase') {
                const parsed = parseQuestionsForSupabase(rawText);
                if (!parsed.ok || !parsed.questions) {
                  cb({ ok: false, error: parsed.error });
                  return;
                }
                await runHostAction('upload_questions', { targetGroup, questions: parsed.questions });
                const perDiff: Record<number, number> = {};
                parsed.questions.forEach(q => { perDiff[q.lv] = (perDiff[q.lv] ?? 0) + 1; });
                const report = buildReportFromMap(perDiff, targetGroup);
                setValidationReports(prev => ({
                  all: targetGroup === 'all' || targetGroup === 'both' ? report : prev.all,
                  junior: targetGroup !== 'senior' ? report : prev.junior,
                  senior: targetGroup !== 'junior' ? report : prev.senior,
                }));
                cb({ ok: true, report });
              } else {
                socket.emit(SOCKET_EVENTS.HOST_UPLOAD_QUESTIONS, { rawText, targetGroup }, cb);
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
