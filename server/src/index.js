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
app.use(cors({ origin: ENV.CLIENT_ORIGIN }));
app.use(express.json());

const matchContext = createMatchStore();
app.use('/', createHttpRouter(matchContext));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
  serveClient: false,
  maxHttpBufferSize: 512 * 1024, // allow host CSV/JSON bank upload up to 512KB
  pingInterval: 25000,
  pingTimeout: 30000,
});

attachGameController(io, matchContext);

process.on('uncaughtException', (err) => console.error('[!] Uncaught exception:', err));
process.on('unhandledRejection', (err) => console.error('[!] Unhandled rejection:', err));

server.listen(ENV.PORT, () => {
  console.log(`[ECLIPSE SERVER] listening on http://localhost:${ENV.PORT}`);
  console.log(`[ECLIPSE SERVER] Match Code: ${matchContext.store.matchCode} (or 'WIRE') | Host Code: ${process.env.ADMIN_CODE || 'ECLIPSE2026'}`);
});
