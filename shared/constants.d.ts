export declare const GAME_NAME: string;
export declare const GAME_SUBTITLE: string;
export declare const TOTAL_LEVELS: number;
export declare const ROOMS_PER_LEVEL: number;

export declare const DEFAULT_CONFIG: {
  totalLevels: number;
  roomsPerLevel: number;
  mainTimerSec: number;
  roomTimerSec: number;
  matchDurationMinutes: number | null;
  roomDifficultyFractions: number[];
  maxMainFailsPerLevel: number | null;
  returnMode: 'same_question' | 'next_level';
};

export declare const ROOM_NAMES: Record<number, string>;
export declare const SOCKET_EVENTS: Record<string, string>;
