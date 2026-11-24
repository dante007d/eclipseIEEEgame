/**
 * Project Eclipse – Shared Game Types
 * Re-exports shared contracts and defines client UI types.
 */

export type {
  Phase,
  ReturnMode,
  MatchStatus,
  PlayerStatus,
  YearGroup,
  Transition,
  PlayerState,
  QuestionOption,
  Question,
  AnswerResult,
  MatchConfig,
  FeedItem,
  LeaderboardSnapshot,
  MatchPulse,
  ValidationReport,
} from '../../../shared/types';

export {
  GAME_NAME,
  GAME_SUBTITLE,
  TOTAL_LEVELS,
  ROOMS_PER_LEVEL,
  DEFAULT_CONFIG,
  ROOM_NAMES,
  SOCKET_EVENTS,
} from '../../../shared/constants.js';
