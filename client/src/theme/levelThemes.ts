/**
 * xe2 – Level cosmetic themes
 * Levels 1-10:   Descent (default crimson)
 * Levels 11-20:  Underworld (violet)
 * Levels 21-30:  Abyss (deep teal)
 * Levels 31-40:  Ruins (amber)
 * Levels 41-50:  Void (purple)
 * Levels 51-60:  Ascension (gold)
 */

export interface LevelTheme {
  name: string;
  bg: string;
  bgSecondary: string;
  accent: string;
  accentSecondary: string;
  glow: string;
  roomDepthBg: string; // used as rooms get darker
  timerColor: string;
  progressColor: string;
  borderColor: string;
}

export const LEVEL_THEMES: LevelTheme[] = [
  // 1-10: Descent — crimson
  {
    name: 'Descent',
    bg: '#060709',
    bgSecondary: '#0e0b0d',
    accent: '#e11d48',
    accentSecondary: '#7f1d1d',
    glow: 'rgba(225,29,72,0.5)',
    roomDepthBg: '#120508',
    timerColor: '#fbbf24',
    progressColor: '#e11d48',
    borderColor: '#2a1419',
  },
  // 11-20: Underworld — violet
  {
    name: 'Underworld',
    bg: '#07060e',
    bgSecondary: '#0e0b17',
    accent: '#8b5cf6',
    accentSecondary: '#4c1d95',
    glow: 'rgba(139,92,246,0.5)',
    roomDepthBg: '#0d0817',
    timerColor: '#c084fc',
    progressColor: '#8b5cf6',
    borderColor: '#2d1b69',
  },
  // 21-30: Abyss — deep teal
  {
    name: 'Abyss',
    bg: '#060c0d',
    bgSecondary: '#0a1517',
    accent: '#06b6d4',
    accentSecondary: '#164e63',
    glow: 'rgba(6,182,212,0.4)',
    roomDepthBg: '#051015',
    timerColor: '#67e8f9',
    progressColor: '#06b6d4',
    borderColor: '#164e63',
  },
  // 31-40: Ruins — amber
  {
    name: 'Ruins',
    bg: '#0d0906',
    bgSecondary: '#17110a',
    accent: '#f59e0b',
    accentSecondary: '#78350f',
    glow: 'rgba(245,158,11,0.4)',
    roomDepthBg: '#140d05',
    timerColor: '#fde68a',
    progressColor: '#f59e0b',
    borderColor: '#78350f',
  },
  // 41-50: Void — purple
  {
    name: 'Void',
    bg: '#080608',
    bgSecondary: '#130a13',
    accent: '#d946ef',
    accentSecondary: '#701a75',
    glow: 'rgba(217,70,239,0.5)',
    roomDepthBg: '#0f0712',
    timerColor: '#f0abfc',
    progressColor: '#d946ef',
    borderColor: '#701a75',
  },
  // 51-60: Ascension — gold
  {
    name: 'Ascension',
    bg: '#0d0d06',
    bgSecondary: '#181508',
    accent: '#eab308',
    accentSecondary: '#854d0e',
    glow: 'rgba(234,179,8,0.6)',
    roomDepthBg: '#12100a',
    timerColor: '#fef08a',
    progressColor: '#eab308',
    borderColor: '#854d0e',
  },
];

export function getThemeForLevel(level: number): LevelTheme {
  if (level <= 0) return LEVEL_THEMES[0];
  const idx = Math.min(Math.floor((level - 1) / 10), LEVEL_THEMES.length - 1);
  return LEVEL_THEMES[idx];
}

/** Darken room bg proportionally to depth (room 1-4) */
export function getRoomBg(theme: LevelTheme, room: number): string {
  return room >= 3 ? theme.roomDepthBg : theme.bgSecondary;
}
