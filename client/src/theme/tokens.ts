/**
 * TECH DROP – Design Tokens & Room Theme System
 * Single source of truth for all visual identities.
 */

// ─── Primitive token types ───────────────────────────────────────────────────

export type RoomId = 'MAIN' | 'BUFFER' | 'CACHE' | 'SANDBOX' | 'VOID';

export type ShapeSet = 'bubbles' | 'blocks' | 'zigzags' | 'spikes';

export type MascotMood =
  | 'confident'   // MAIN
  | 'chill'       // BUFFER
  | 'sneaky'      // CACHE
  | 'chaotic'     // SANDBOX
  | 'ominous';    // VOID

/** Full theme object for a room (or main level). */
export interface RoomTheme {
  id:          RoomId;
  label:       string;
  /** Primary background color (CSS value). */
  bg:          string;
  /** Card/surface color. */
  card:        string;
  /** Accent / highlight color. */
  accent:      string;
  /** Hard shadow color (6px 6px 0 <shadow>). */
  shadow:      string;
  /** Shape decoration vocabulary for this room. */
  shapeSet:    ShapeSet;
  /** Mascot emotional state. */
  mascotMood:  MascotMood;
  /** Audio pitch multiplier (1 = normal). */
  soundPitch:  number;
  /** CSS border color (always #111 but kept per theme for future tweaks). */
  border:      string;
  /** Text color – guaranteed to pass AA contrast on `bg`. */
  text:        string;
}

// ─── Room theme definitions ──────────────────────────────────────────────────

export const ROOM_THEMES: Record<RoomId, RoomTheme> = {
  MAIN: {
    id:         'MAIN',
    label:      'TECH DROP',
    bg:         '#FFF8E7',   // cream canvas
    card:       '#FFFFFF',
    accent:     '#2D6BFF',   // electric blue
    shadow:     '#2D6BFF',
    shapeSet:   'bubbles',
    mascotMood: 'confident',
    soundPitch:  1.0,
    border:     '#111111',
    text:       '#111111',
  },

  BUFFER: {
    id:         'BUFFER',
    label:      'ROOM 1 – BUFFER',
    bg:         '#7CFF3F',   // lime
    card:       '#EDFFD4',
    accent:     '#2D6BFF',
    shadow:     '#111111',
    shapeSet:   'bubbles',
    mascotMood: 'chill',
    soundPitch:  0.9,
    border:     '#111111',
    text:       '#111111',
  },

  CACHE: {
    id:         'CACHE',
    label:      'ROOM 2 – CACHE',
    bg:         '#FF8A1F',   // tangerine
    card:       '#FFF0E0',
    accent:     '#FFE600',
    shadow:     '#111111',
    shapeSet:   'blocks',
    mascotMood: 'sneaky',
    soundPitch:  0.8,
    border:     '#111111',
    text:       '#111111',
  },

  SANDBOX: {
    id:         'SANDBOX',
    label:      'ROOM 3 – SANDBOX',
    bg:         '#FF3D9A',   // hot pink
    card:       '#FFD6EC',
    accent:     '#FFE600',
    shadow:     '#111111',
    shapeSet:   'zigzags',
    mascotMood: 'chaotic',
    soundPitch:  0.7,
    border:     '#111111',
    text:       '#111111',
  },

  VOID: {
    id:         'VOID',
    label:      'ROOM 4 – VOID',
    bg:         '#A24BFF',   // vivid violet
    card:       '#EAD4FF',
    accent:     '#00E0FF',   // cyan accent
    shadow:     '#00E0FF',
    shapeSet:   'spikes',
    mascotMood: 'ominous',
    soundPitch:  0.6,
    border:     '#111111',
    text:       '#FFFFFF',
  },
};

// ─── Status colors ───────────────────────────────────────────────────────────

export const STATUS_COLORS = {
  success: '#00F5A0',
  error:   '#FF4D4D',
  warning: '#FFC400',
} as const;

// ─── Timer config (seconds per room) ─────────────────────────────────────────

export const TIMER_DEFAULTS: Record<RoomId, number> = {
  MAIN:    60,
  BUFFER:  60,
  CACHE:   60,
  SANDBOX: 60,
  VOID:    60,
};

// ─── Scoring config ───────────────────────────────────────────────────────────

export const SCORE_CONFIG = {
  basePerLevel:        100,
  timeBonusPerSecond:    2,
  streakBonusMultiplier: 0.1,   // 10% per consecutive correct MAIN
  roomRecoveryMultiplier: 0.5,  // 50% of base for room recoveries
} as const;

// ─── Hint config ──────────────────────────────────────────────────────────────

export const HINT_CONFIG = {
  maxPerLevel:    1,
  timePenalty:   15,   // seconds deducted from timer
  scorePenalty: 20,   // flat score penalty if time-bonus is off
} as const;

// ─── Return mode ─────────────────────────────────────────────────────────────

export type ReturnMode = 'same_question' | 'next_level';

/** Change here to switch global default; can be overridden per-game. */
export const RETURN_MODE: ReturnMode = 'next_level';
