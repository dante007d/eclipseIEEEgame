import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function cleanEnvValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"`]+|['"`]+$/g, '').trim();
}

function normalizeAndValidateSupabaseUrl(raw: string): { url: string | null; error: string | null } {
  if (!raw) {
    return { url: null, error: 'VITE_SUPABASE_URL is missing.' };
  }
  if (/\s/.test(raw)) {
    return { url: null, error: 'VITE_SUPABASE_URL must not contain spaces.' };
  }

  let candidate = raw;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate) && candidate.includes('.supabase.')) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        url: null,
        error: 'VITE_SUPABASE_URL must start with https:// (use the Supabase Project URL, not a postgresql:// URI).',
      };
    }
    if (!parsed.hostname) {
      return { url: null, error: 'VITE_SUPABASE_URL is missing a valid hostname.' };
    }
    return { url: candidate.replace(/\/+$/, ''), error: null };
  } catch {
    return {
      url: null,
      error: 'VITE_SUPABASE_URL is invalid. Expected format: https://<project-ref>.supabase.co',
    };
  }
}

const RAW_SUPABASE_URL = cleanEnvValue(import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_ANON_KEY = cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
const FORCED_MODE = cleanEnvValue(import.meta.env.VITE_BACKEND_MODE).toLowerCase();
const PARSED_URL = normalizeAndValidateSupabaseUrl(RAW_SUPABASE_URL);

let cachedClient: SupabaseClient | null = null;

export function getSupabaseConfigError(): string | null {
  const attempted = FORCED_MODE === 'supabase' || Boolean(RAW_SUPABASE_URL) || Boolean(SUPABASE_ANON_KEY);
  if (!attempted) return null;
  if (!RAW_SUPABASE_URL && !SUPABASE_ANON_KEY) {
    return 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set in environment variables.';
  }
  if (PARSED_URL.error) return PARSED_URL.error;
  if (!SUPABASE_ANON_KEY) return 'VITE_SUPABASE_ANON_KEY is missing.';
  return null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(PARSED_URL.url && SUPABASE_ANON_KEY);
}

export type BackendMode = 'supabase' | 'socket';

export function getBackendMode(): BackendMode {
  if (FORCED_MODE === 'supabase' && isSupabaseConfigured()) return 'supabase';
  if (FORCED_MODE === 'socket') return 'socket';
  return isSupabaseConfigured() ? 'supabase' : 'socket';
}

export function tryGetSupabase(): SupabaseClient | null {
  if (!PARSED_URL.url || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!cachedClient) {
    try {
      cachedClient = createClient(PARSED_URL.url, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 10 } },
      });
    } catch {
      return null;
    }
  }
  return cachedClient;
}

export function getSupabase(): SupabaseClient {
  const client = tryGetSupabase();
  if (!client) {
    throw new Error(getSupabaseConfigError() || 'Supabase URL and Anon Key are not configured.');
  }
  return client;
}
