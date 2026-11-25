export interface NormalizedQuestionRow {
  id: string;
  lv: number;
  q: string;
  options: string[];
  a: number;
  type: string;
  topic: string;
  explanation?: string;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

export function parseQuestionsForSupabase(rawText: string): {
  ok: boolean;
  error?: string;
  questions?: NormalizedQuestionRow[];
} {
  const trimmed = rawText.trim();
  if (!trimmed) return { ok: false, error: 'Uploaded file is empty.' };

  let items: Record<string, unknown>[] = [];
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];
    } catch {
      return { ok: false, error: 'Invalid JSON syntax.' };
    }
  } else {
    const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return { ok: false, error: 'CSV needs a header row and at least one question.' };
    const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase());
    for (let r = 1; r < lines.length; r++) {
      const cols = splitCsvLine(lines[r]);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
      const opts = [
        row.optiona || row.option_a || row.a_opt || row.opt1,
        row.optionb || row.option_b || row.b_opt || row.opt2,
        row.optionc || row.option_c || row.c_opt || row.opt3,
        row.optiond || row.option_d || row.d_opt || row.opt4,
      ].filter(Boolean);
      items.push({
        id: row.id || `CSV-${r}`,
        lv: Number(row.difficulty ?? row.lv ?? 1),
        q: row.text || row.q || row.question || '',
        options: opts,
        a: row.correct ?? row.correct_option ?? row.a ?? 0,
        topic: row.topic || 'General',
        type: row.type || 'TECH',
        explanation: row.explanation || '',
      });
    }
  }

  const labels: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  const normalized: NormalizedQuestionRow[] = [];

  items.forEach((item, idx) => {
    const qText = String(item.q ?? item.text ?? '').trim();
    const opts = Array.isArray(item.options) ? item.options.map(String) : [];
    if (!qText || opts.length < 2) return;

    const rawAns = item.a ?? item.correct_option ?? 0;
    let ansIdx = 0;
    if (typeof rawAns === 'number') {
      ansIdx = Math.max(0, Math.min(opts.length - 1, rawAns));
    } else {
      const upper = String(rawAns).trim().toUpperCase();
      ansIdx = upper in labels ? labels[upper] : Math.max(0, Math.min(opts.length - 1, Number(upper) || 0));
    }

    normalized.push({
      id: String(item.id || `UPLOAD-${idx + 1}`),
      lv: Math.max(1, Math.min(60, Math.round(Number(item.lv ?? item.difficulty ?? 1) || 1))),
      q: qText,
      options: opts.slice(0, 4),
      a: ansIdx,
      type: String(item.type || 'TECH'),
      topic: String(item.topic || 'General'),
      explanation: item.explanation ? String(item.explanation) : undefined,
    });
  });

  if (normalized.length === 0) {
    return { ok: false, error: 'Questions must include text and at least 2 options.' };
  }
  return { ok: true, questions: normalized };
}
