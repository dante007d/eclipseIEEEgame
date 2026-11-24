interface CoverageHeatmapProps {
  /** count of questions per difficulty level 1-60 */
  perDifficulty: Record<number, number>;
}

function cellColor(count: number): string {
  if (count === 0) return '#1f1b2e'; // critical – none
  if (count < 2) return '#7f1d1d';   // critical < 2
  if (count < 4) return '#92400e';   // low 2-3
  return '#b91c1c';                  // ok >= 4 (crimson mastery matching visual sheet)
}

export default function CoverageHeatmap({ perDifficulty }: CoverageHeatmapProps) {
  return (
    <div className="gothic-panel rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="font-cinzel text-xs font-bold tracking-wider text-[#e6c48a] uppercase">
          Coverage Heatmap (Questions per Difficulty)
        </h4>
        <div className="flex gap-3 text-[10px] font-mono flex-wrap">
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2.5 h-2.5 bg-[#b91c1c] rounded-sm inline-block" /> ≥4 (OK)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 bg-[#92400e] rounded-sm inline-block" /> 2–3 (Low)
          </span>
          <span className="flex items-center gap-1 text-red-700">
            <span className="w-2.5 h-2.5 bg-[#7f1d1d] rounded-sm inline-block" /> &lt;2 (Critical)
          </span>
        </div>
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
        {Array.from({ length: 60 }, (_, i) => i + 1).map(d => (
          <div
            key={d}
            title={`Difficulty ${d}: ${perDifficulty[d] ?? 0} questions`}
            className="rounded-sm aspect-square flex items-center justify-center cursor-default hover:scale-110 transition-transform border border-black/40"
            style={{ background: cellColor(perDifficulty[d] ?? 0) }}
          >
            <span className="font-mono text-[8px] text-white/75">{d}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between font-mono text-[9px] text-gray-500 mt-2 px-0.5">
        <span>1</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span>
      </div>
    </div>
  );
}
