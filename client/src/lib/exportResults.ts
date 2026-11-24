import type { PlayerState } from '../types/game';

const COLUMNS: Array<[string, (p: PlayerState, i: number) => string | number]> = [
  ['Rank', (_p, i) => i + 1],
  ['Name', p => p.name],
  ['Year', p => p.year ?? ''],
  ['Group', p => p.group],
  ['Current Level', p => p.level],
  ['Best Level', p => p.bestLevel],
  ['Phase', p => p.phase],
  ['Room', p => p.room],
  ['Resets', p => p.resets],
  ['Solved', p => p.solved],
  ['Fails', p => p.fails],
  ['Cheat Strikes', p => p.cheats],
  ['Score', p => p.score],
  ['Time To Level (s)', p => Number(p.time || 0).toFixed(3)],
  ['Status', p => p.status],
  ['Online', p => (p.online ? 'YES' : 'NO')],
];

function safeCsvCell(v: string | number): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadResults(players: PlayerState[], label = 'all'): void {
  const rows = [COLUMNS.map(([h]) => h).join(',')];
  players.forEach((p, i) => {
    rows.push(COLUMNS.map(([, get]) => safeCsvCell(get(p, i))).join(','));
  });
  const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `eclipse-${label}-results-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
