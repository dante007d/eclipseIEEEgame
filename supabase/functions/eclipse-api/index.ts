// Supabase Edge Function Gateway with in-isolate + CDN coalesced caching (500+ players)
// Deploy with: supabase functions deploy eclipse-api
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_MS = 2000;
const responseCache = new Map<string, { expiresAt: number; payload: string }>();

async function cachedJsonRpc(
  key: string,
  fetcher: () => Promise<unknown>
): Promise<Response> {
  const now = Date.now();
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > now) {
    return new Response(cached.payload, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Eclipse-Cache': 'HIT',
        'Cache-Control': 'public, s-maxage=2, stale-while-revalidate=4',
      },
    });
  }

  const data = await fetcher();
  const serialized = JSON.stringify(data);
  if (responseCache.size > 200) responseCache.clear();
  responseCache.set(key, { expiresAt: now + CACHE_TTL_MS, payload: serialized });

  return new Response(serialized, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Eclipse-Cache': 'MISS',
      'Cache-Control': 'public, s-maxage=2, stale-while-revalidate=4',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname.endsWith('/standings')) {
      const code = (url.searchParams.get('code') ?? 'DANTE').toUpperCase();
      return await cachedJsonRpc(`standings:${code}`, async () => {
        const { data, error } = await supabase.rpc('eclipse_get_standings', { p_match_code: code });
        if (error) throw error;
        return data;
      });
    }

    if (req.method === 'GET' && url.pathname.endsWith('/pulse')) {
      const code = (url.searchParams.get('code') ?? 'DANTE').toUpperCase();
      return await cachedJsonRpc(`pulse:${code}`, async () => {
        const { data, error } = await supabase.rpc('eclipse_get_pulse', {
          p_match_code: code,
          p_session_id: null,
        });
        if (error) throw error;
        return data;
      });
    }

    const body = await req.json();
    const { action, ...params } = body;
    const { data, error } = await supabase.rpc(action, params);
    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
