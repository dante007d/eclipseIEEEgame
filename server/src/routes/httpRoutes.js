import express from 'express';
import { GAME_NAME } from '../../../shared/constants.js';

export function createHttpRouter(matchContext) {
  const router = express.Router();
  const { store, onlineCount, ranked, boardPayload } = matchContext;

  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      game: GAME_NAME,
      status: store.status,
      matchCode: store.matchCode,
      players: store.players.size,
      online: onlineCount(),
    });
  });

  router.get('/api/standings', (_req, res) => {
    res.json(boardPayload(ranked(), 100));
  });

  router.get('/', (_req, res) => {
    res.send(`${GAME_NAME} // SERVER ONLINE (CODE: ${store.matchCode})`);
  });

  return router;
}
