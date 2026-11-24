/**
 * xe2 – Coverage Heatmap: 60-level difficulty grid with colour bands.
 */

interface CoverageHeatmapProps {
  /** count of questions per difficulty level 1-60 */
  perDifficulty: Record<number, number>;
}

function cellColor(count: number): string {
  if (count === 0) return '#1f1b2e';        // critical – dark purple
  if (count < 2) return '#7f1d1d';          // very low – dark red
  if (count < 4) return '#854d0e';          // low – amber
  return '#14532d';                          // ok – dark green
}

export default function CoverageHeatmap({ perDifficulty }: CoverageHeatmapProps) {
  return (
    <div className="bg-[#0e0a12] border border-red-950/80 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="font-cinzel text-xs font-bold tracking-wider text-gray-300 uppercase">
          Coverage Heatmap
        </h4>
        <div className="flex gap-3 text-[10px] font-mono flex-wrap">
          <span className="flex items-center gap-1 text-green-600"><span className="w-2.5 h-2.5 bg-[#14532d] rounded-sm inline-block" /> ≥4 OK</span>
          <span className="flex items-center gap-1 text-amber-600"><span className="w-2.5 h-2.5 bg-[#854d0e] rounded-sm inline-block" /> 2-3 Low</span>
          <span className="flex items-center gap-1 text-red-700"><span className="w-2.5 h-2.5 bg-[#7f1d1d] rounded-sm inline-block" /> &lt;2 Crit</span>
          <span className="flex items-center gap-1 text-gray-700"><span className="w-2.5 h-2.5 bg-[#1f1b2e] rounded-sm inline-block" /> 0 None</span>
        </div>
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
        {Array.from({ length: 60 }, (_, i) => i + 1).map(d => (
          <div
            key={d}
            title={`Diff ${d}: ${perDifficulty[d] ?? 0} questions`}
            className="rounded-sm aspect-square flex items-center justify-center cursor-default hover:scale-110 transition-transform"
            style={{ background: cellColor(perDifficulty[d] ?? 0) }}
          >
            <span className="font-mono text-[7px] text-white/50">{d}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between font-mono text-[9px] text-gray-700 mt-2 px-0.5">
        <span>1</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span>
      </div>
    </div>
  );
}
