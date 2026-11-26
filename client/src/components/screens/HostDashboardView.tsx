import { useState } from 'react';

interface HostDashboardProps {
  onBackToApp: () => void;
}

export default function HostDashboardView({ onBackToApp }: HostDashboardProps) {
  const [activeTab, setActiveTab] = useState<'match' | 'questions'>('match');
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText('A7K3P9');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const menuItems = [
    { id: 'match', label: 'Match', icon: '🎮' },
    { id: 'questions', label: 'Questions', icon: '❓' },
    { id: 'players', label: 'Players', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'export', label: 'Export', icon: '💾' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="w-full min-h-[720px] bg-[#070508] text-gray-200 rounded-3xl border border-red-950/80 shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <div className="w-full md:w-64 bg-[#09070c] border-b md:border-b-0 md:border-r border-red-950/60 p-5 flex flex-col justify-between">
        <div>
          {/* Logo / Header */}
          <div className="mb-6">
            <h2 className="font-cinzel text-lg font-bold tracking-[0.2em] text-white uppercase">
              PROJECT ECLIPSE
            </h2>
            <p className="font-cinzel text-[10px] tracking-[0.25em] text-red-500 font-semibold uppercase mt-0.5">
              HOST DASHBOARD
            </p>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'match' || item.id === 'questions') {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-cinzel text-xs font-semibold tracking-wider flex items-center gap-3 text-left transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#991b1b] to-[#7f1d1d] text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] border border-red-500/40'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#120e16]'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Back to Mobile App */}
        <div className="pt-6 border-t border-red-950/40 mt-6">
          <button
            onClick={onBackToApp}
            className="w-full py-2 px-3 rounded-xl font-cinzel text-xs text-red-400 hover:text-white border border-red-950/80 hover:bg-red-950/40 transition-colors flex items-center justify-center gap-2"
          >
            <span>📱</span>
            <span>Switch to Mobile App</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gradient-to-br from-[#070508] via-[#0b080f] to-[#12070c]">
        {activeTab === 'match' ? (
          /* Match Control Panel (Screen 7 in image) */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-cinzel text-xl font-bold tracking-wider text-white">
                Match Control
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 border border-emerald-500 text-emerald-400 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>

            {/* Match Code Box & Controls */}
            <div className="bg-[#0e0a12]/90 border border-red-950/80 rounded-2xl p-6 shadow-xl mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-cinzel text-xs text-gray-400 tracking-wider mb-1">
                    Match Code
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-3xl font-extrabold text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                      A7K3P9
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="text-gray-400 hover:text-white p-2 rounded-lg bg-black/40 border border-gray-800 transition-colors text-xs font-mono"
                      title="Copy Code"
                    >
                      {copied ? '✓ Copied' : '📋'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="py-2.5 px-5 rounded-xl font-cinzel text-xs font-bold tracking-wider bg-[#1a1420] border border-gray-700 hover:border-gray-500 text-gray-200 transition-colors flex items-center gap-2"
                  >
                    <span>{isPaused ? '▶ Resume' : '⏸ Pause'}</span>
                  </button>
                  <button className="py-2.5 px-5 rounded-xl font-cinzel text-xs font-bold tracking-wider bg-red-950/60 border border-red-700/80 hover:bg-red-900/60 text-red-300 transition-colors flex items-center gap-2">
                    <span>⏹ End</span>
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-red-950/50">
                <div className="bg-[#08060a] border border-gray-900 rounded-xl p-3 text-center">
                  <div className="font-cinzel text-[10px] text-gray-400 tracking-wider uppercase mb-1">
                    Players
                  </div>
                  <div className="font-mono text-2xl font-bold text-white">24</div>
                </div>
                <div className="bg-[#08060a] border border-gray-900 rounded-xl p-3 text-center">
                  <div className="font-cinzel text-[10px] text-gray-400 tracking-wider uppercase mb-1">
                    Avg. Level
                  </div>
                  <div className="font-mono text-2xl font-bold text-amber-400">18.4</div>
                </div>
                <div className="bg-[#08060a] border border-gray-900 rounded-xl p-3 text-center">
                  <div className="font-cinzel text-[10px] text-gray-400 tracking-wider uppercase mb-1">
                    Resets
                  </div>
                  <div className="font-mono text-2xl font-bold text-red-500">7</div>
                </div>
                <div className="bg-[#08060a] border border-gray-900 rounded-xl p-3 text-center">
                  <div className="font-cinzel text-[10px] text-gray-400 tracking-wider uppercase mb-1">
                    Finished
                  </div>
                  <div className="font-mono text-2xl font-bold text-emerald-400">0</div>
                </div>
              </div>
            </div>

            {/* Match Config */}
            <div className="bg-[#0e0a12]/90 border border-red-950/80 rounded-2xl p-6 shadow-xl">
              <h4 className="font-cinzel text-sm font-bold tracking-wider text-gray-300 mb-4 uppercase">
                Match Config
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-[#08060a] border border-gray-900 p-3 rounded-xl">
                  <div className="text-[10px] font-cinzel text-gray-400 uppercase">Total Levels</div>
                  <div className="font-mono text-lg font-bold text-white mt-1">60</div>
                </div>
                <div className="bg-[#08060a] border border-gray-900 p-3 rounded-xl">
                  <div className="text-[10px] font-cinzel text-gray-400 uppercase">Rooms per Level</div>
                  <div className="font-mono text-lg font-bold text-white mt-1">4</div>
                </div>
                <div className="bg-[#08060a] border border-gray-900 p-3 rounded-xl">
                  <div className="text-[10px] font-cinzel text-gray-400 uppercase">Main Timer</div>
                  <div className="font-mono text-lg font-bold text-amber-400 mt-1">60s</div>
                </div>
                <div className="bg-[#08060a] border border-gray-900 p-3 rounded-xl">
                  <div className="text-[10px] font-cinzel text-gray-400 uppercase">Room Timer</div>
                  <div className="font-mono text-lg font-bold text-red-400 mt-1">60s</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Questions & Validation Heatmap Panel (Screen 8 in image) */
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setActiveTab('match')}
                className="font-cinzel text-xs text-gray-400 hover:text-white flex items-center gap-1.5"
              >
                ← Questions
              </button>
              <div className="flex gap-2">
                <button className="py-2 px-3 rounded-xl font-cinzel text-xs text-gray-200 bg-[#17121d] border border-gray-700 hover:border-gray-500 transition-colors flex items-center gap-1.5">
                  <span>📥</span>
                  <span>Import (CSV/JSON)</span>
                </button>
                <button className="py-2 px-3 rounded-xl font-cinzel text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors flex items-center gap-1">
                  <span>+</span>
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Coverage Heatmap */}
            <div className="bg-[#0e0a12]/90 border border-red-950/80 rounded-2xl p-6 shadow-xl mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-cinzel text-xs font-bold tracking-wider text-gray-300 uppercase">
                  Coverage Heatmap (Questions per Difficulty)
                </h4>
                <div className="flex gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-red-400">
                    <span className="w-2.5 h-2.5 bg-red-600 rounded-sm inline-block" /> ≥ 4 (OK)
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2.5 h-2.5 bg-amber-600 rounded-sm inline-block" /> 2 - 3 (Low)
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <span className="w-2.5 h-2.5 bg-gray-800 rounded-sm inline-block" /> &lt; 2 (Critical)
                  </span>
                </div>
              </div>

              {/* 60 Levels Heatmap Grid */}
              <div className="grid grid-cols-12 sm:grid-cols-20 gap-1.5 py-2">
                {Array.from({ length: 60 }).map((_, i) => {
                  const lvl = i + 1;
                  const isLow = [14, 28, 39, 44, 52, 57].includes(lvl);
                  return (
                    <div
                      key={lvl}
                      title={`Level ${lvl}`}
                      className={`h-5 rounded-xs transition-transform hover:scale-125 cursor-pointer ${
                        isLow ? 'bg-amber-600/80' : 'bg-red-700/80'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between font-mono text-[10px] text-gray-500 mt-2 px-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
                <span>25</span>
                <span>30</span>
                <span>35</span>
                <span>40</span>
                <span>45</span>
                <span>50</span>
                <span>55</span>
                <span>60</span>
              </div>
            </div>

            {/* Validation Report & Table Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Diff Count Table */}
              <div className="bg-[#0e0a12]/90 border border-red-950/80 rounded-2xl p-5 shadow-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-[10px] font-cinzel">
                      <th className="pb-2">Diff</th>
                      <th className="pb-2">Count</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {[
                      { diff: 1, count: 5, ok: true },
                      { diff: 2, count: 6, ok: true },
                      { diff: 3, count: 4, ok: true },
                      { diff: 4, count: 3, ok: false },
                      { diff: 5, count: 2, ok: false },
                    ].map((row) => (
                      <tr key={row.diff} className="text-gray-300">
                        <td className="py-2.5">{row.diff}</td>
                        <td className="py-2.5 font-bold">{row.count}</td>
                        <td className="py-2.5 text-right">
                          {row.ok ? (
                            <span className="text-emerald-400">✔</span>
                          ) : (
                            <span className="text-red-400">!</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Validation Report Card */}
              <div className="bg-[#0e0a12]/90 border border-red-950/80 rounded-2xl p-5 shadow-xl">
                <h5 className="font-cinzel text-xs font-bold tracking-wider text-gray-300 mb-4 uppercase">
                  Validation Report
                </h5>
                <ul className="space-y-3 font-body text-xs text-gray-300">
                  <li className="flex items-center gap-2 text-emerald-400">
                    <span>✔</span>
                    <span>120 questions loaded</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400">
                    <span>✔</span>
                    <span>Difficulties: 1 - 60</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400">
                    <span>✔</span>
                    <span>≥ 4 questions per difficulty: 52 / 60</span>
                  </li>
                  <li className="flex items-center gap-2 text-amber-400">
                    <span>⚠</span>
                    <span>8 difficulties below 4</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
