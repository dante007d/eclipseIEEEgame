/**
 * Question bank validator & CSV/JSON parser for Host uploads.
 */

function splitCsvLine(line) {
  const result = [];
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

/**
 * Normalize raw JSON or CSV text into validated question items + coverage report.
 * Supports:
 *  - Ouroboros format: { id, lv, q, options: string[], a: number, type, topic }
 *  - xe2 spec format:  { id, text, options: string[], correct_option: number|string, difficulty: number, topic, explanation }
 *  - CSV headers: id,difficulty|lv,text|q,optionA,optionB,optionC,optionD,correct|a,topic,type
 */
export function parseAndValidateQuestions(rawText) {
  let items = [];
  const trimmed = String(rawText ?? '').trim();
  if (!trimmed) return { ok: false, error: 'Uploaded file is empty.' };

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.questions) ? parsed.questions : []);
    } catch {
      return { ok: false, error: 'Invalid JSON syntax.' };
    }
  } else {
    const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return { ok: false, error: 'CSV needs a header row and at least one question row.' };
    const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase());
    for (let r = 1; r < lines.length; r++) {
      const cols = splitCsvLine(lines[r]);
      const row = {};
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

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'No valid questions found in upload.' };
  }

  const normalized = [];
  const perDifficulty = {};
  const labels = { A: 0, B: 1, C: 2, D: 3 };

  items.forEach((item, idx) => {
    const qText = String(item.q ?? item.text ?? '').trim();
    const options = Array.isArray(item.options) ? item.options.map(String) : [];
    if (!qText || options.length < 2) return;

    const rawAns = item.a ?? item.correct_option ?? 0;
    let ansIdx = 0;
    if (typeof rawAns === 'number') {
      ansIdx = Math.max(0, Math.min(options.length - 1, rawAns));
    } else {
      const upper = String(rawAns).trim().toUpperCase();
      ansIdx = upper in labels ? labels[upper] : Math.max(0, Math.min(options.length - 1, Number(upper) || 0));
    }

    const lv = Math.max(1, Math.min(60, Math.round(Number(item.lv ?? item.difficulty ?? 1) || 1)));
    perDifficulty[lv] = (perDifficulty[lv] ?? 0) + 1;

    normalized.push({
      id: String(item.id || `UPLOAD-${idx + 1}`),
      lv,
      q: qText,
      options: options.slice(0, 4),
      a: ansIdx,
      type: String(item.type || 'TECH'),
      topic: String(item.topic || 'General'),
      explanation: item.explanation ? String(item.explanation) : undefined,
    });
  });

  if (normalized.length === 0) {
    return { ok: false, error: 'Questions must include text and at least 2 options.' };
  }

  const difficulties = Object.keys(perDifficulty).map(Number).sort((a, b) => a - b);
  const warnings = [];
  const errors = [];
  for (let d = 1; d <= 60; d++) {
    const cnt = perDifficulty[d] ?? 0;
    if (cnt === 0) errors.push(`Difficulty ${d}: no questions`);
    else if (cnt < 4) warnings.push(`Difficulty ${d}: only ${cnt} question(s) (< 4)`);
  }

  return {
    ok: true,
    questions: normalized,
    report: {
      loaded: normalized.length,
      difficulties,
      perDifficulty,
      warnings,
      errors,
    },
  };
}
