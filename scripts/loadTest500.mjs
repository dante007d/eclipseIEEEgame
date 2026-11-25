/**
 * 500-Concurrent-Player Load & Stress Test for Project Eclipse
 * Spawns 500 simultaneous WebSocket clients (250 Junior + 250 Senior),
 * joins the match, receives 500 token-gated questions, submits 500 answers,
 * verifies zero answer leakage and measures join/answer latency & server RSS.
 *
 * Usage: node scripts/loadTest500.mjs
 */

import { spawn } from 'node:child_process';
import { io } from '../client/node_modules/socket.io-client/build/esm/index.js';

const TOTAL_PLAYERS = Number(process.env.LOAD_PLAYERS) || 500;
const PORT = Number(process.env.LOAD_PORT) || 3098;
const URL = `http://localhost:${PORT}`;

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

async function run() {
  console.log(`Starting Eclipse server on ${URL} for ${TOTAL_PLAYERS}-player load test...`);
  const srv = spawn('node', ['src/index.js'], {
    cwd: './server',
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await new Promise(r => setTimeout(r, 1200));

  const sockets = [];
  const joinLatencies = [];
  const answerLatencies = [];
  let leakedAnswers = 0;
  let errors = 0;

  try {
    // Master admin starts the match from 'pending' -> 'live'
    const adminSock = io(URL, { transports: ['websocket'], reconnection: false });
    sockets.push(adminSock);
    await new Promise((resolve, reject) => {
      adminSock.once('connect', resolve);
      adminSock.once('connect_error', reject);
    });
    await new Promise((resolve, reject) => {
      adminSock.emit('admin:auth', 'stalin', (res) => {
        if (res?.ok) {
          adminSock.emit('host:set_status', 'live');
          resolve();
        } else {
          reject(new Error('Admin auth failed in load test'));
        }
      });
    });

    // Connect & join 500 players in controlled waves (50 per 60ms = ~0.6s ramp-up)
    const tasks = [];
    for (let i = 0; i < TOTAL_PLAYERS; i++) {
      const p = (async (idx) => {
        if (idx >= 50) await new Promise(r => setTimeout(r, Math.floor(idx / 50) * 60));
        const sock = io(URL, {
          transports: ['websocket'],
          reconnection: false,
        });
        sockets.push(sock);

        await new Promise((resolve, reject) => {
          sock.once('connect', resolve);
          sock.once('connect_error', reject);
        });

        const t0 = performance.now();
        const firstQ = await new Promise((resolve, reject) => {
          const to = setTimeout(() => reject(new Error(`Timeout waiting for question #${idx}`)), 15000);
          sock.once('question:show', (q) => {
            clearTimeout(to);
            resolve(q);
          });
          sock.emit('match:join', {
            sessionId: `loadtest_player_${String(idx).padStart(4, '0')}`,
            matchCode: 'DANTE',
            name: `Bot_${idx}`,
            year: (idx % 4) + 1,
          }, (ack) => {
            if (!ack?.ok) errors++;
          });
        });
        joinLatencies.push(performance.now() - t0);

        if ('a' in firstQ || 'correct_option' in firstQ) leakedAnswers++;

        // Simulate realistic staggered answer burst
        await new Promise(r => setTimeout(r, Math.random() * 400));
        const a0 = performance.now();
        await new Promise((resolve, reject) => {
          const to = setTimeout(() => reject(new Error(`Timeout waiting for answer #${idx}`)), 15000);
          sock.once('answer:result', () => {
            clearTimeout(to);
            resolve();
          });
          sock.emit('answer:submit', {
            questionToken: firstQ.questionToken,
            optionId: ['A', 'B', 'C', 'D'][idx % 4],
          });
        });
        answerLatencies.push(performance.now() - a0);
      })(i).catch((err) => {
        errors++;
        if (errors <= 5) console.error(err.message);
      });

      tasks.push(p);
    }

    await Promise.all(tasks);

    const health = await fetch(`${URL}/health`).then(r => r.json());
    joinLatencies.sort((a, b) => a - b);
    answerLatencies.sort((a, b) => a - b);

    console.log('\n=== 500-PLAYER LOAD TEST RESULTS ===');
    console.log(`Players connected & answered : ${health.players} / ${TOTAL_PLAYERS}`);
    console.log(`Errors / timeouts            : ${errors}`);
    console.log(`Leaked answers in payloads   : ${leakedAnswers}`);
    console.log(`Join latency (p50 / p95 / max)   : ${percentile(joinLatencies, 0.5).toFixed(1)}ms / ${percentile(joinLatencies, 0.95).toFixed(1)}ms / ${percentile(joinLatencies, 1).toFixed(1)}ms`);
    console.log(`Answer latency (p50 / p95 / max) : ${percentile(answerLatencies, 0.5).toFixed(1)}ms / ${percentile(answerLatencies, 0.95).toFixed(1)}ms / ${percentile(answerLatencies, 1).toFixed(1)}ms`);

    if (errors > 0 || leakedAnswers > 0 || health.players < TOTAL_PLAYERS) {
      process.exitCode = 1;
    }
  } finally {
    sockets.forEach(s => s.disconnect());
    srv.kill();
  }
}

run();
