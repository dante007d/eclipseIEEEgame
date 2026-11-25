export interface UniquePoolTracker {
  seen: Set<string>;
  last: string | null;
}

export declare const SAVAGES: string[];
export declare function pickUnique(pool: string[], tracker?: UniquePoolTracker): string;
export declare function claimUnique(candidate: string | undefined | null, pool: string[], tracker?: UniquePoolTracker): string;
export declare const TIMER_INSULTS: string[];
export declare const THOUGHTS: string[];
export declare const WHISPERS: string[];
export declare const CHEAT_TITLES: Record<string, string>;
export declare const CHEAT_ROASTS: Record<string, string[]>;
export declare const WIN_ART: string;
export declare const LOSE_ART: string;
export declare const WIN_SNAKE: string;
export declare const LOSE_SNAKE: string;
