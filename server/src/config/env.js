export const ENV = {
  PORT: Number(process.env.PORT) || 3001,
  ADMIN_CODE: (process.env.ADMIN_CODE || 'stalin').trim().toLowerCase(),
  PLAYER_CODE: (process.env.PLAYER_CODE || 'DANTE').trim().toUpperCase(),
  DEFAULT_MATCH_CODE: (process.env.MATCH_CODE || 'DANTE').trim().toUpperCase(),
  TICK_MS: Number(process.env.BOARD_INTERVAL_MS) || 2000,
  MAX_PLAYERS: Number(process.env.MAX_PLAYERS) || 5000,
  LOBBY_ROWS: 25,
  TIMER_SYNC_MS: 10000,
  RATE_BURST: 24,
  RATE_PER_SEC: 5,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : '*',
};
