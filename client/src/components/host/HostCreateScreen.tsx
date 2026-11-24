/**
 * xe2 – Host: Create Match & Configuration Screen
 * Features:
 *  - Match config form (timers, levels, room fractions, optional params)
 *  - Displays generated match code
 *  - Upload questions (CSV/JSON)
 *  - Validation report + coverage heatmap
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchConfig } from '../../types/game';
import { DEFAULT_CONFIG, GAME_NAME } from '../../types/game';
import CoverageHeatmap from './CoverageHeatmap';

interface HostCreateScreenProps {
  onMatchCreated?: (code: string, config: MatchConfig) => void;
}

interface ValidationResult {
  loaded: number;
  difficulties: number[];
  perDifficulty: Record<number, number>;
  warnings: string[];
  errors: string[];
}

function generateCode() {
  return Array.from({ length: 6 }, () =>
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
  ).join('');
}

function computeValidation(raw: string): ValidationResult | null {
  try {
    const qs = JSON.parse(raw);
    if (!Array.isArray(qs)) return null;
    const perDiff: Record<number, number> = {};
    qs.forEach((q: { difficulty?: number }) => {
      const d = q.difficulty ?? 1;
      perDiff[d] = (perDiff[d] ?? 0) + 1;
    });
    const diffs = Object.keys(perDiff).map(Number).sort((a, b) => a - b);
    const warnings: string[] = [];
    const errors: string[] = [];
    for (let d = 1; d <= 60; d++) {
      const cnt = perDiff[d] ?? 0;
      if (cnt === 0) errors.push(`Difficulty ${d}: no questions`);
      else if (cnt < 4) warnings.push(`Difficulty ${d}: only ${cnt} question(s) (< 4)`);
    }
    return { loaded: qs.length, difficulties: diffs, perDifficulty: perDiff, warnings, errors };
  } catch {
    return null;
  }
}

export default function HostCreateScreen({ onMatchCreated }: HostCreateScreenProps) {
  const [config, setConfig] = useState<MatchConfig>({ ...DEFAULT_CONFIG });
  const [matchCode] = useState(generateCode);
  const [_uploadContent, setUploadContent] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tab, setTab] = useState<'config' | 'questions'>('config');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setUploadContent(text);
      const v = computeValidation(text);
      if (!v) setUploadError('Invalid JSON format. Expected array of question objects.');
      else setValidation(v);
    };
    reader.readAsText(file);
  };

  const patchConfig = (patch: Partial<MatchConfig>) =>
    setConfig(c => ({ ...c, ...patch }));

  const handleCreate = () => {
    setShowCode(true);
    onMatchCreated?.(matchCode, config);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(matchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#060709] overflow-hidden">
      {/* Header */}
      <div className="relative z-10 px-5 pt-5 pb-3 border-b border-red-950/60 bg-[#08060b]/80 flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-lg font-extrabold tracking-[0.2em] text-white uppercase">
            {GAME_NAME}
          </h1>
          <p className="font-cinzel text-[10px] text-red-500 tracking-[0.3em] font-bold uppercase mt-0.5">
            Host — Create Match
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-800 to-red-500 flex items-center justify-center font-cinzel text-xs font-bold text-white border border-red-400 shadow-[0_0_12px_rgba(225,29,72,0.5)]">
          H
        </div>
      </div>

      {/* Tab switcher */}
      <div className="relative z-10 flex border-b border-red-950/50">
        {(['config', 'questions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 font-cinzel text-xs font-bold tracking-wider uppercase transition-all ${
              tab === t
                ? 'text-red-400 border-b-2 border-red-500 bg-red-950/20'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'config' ? '⚙️ Configuration' : '📋 Questions'}
          </button>
        ))}
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {tab === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Match Code Preview */}
              <div className="bg-[#0e0a12] border border-red-950/80 rounded-2xl p-4">
                <div className="font-cinzel text-[10px] text-gray-500 tracking-wider uppercase mb-2">Match Code</div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-3xl font-black text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    {matchCode}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="text-xs font-mono text-gray-400 hover:text-white bg-black/40 border border-gray-800 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    {copied ? '✓ Copied' : '📋'}
                  </button>
                </div>
                <p className="font-body text-xs text-gray-600 mt-2">Share this code with players to join.</p>
              </div>

              {/* Config Fields */}
              {[
                { label: 'Main Timer (seconds)', key: 'mainTimerSec', min: 15, max: 120, step: 5 },
                { label: 'Room Timer (seconds)', key: 'roomTimerSec', min: 10, max: 60, step: 5 },
                { label: 'Total Levels', key: 'totalLevels', min: 10, max: 60, step: 10 },
                { label: 'Rooms Per Level', key: 'roomsPerLevel', min: 1, max: 4, step: 1 },
              ].map(({ label, key, min, max, step }) => (
                <div key={key} className="bg-[#0e0a12] border border-red-950/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-cinzel text-[11px] text-gray-400 uppercase tracking-wider">{label}</label>
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
                  <div className="flex justify-between font-mono text-[9px] text-gray-700 mt-1">
                    <span>{min}</span><span>{max}</span>
                  </div>
                </div>
              ))}

              {/* Room Difficulty Fractions */}
              <div className="bg-[#0e0a12] border border-red-950/50 rounded-xl p-4">
                <div className="font-cinzel text-[11px] text-gray-400 uppercase tracking-wider mb-3">
                  Room Difficulty Fractions
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {config.roomDifficultyFractions.map((f, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <span className="font-cinzel text-[10px] text-gray-500">R{i + 1}</span>
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
                        className="w-full text-center bg-black/40 border border-gray-800 rounded-lg py-2 font-mono text-sm text-red-400 font-bold outline-none focus:border-red-700"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional params */}
              <div className="bg-[#0e0a12] border border-red-950/50 rounded-xl p-4 space-y-3">
                <div className="font-cinzel text-[11px] text-gray-400 uppercase tracking-wider">Optional</div>
                <div className="flex items-center justify-between">
                  <label className="font-body text-xs text-gray-400">Match Duration (minutes)</label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={config.matchDurationMinutes ?? ''}
                    onChange={e => patchConfig({ matchDurationMinutes: e.target.value ? Number(e.target.value) : null })}
                    className="w-20 text-right bg-black/40 border border-gray-800 rounded-lg py-1 px-2 font-mono text-sm text-gray-200 outline-none focus:border-red-700"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="font-body text-xs text-gray-400">Max Main Fails Per Level</label>
                  <input
                    type="number"
                    placeholder="off"
                    value={config.maxMainFailsPerLevel ?? ''}
                    onChange={e => patchConfig({ maxMainFailsPerLevel: e.target.value ? Number(e.target.value) : null })}
                    className="w-20 text-right bg-black/40 border border-gray-800 rounded-lg py-1 px-2 font-mono text-sm text-gray-200 outline-none focus:border-red-700"
                  />
                </div>
              </div>

              {/* Create button */}
              <button
                onClick={handleCreate}
                className="w-full py-4 rounded-xl font-cinzel font-extrabold text-sm tracking-[0.25em] text-white uppercase bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#7f1d1d] border border-red-500/50 shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
              >
                CREATE MATCH ▶
              </button>

              {/* Show code overlay */}
              <AnimatePresence>
                {showCode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-6"
                    onClick={() => setShowCode(false)}
                  >
                    <div className="bg-[#0e0a12] border border-red-700 rounded-3xl p-8 text-center shadow-2xl max-w-xs w-full"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="text-4xl mb-3">🎮</div>
                      <h3 className="font-cinzel text-lg font-bold text-white mb-1">Match Created!</h3>
                      <p className="font-body text-xs text-gray-400 mb-6">Share this code with players:</p>
                      <div className="font-mono text-4xl font-black text-red-400 tracking-[0.3em] mb-6 drop-shadow-[0_0_15px_rgba(225,29,72,0.7)]">
                        {matchCode}
                      </div>
                      <button
                        onClick={() => setShowCode(false)}
                        className="w-full py-3 rounded-xl font-cinzel text-xs font-bold tracking-wider text-white uppercase bg-red-700 hover:bg-red-600 transition-colors"
                      >
                        Got it — Go to Dashboard
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
              {/* Upload area */}
              <div
                className="relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors"
                style={{ borderColor: '#2a1419', background: '#0e0a12' }}
              >
                <div className="text-3xl mb-3">📂</div>
                <p className="font-cinzel text-xs text-gray-400 tracking-wider mb-4">
                  Upload questions as JSON or CSV
                </p>
                <label className="py-2.5 px-5 rounded-xl font-cinzel text-xs font-bold tracking-wider text-white uppercase bg-red-700 hover:bg-red-600 transition-colors cursor-pointer">
                  Choose File
                  <input type="file" accept=".json,.csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {/* Upload error */}
              {uploadError && (
                <div className="bg-red-950/40 border border-red-700 rounded-xl p-3 text-xs text-red-400 font-mono">
                  ⚠️ {uploadError}
                </div>
              )}

              {/* Validation report */}
              {validation && (
                <div className="bg-[#0e0a12] border border-red-950/80 rounded-2xl p-4 space-y-3">
                  <h4 className="font-cinzel text-xs font-bold tracking-wider text-gray-300 uppercase">Validation Report</h4>
                  <ul className="space-y-2 text-xs font-body">
                    <li className="flex items-center gap-2 text-emerald-400">✔ {validation.loaded} questions loaded</li>
                    <li className="flex items-center gap-2 text-emerald-400">✔ Difficulties: {validation.difficulties[0]} – {validation.difficulties[validation.difficulties.length - 1]}</li>
                    {validation.warnings.length > 0 && (
                      <li className="text-amber-400">⚠️ {validation.warnings.length} difficulty band(s) below 4 questions</li>
                    )}
                    {validation.errors.length > 0 && (
                      <li className="text-red-400">❌ {validation.errors.length} difficulty band(s) with no questions</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Heatmap */}
              {validation && (
                <CoverageHeatmap perDifficulty={validation.perDifficulty} />
              )}

              {!validation && !uploadError && (
                <div className="text-center py-10 text-gray-700 font-cinzel text-xs tracking-wider">
                  Upload a JSON file to see coverage
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
