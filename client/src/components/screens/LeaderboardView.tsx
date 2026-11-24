import EclipseSky from '../EclipseSky';

interface LeaderboardViewProps {
  onBackToApp: () => void;
}

export default function LeaderboardView({ onBackToApp }: LeaderboardViewProps) {
  const leaderboard = [
    { rank: 1, crown: true, player: 'Orion', level: 32, depth: 4, resets: 0 },
    { rank: 2, crown: false, player: 'Verdant', level: 31, depth: 2, resets: 1 },
    { rank: 3, crown: false, player: 'Cipher', level: 30, depth: 1, resets: 0 },
    { rank: 4, crown: false, player: 'Nova', level: 28, depth: 2, resets: 1 },
    { rank: 5, crown: false, player: 'Echo', level: 28, depth: 2, resets: 2 },
  ];

  const dangerZone = [
    { player: 'Atlas', level: 18, room: 'R4' },
    { player: 'Rune', level: 17, room: 'R4' },
    { player: 'Fleet', level: 17, room: 'R4' },
  ];

  return (
    <div className="relative w-full min-h-[720px] bg-[#070508] text-gray-200 rounded-3xl border border-red-950/80 shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col p-6 md:p-8">
      <EclipseSky glowIntensity="high" subtleCity={true} />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-cinzel text-xl md:text-2xl font-bold tracking-[0.2em] text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            PROJECT ECLIPSE
          </h2>
          <p className="font-cinzel text-xs font-semibold tracking-[0.25em] text-red-500 uppercase mt-1">
            LIVE LEADERBOARD
          </p>
        </div>

        <button
          onClick={onBackToApp}
          className="py-2 px-4 rounded-xl font-cinzel text-xs text-red-400 hover:text-white border border-red-950/80 bg-[#0c0910]/80 hover:bg-red-950/40 transition-colors self-start sm:self-auto"
        >
          📱 Back to Mobile Screen
        </button>
      </div>

      {/* Leaderboard Table & Danger Zone Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Main Rankings Table (2 cols) */}
        <div className="lg:col-span-2 bg-[#0c0910]/85 border border-red-950/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="border-b border-red-950/60 text-gray-400 font-cinzel text-[11px] tracking-wider uppercase">
                <th className="pb-3 pl-2">#</th>
                <th className="pb-3">Player</th>
                <th className="pb-3 text-center">Level</th>
                <th className="pb-3 text-center">Depth</th>
                <th className="pb-3 text-center">Resets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/60">
              {leaderboard.map((item) => (
                <tr key={item.rank} className="hover:bg-red-950/20 transition-colors">
                  <td className="py-3.5 pl-2 font-bold text-gray-400">
                    {item.crown ? <span className="text-amber-400 text-base">👑</span> : item.rank}
                  </td>
                  <td className="py-3.5 font-cinzel font-bold text-gray-200 tracking-wider">
                    {item.player}
                  </td>
                  <td className="py-3.5 text-center font-bold text-amber-400">
                    {item.level}
                  </td>
                  <td className="py-3.5 text-center text-xs tracking-widest text-red-500">
                    {'●'.repeat(item.depth)}
                  </td>
                  <td className="py-3.5 text-center font-bold text-gray-400">
                    {item.resets}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Danger Zone Panel (1 col) */}
        <div className="bg-[#12080c]/90 border border-red-700/80 rounded-2xl p-5 shadow-[0_0_25px_rgba(225,29,72,0.35)] flex flex-col justify-start">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-900/60">
            <span className="text-red-500 animate-pulse text-sm">⚠️</span>
            <h4 className="font-cinzel text-xs font-bold tracking-[0.25em] text-red-500 uppercase">
              DANGER ZONE
            </h4>
          </div>

          <div className="flex flex-col gap-3">
            {dangerZone.map((dz, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1c0810]/80 border border-red-900/40 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  <span className="font-cinzel font-bold text-gray-200 tracking-wider">
                    {dz.player}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Lvl {dz.level}</span>
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-600 text-red-400 font-bold text-[11px]">
                    {dz.room}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="font-body text-[11px] text-gray-500 mt-6 leading-relaxed">
            Players in Room 4 face a complete reset to Level 1 if an answer fails.
          </p>
        </div>
      </div>
    </div>
  );
}
