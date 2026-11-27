import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { ENV } from './config/env.js';
import { createMatchStore } from './models/matchStore.js';
import { attachGameController } from './controllers/gameController.js';
import { createHttpRouter } from './routes/httpRoutes.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Basic security headers + NAT-friendly per-IP HTTP rate guard (allows 500 hall users behind shared NAT, blocks floods)
const httpBuckets = new Map();
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  let bucket = httpBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > 10000) {
    bucket = { windowStart: now, count: 0 };
    if (httpBuckets.size > 5000) httpBuckets.clear();
    httpBuckets.set(ip, bucket);
  }
  bucket.count += 1;
  if (bucket.count > 900) {
    res.status(429).json({ ok: false, error: 'Rate limit exceeded. Slow down.' });
    return;
  }
  next();
});

app.use(cors({ origin: ENV.CLIENT_ORIGIN }));
app.use(express.json({ limit: '256kb' }));

const matchContext = createMatchStore();
app.use('/', createHttpRouter(matchContext));

const server = http.createServer(app);
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 15000;

const socketsPerIp = new Map();
const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
  serveClient: false,
  perMessageDeflate: false, // saves significant CPU & RAM at 500+ concurrent sockets
  maxHttpBufferSize: 128 * 1024,
  pingInterval: 25000,
  pingTimeout: 30000,
  allowRequest: (req, callback) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const active = socketsPerIp.get(ip) || 0;
    if (active >= 650) {
      callback('Connection cap exceeded for this origin', false);
      return;
    }
    callback(null, true);
  },
});

io.on('connection', (socket) => {
  const ip = String(socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || 'unknown').split(',')[0].trim();
  socketsPerIp.set(ip, (socketsPerIp.get(ip) || 0) + 1);
  socket.on('disconnect', () => {
    const n = (socketsPerIp.get(ip) || 1) - 1;
    if (n <= 0) socketsPerIp.delete(ip);
    else socketsPerIp.set(ip, n);
  });
});

attachGameController(io, matchContext);

// Periodic capacity telemetry (unreffed so test processes exit cleanly)
const statsInterval = setInterval(() => {
  const mem = process.memoryUsage();
  console.log(
    `[stats] players=${matchContext.store.players.size} online=${matchContext.onlineCount()} sockets=${io.engine.clientsCount} rss=${Math.round(mem.rss / 1e6)}MB`
  );
}, 30000);
statsInterval.unref?.();

process.on('uncaughtException', (err) => console.error('[!] Uncaught exception:', err));
process.on('unhandledRejection', (err) => console.error('[!] Unhandled rejection:', err));

server.listen(ENV.PORT, () => {
  console.log(`[ECLIPSE SERVER] listening on http://localhost:${ENV.PORT}`);
  console.log('[ECLIPSE SERVER] Arena status: waiting for Master start command');
});
