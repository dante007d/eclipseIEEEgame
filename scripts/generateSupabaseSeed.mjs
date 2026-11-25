import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JUNIOR } from '../server/src/questions/junior.js';
import { SENIOR } from '../server/src/questions/senior.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outPath = path.join(rootDir, 'supabase', 'seed.sql');

const sqlStr = (s) => `'${String(s ?? '').replace(/'/g, "''")}'`;

const rows = [];
for (const [track, bank] of [['junior', JUNIOR], ['senior', SENIOR]]) {
  for (const q of bank) {
    const uniqueId = `${track === 'junior' ? 'JUN' : 'SEN'}-${q.id}`;
    rows.push(
      `(${sqlStr(uniqueId)}, ${sqlStr(track)}, ${Number(q.lv)}, ${sqlStr(q.q)}, ${sqlStr(JSON.stringify(q.options))}::jsonb, ${Number(q.a)}, ${sqlStr(q.type || 'TECH')}, ${sqlStr(q.topic || 'General')})`
    );
  }
}

const sql = `-- ============================================================================
-- PROJECT ECLIPSE // QUESTION SEED DATA (Junior + Senior Banks)
-- Generated automatically from Ouroboros question banks (${rows.length} questions)
-- ============================================================================

INSERT INTO public.questions (id, track, lv, q, options, correct_option, type, topic)
VALUES
${rows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  track = EXCLUDED.track,
  lv = EXCLUDED.lv,
  q = EXCLUDED.q,
  options = EXCLUDED.options,
  correct_option = EXCLUDED.correct_option,
  type = EXCLUDED.type,
  topic = EXCLUDED.topic,
  active = true;
`;

fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Generated ${outPath} with ${rows.length} questions.`);
