export const ENV = {
  PORT: Number(process.env.PORT) || 3001,
  ADMIN_CODE: (process.env.ADMIN_CODE || 'ECLIPSE2026').trim().toLowerCase(),
  PLAYER_CODE: (process.env.PLAYER_CODE || 'WIRE').trim().toUpperCase(),
  DEFAULT_MATCH_CODE: (process.env.MATCH_CODE || 'A7K3P9').trim().toUpperCase(),
  TICK_MS: Number(process.env.BOARD_INTERVAL_MS) || 1200,
  MAX_PLAYERS: Number(process.env.MAX_PLAYERS) || 5000,
  LOBBY_ROWS: 50,
  TIMER_SYNC_MS: 10000,
  RATE_BURST: 30,
  RATE_PER_SEC: 6,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : '*',
};
