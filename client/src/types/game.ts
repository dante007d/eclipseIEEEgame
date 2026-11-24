/**
 * xe2 – shared game types (UI-only subset, no server logic)
 * These mirror the server contract so the UI renders correctly.
 */

export const GAME_NAME = 'PROJECT ECLIPSE';
export const TOTAL_LEVELS = 60;
export const ROOMS_PER_LEVEL = 4;

export type Phase = 'MAIN' | 'ROOM';
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
  /** 0 = start, 60 = finished. The question being asked is for level + 1. */
  level: number;
  phase: Phase;
  /** 0 while in MAIN, 1-4 in a room */
  room: number;
  resets: number;
  finished: boolean;
  finishedAt?: number; // timestamp
  bestLevel: number;
}

export interface QuestionOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface Question {
  questionToken: string;
  text: string;
  options: QuestionOption[];
  difficulty: number;
  topic: string;
  deadlineAt: number; // timestamp ms
}

export interface AnswerResult {
  correct: boolean;
  transition: Transition;
  explanation?: string;
}

export interface MatchConfig {
  totalLevels: number;
  roomsPerLevel: number;
  mainTimerSec: number;
  roomTimerSec: number;
  matchDurationMinutes: number | null;
  roomDifficultyFractions: number[];
  maxMainFailsPerLevel: number | null;
}

export const DEFAULT_CONFIG: MatchConfig = {
  totalLevels: 60,
  roomsPerLevel: 4,
  mainTimerSec: 45,
  roomTimerSec: 30,
  matchDurationMinutes: null,
  roomDifficultyFractions: [0.8, 0.6, 0.4, 0.2],
  maxMainFailsPerLevel: null,
};
