import { useState, useEffect, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchConfig, ValidationReport, YearGroup } from '../../types/game';
import { DEFAULT_CONFIG, GAME_NAME } from '../../types/game';
import CoverageHeatmap from './CoverageHeatmap';

interface HostCreateScreenProps {
  config?: MatchConfig;
  matchCode?: string;
  validationReports?: { all?: ValidationReport; junior?: ValidationReport; senior?: ValidationReport };
  onSaveConfig?: (cfg: MatchConfig) => void;
  onUploadQuestions?: (rawText: string, targetGroup: YearGroup | 'both' | 'all', cb: (res: { ok: boolean; error?: string; report?: ValidationReport }) => void) => void;
  onRegenerateCode?: () => void;
}

export default function HostCreateScreen({
  config: propConfig,
  matchCode = 'DANTE',
  validationReports,
  onSaveConfig,
  onUploadQuestions,
  onRegenerateCode,
}: HostCreateScreenProps) {
  const [config, setConfig] = useState<MatchConfig>(propConfig ?? { ...DEFAULT_CONFIG });
  const [tab, setTab] = useState<'config' | 'questions'>('config');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealCode, setRevealCode] = useState(false);

  useEffect(() => {
    if (propConfig) setConfig(propConfig);
  }, [propConfig]);

  const activeReport: ValidationReport | undefined =
    validationReports?.all ?? validationReports?.junior ?? validationReports?.senior;

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadNotice(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? '');
      if (onUploadQuestions) {
        onUploadQuestions(text, 'all', (res) => {
          if (!res.ok) {
            setUploadError(res.error || 'Upload validation failed.');
          } else {
            setUploadNotice(`Loaded ${res.report?.loaded ?? 0} questions into the Unified Pool!`);
          }
        });
      }
    };
    reader.readAsText(file);
  };

  const patchConfig = (patch: Partial<MatchConfig>) =>
    setConfig(c => ({ ...c, ...patch }));

  const handleSave = () => {
    onSaveConfig?.(config);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(matchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Sub-header */}
      <div className="relative z-10 px-5 py-3 border-b border-[#c69c5d]/35 bg-[#070407] flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-sm font-extrabold tracking-[0.2em] text-white uppercase">
            {GAME_NAME} // RULES & BANK
          </h2>
        </div>
        <div className="flex gap-2">
          {(['config', 'questions'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg font-cinzel text-xs font-bold tracking-wider uppercase transition-all ${
                tab === t
                  ? 'text-white bg-red-800 border border-red-500'
                  : 'text-gray-400 bg-black/40 border border-gray-800 hover:text-gray-200'
              }`}
            >
              {t === 'config' ? 'Rules & Timers' : 'Question Bank'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-5 max-w-4xl w-full mx-auto">
        <AnimatePresence mode="wait">
          {tab === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Match Code Card (Hidden by default) */}
              <div className="bg-[#080508] border border-[#c69c5d]/40 p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] text-gray-400 tracking-wider uppercase mb-1">Active Match Code</div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-bold text-[#e6c48a] tracking-widest">
                      {revealCode ? matchCode : '•••••'}
                    </span>
                    <button
                      onClick={() => setRevealCode(v => !v)}
                      className="text-xs font-mono text-gray-300 hover:text-white bg-black border border-[#c69c5d]/40 px-2.5 py-1.5 transition-colors"
                    >
                      {revealCode ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={handleCopy}
                      className="text-xs font-mono text-gray-300 hover:text-white bg-black border border-gray-800 px-2.5 py-1.5 transition-colors"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                {onRegenerateCode && (
                  <button
                    onClick={onRegenerateCode}
                    className="px-3.5 py-2 rounded-xl font-cinzel text-xs font-bold tracking-wider uppercase text-amber-300 bg-amber-950/30 border border-amber-700/60 hover:bg-amber-900/40 transition-colors"
                  >
                    Regenerate Code
                  </button>
                )}
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Main Timer (seconds)', key: 'mainTimerSec', min: 15, max: 120, step: 5 },
                  { label: 'Room Timer (seconds)', key: 'roomTimerSec', min: 10, max: 90, step: 5 },
                  { label: 'Total Levels', key: 'totalLevels', min: 5, max: 60, step: 5 },
                  { label: 'Rooms Per Level', key: 'roomsPerLevel', min: 1, max: 4, step: 1 },
                ].map(({ label, key, min, max, step }) => (
                  <div key={key} className="bg-[#0e0a12] border border-red-950/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-cinzel text-[11px] text-gray-300 uppercase tracking-wider">{label}</label>
                      <span className="font-mono text-sm font-bold text-red-400">
                        {config[key as keyof MatchConfig] as number}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={config[key as keyof MatchConfig] as number}
                      onChange={e => patchConfig({ [key]: Number(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                    <div className="flex justify-between font-mono text-[9px] text-gray-600 mt-1">
                      <span>{min}</span><span>{max}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Room Difficulty Fractions */}
              <div className="bg-[#0e0a12] border border-red-950/50 rounded-xl p-4">
                <div className="font-cinzel text-[11px] text-gray-300 uppercase tracking-wider mb-3">
                  Room Difficulty Fractions (relative to current level)
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {config.roomDifficultyFractions.map((f, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <span className="font-cinzel text-[10px] text-gray-400">Room {i + 1}</span>
                      <input
                        type="number"
                        min={0.1}
                        max={1}
                        step={0.1}
                        value={f}
                        onChange={e => {
                          const updated = [...config.roomDifficultyFractions];
                          updated[i] = Number(e.target.value);
                          patchConfig({ roomDifficultyFractions: updated });
                        }}
                        className="w-full text-center bg-black/50 border border-gray-800 rounded-lg py-2 font-mono text-sm text-red-400 font-bold outline-none focus:border-red-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Mode & Optional Rules */}
              <div className="bg-[#0e0a12] border border-red-950/50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-cinzel text-[11px] text-gray-300 uppercase tracking-wider">Room Recovery Behaviour</div>
                    <div className="font-body text-xs text-gray-500 mt-0.5">
                      What happens when a player answers Room 1–4 correctly
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => patchConfig({ returnMode: 'same_question' })}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors ${
                        config.returnMode === 'same_question'
                          ? 'bg-red-800 border-red-500 text-white'
                          : 'bg-black/40 border-gray-800 text-gray-400'
                      }`}
                    >
                      Same Level (Variant)
                    </button>
                    <button
                      type="button"
                      onClick={() => patchConfig({ returnMode: 'next_level' })}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors ${
                        config.returnMode === 'next_level'
                          ? 'bg-red-800 border-red-500 text-white'
                          : 'bg-black/40 border-gray-800 text-gray-400'
                      }`}
                    >
                      Advance Level + 1
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-900 pt-3">
                  <label className="font-body text-xs text-gray-300">Max Main Fails Per Level (anti-stall)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    placeholder="Off"
                    value={config.maxMainFailsPerLevel ?? ''}
                    onChange={e => patchConfig({ maxMainFailsPerLevel: e.target.value ? Number(e.target.value) : null })}
                    className="w-24 text-right bg-black/50 border border-gray-800 rounded-lg py-1.5 px-3 font-mono text-sm text-gray-200 outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-xl font-cinzel font-extrabold text-sm tracking-[0.2em] text-white uppercase bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#7f1d1d] border border-red-500/50 shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:brightness-110 transition-all"
              >
                {savedNotice ? '✓ LIVE CONFIG APPLIED' : 'APPLY LIVE CONFIGURATION ▶'}
              </button>
            </motion.div>
          )}

          {tab === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {/* Bank Info Header */}
              <div className="flex items-center justify-between bg-[#0e0a12] border border-[#c69c5d]/25 rounded-2xl p-4 flex-wrap gap-3">
                <div>
                  <span className="font-cinzel text-xs font-bold tracking-wider text-[#e6c48a] uppercase">
                    Unified Tournament Question Bank
                  </span>
                  <p className="font-mono text-[11px] text-gray-400 mt-0.5">
                    Shared pool for all participants across Levels 1–60 and Recovery Rooms
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg font-mono text-xs bg-red-900/40 border border-red-500/50 text-red-200">
                  UNIFIED POOL
                </span>
              </div>

              {/* Upload area */}
              <div className="relative border-2 border-dashed border-[#c69c5d]/35 bg-[#0e0a12] rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">📂</div>
                <p className="font-cinzel text-xs text-gray-200 tracking-wider mb-1">
                  Replace Unified Question Bank via JSON or CSV
                </p>
                <p className="font-mono text-[11px] text-gray-400 mb-4">
                  Default 229-question Ouroboros bank is active across levels 1–60.
                </p>
                <label className="inline-block py-2.5 px-5 rounded-xl font-cinzel text-xs font-bold tracking-wider text-white uppercase bg-red-700 hover:bg-red-600 transition-colors cursor-pointer">
                  Upload JSON / CSV
                  <input type="file" accept=".json,.csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {uploadError && (
                <div className="bg-red-950/40 border border-red-700 rounded-xl p-3 text-xs text-red-300 font-mono">
                  ⚠ {uploadError}
                </div>
              )}
              {uploadNotice && (
                <div className="bg-emerald-950/40 border border-emerald-700 rounded-xl p-3 text-xs text-emerald-300 font-mono">
                  ✔ {uploadNotice}
                </div>
              )}

              {activeReport && (
                <>
                  <div className="bg-[#0e0a12] border border-[#c69c5d]/25 rounded-2xl p-4 space-y-2">
                    <h4 className="font-cinzel text-xs font-bold tracking-wider text-gray-300 uppercase">
                      Bank Coverage Report (ALL LEVELS)
                    </h4>
                    <ul className="space-y-1.5 text-xs font-mono tabular-nums">
                      <li className="text-emerald-400">✔ {activeReport.loaded} active questions loaded (Levels 1–60)</li>
                      <li className="text-amber-400">⚠ {activeReport.warnings.length} difficulty band(s) have fewer than 4 variants</li>
                      {activeReport.errors.length > 0 && (
                        <li className="text-red-400">✖ {activeReport.errors.length} difficulty band(s) missing questions</li>
                      )}
                    </ul>
                  </div>

                  <CoverageHeatmap perDifficulty={activeReport.perDifficulty} />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
