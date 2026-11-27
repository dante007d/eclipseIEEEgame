import express from 'express';
import { GAME_NAME } from '../../../shared/constants.js';

export function createHttpRouter(matchContext) {
  const router = express.Router();
  const { store, onlineCount, ranked, boardPayload } = matchContext;

  let standingsCacheJson = null;
  let standingsCachedAt = 0;

  router.get('/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      game: GAME_NAME,
      status: store.status,
      players: store.players.size,
      online: onlineCount(),
    });
  });

  router.get('/api/standings', (_req, res) => {
    const now = Date.now();
    if (!standingsCacheJson || now - standingsCachedAt > 1500) {
      standingsCacheJson = JSON.stringify(boardPayload(ranked(), 100));
      standingsCachedAt = now;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1');
    res.send(standingsCacheJson);
  });

  router.get('/', (_req, res) => {
    res.send(`${GAME_NAME} // SERVER ONLINE`);
  });

  return router;
}
