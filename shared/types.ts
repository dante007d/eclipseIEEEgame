/**
 * Shared TypeScript contracts for Project Eclipse client and tooling.
 */

export type Phase = 'MAIN' | 'ROOM';
export type ReturnMode = 'same_question' | 'next_level';
export type MatchStatus = 'pending' | 'live' | 'paused' | 'ended';
export type PlayerStatus = 'active' | 'won' | 'dead' | 'disqualified';
export type YearGroup = 'junior' | 'senior';

export type Transition =
  | 'ADVANCE'
  | 'ENTER_ROOM'
  | 'NEXT_ROOM'
  | 'RETURN_TO_MAIN'
  | 'RESET'
  | 'FINISH';

export interface PlayerState {
  id: string;
  name: string;
  year: number | null;
  group: YearGroup;
  /** 0 = start, 60 = finished. The MAIN question asked is for level + 1. */
  level: number;
  phase: Phase;
  /** 0 while in MAIN, 1..4 in a recovery room */
  room: number;
  resets: number;
  bestLevel: number;
  solved: number;
  fails: number;
  hintsUsed: number;
  cheats: number;
  score: number;
  streak: number;
  finished: boolean;
  finishedAt?: number | null;
  online: boolean;
  status: PlayerStatus;
  time: number;
}

export interface QuestionOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface Question {
  questionToken: string;
  id: string;
  text: string;
  options: QuestionOption[];
  difficulty: number;
  type?: string;
  topic: string;
  deadlineAt: number;
  phase: Phase;
  room: number;
  targetLevel: number;
  hintAvailable?: boolean;
  eliminatedOptionIds?: string[];
}

export interface AnswerResult {
  correct: boolean;
  transition: Transition;
  explanation?: string;
  roast?: string;
  pointsGained?: number;
  previousRoom?: number;
  newRoom?: number;
  newLevel?: number;
}

export interface MatchConfig {
  totalLevels: number;
  roomsPerLevel: number;
  mainTimerSec: number;
  roomTimerSec: number;
  matchDurationMinutes: number | null;
  roomDifficultyFractions: number[];
  maxMainFailsPerLevel: number | null;
  returnMode: ReturnMode;
}

export interface FeedItem {
  t: 'lv' | 'fall' | 'room4' | 'reset' | 'won' | 'dead' | 'dq' | 'cheat';
  n: string;
  lv?: number;
  room?: number;
  g?: YearGroup;
}

export interface LeaderboardSnapshot {
  players: PlayerState[];
  totalSouls: number;
  total: number;
  online: number;
  matchCode?: string;
  status?: MatchStatus;
}

export interface MatchPulse {
  total: number;
  online: number;
  leader: { n: string; lv: number } | null;
  feed: FeedItem[];
}

export interface ValidationReport {
  loaded: number;
  difficulties: number[];
  perDifficulty: Record<number, number>;
  warnings: string[];
  errors: string[];
  targetGroup?: YearGroup | 'both';
}
