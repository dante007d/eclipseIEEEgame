import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const FORCED_MODE = (import.meta.env.VITE_BACKEND_MODE as string | undefined)?.toLowerCase();

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export type BackendMode = 'supabase' | 'socket';

export function getBackendMode(): BackendMode {
  if (FORCED_MODE === 'supabase' && isSupabaseConfigured()) return 'supabase';
  if (FORCED_MODE === 'socket') return 'socket';
  return isSupabaseConfigured() ? 'supabase' : 'socket';
}

export function getSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL and Anon Key are not configured.');
  }
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return cachedClient;
}
