import { io, type Socket } from 'socket.io-client';
import { getBackendMode } from './supabaseClient';

const EXPLICIT_SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;
const IS_LOCAL_HOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const SOCKET_URL = EXPLICIT_SOCKET_URL || 'http://localhost:3001';
const SHOULD_AUTO_CONNECT =
  getBackendMode() === 'socket' && (Boolean(EXPLICIT_SOCKET_URL) || IS_LOCAL_HOST);

export const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  tryAllTransports: true,
  reconnectionAttempts: 2,
  reconnectionDelay: 1500,
  reconnectionDelayMax: 8000,
  randomizationFactor: 0.5,
  autoConnect: SHOULD_AUTO_CONNECT,
});

// Once connected cleanly, restore full infinite reconnection resilience for campus Wi-Fi drops
socket.on('connect', () => {
  socket.io.opts.reconnectionAttempts = Infinity;
});

export function ensureSocketConnected(): void {
  if (getBackendMode() !== 'socket') return;
  if (!socket.connected) {
    socket.connect();
  }
}

const SESSION_ID_KEY = 'eclipse_session_id';
const PLAYER_META_KEY = 'eclipse_player_meta';
const STRIKES_KEY = 'eclipse_cheat_strikes';
const ADMIN_CODE_KEY = 'eclipse_admin_code';

export function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export interface SavedPlayerMeta {
  name: string;
  year: number;
  matchCode: string;
}

export function savePlayerMeta(meta: SavedPlayerMeta): void {
  try {
    sessionStorage.setItem(PLAYER_META_KEY, JSON.stringify(meta));
  } catch {
    // ignore storage quota errors
  }
}

export function loadPlayerMeta(): SavedPlayerMeta | null {
  try {
    const raw = sessionStorage.getItem(PLAYER_META_KEY);
    return raw ? (JSON.parse(raw) as SavedPlayerMeta) : null;
  } catch {
    return null;
  }
}

export function clearPlayerMeta(): void {
  try {
    sessionStorage.removeItem(PLAYER_META_KEY);
    sessionStorage.removeItem(STRIKES_KEY);
  } catch {
    // ignore
  }
}

export function loadStrikes(): number {
  return Number(sessionStorage.getItem(STRIKES_KEY)) || 0;
}

export function incrementStrikes(): number {
  const next = loadStrikes() + 1;
  try {
    sessionStorage.setItem(STRIKES_KEY, String(next));
  } catch {
    // ignore
  }
  return next;
}

export function saveAdminCode(code: string): void {
  try {
    sessionStorage.setItem(ADMIN_CODE_KEY, code);
  } catch {
    // ignore
  }
}

export function loadAdminCode(): string | null {
  return sessionStorage.getItem(ADMIN_CODE_KEY);
}

export function clearAdminCode(): void {
  sessionStorage.removeItem(ADMIN_CODE_KEY);
}
