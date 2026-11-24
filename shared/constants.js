/**
 * Shared game constants & protocol event names used by both client and server.
 */

export const GAME_NAME = 'PROJECT ECLIPSE';
export const GAME_SUBTITLE = 'THE ASCENSION QUIZ';
export const TOTAL_LEVELS = 60;
export const ROOMS_PER_LEVEL = 4;

export const DEFAULT_CONFIG = {
  totalLevels: 60,
  roomsPerLevel: 4,
  mainTimerSec: 45,
  roomTimerSec: 30,
  matchDurationMinutes: null,
  roomDifficultyFractions: [0.8, 0.6, 0.4, 0.2],
  maxMainFailsPerLevel: null,
  returnMode: 'same_question', // 'same_question' | 'next_level'
};

export const ROOM_NAMES = {
  0: 'MAIN ASCENSION',
  1: 'ROOM 1 // BUFFER',
  2: 'ROOM 2 // CACHE',
  3: 'ROOM 3 // SANDBOX',
  4: 'ROOM 4 // VOID',
};

export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN: 'match:join',
  LOBBY: 'lobby',
  PROGRESS_REQUEST: 'match:state_req',
  ANSWER_SUBMIT: 'answer:submit',
  READY_NEXT: 'question:ready',
  USE_HINT: 'question:hint',
  CHEAT: 'player:cheat',
  SEVER: 'player:sever',

  // Server -> Client
  JOINED: 'match:joined',
  MATCH_STATE: 'match:state',
  QUESTION_SHOW: 'question:show',
  ANSWER_RESULT: 'answer:result',
  PLAYERS_UPDATE: 'players:update',
  LEADERBOARD: 'leaderboard',
  RANK: 'player:rank',
  PULSE: 'match:pulse',
  TIMER_SYNC: 'timer_sync',
  MATCH_STATUS: 'match:status',
  MATCH_ENDED: 'match:ended',
  FORCE_DQ: 'force_dq',
  SERVER_FULL: 'server_full',
  ERROR_MSG: 'match:error',

  // Host / Admin
  ADMIN_AUTH: 'admin:auth',
  ADMIN_LEAVE: 'admin:leave',
  HOST_CREATE_OR_UPDATE_CONFIG: 'host:update_config',
  HOST_UPLOAD_QUESTIONS: 'host:upload_questions',
  HOST_SET_STATUS: 'host:set_status', // pending | live | paused | ended
  HOST_START_GLOBAL_TIMER: 'host:start_timer',
  HOST_DISQUALIFY: 'host:disqualify',
  HOST_RESET_ALL: 'host:reset_all',
  HOST_REGEN_CODE: 'host:regen_code',
};
