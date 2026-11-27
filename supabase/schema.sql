-- ============================================================================
-- PROJECT ECLIPSE // SUPABASE SCHEMA & HIGH-SCALE RPC ENGINE (500+ PLAYERS)
-- Run this file once in your Supabase SQL Editor, followed by supabase/seed.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET search_path TO public, extensions;

-- ─── 1. TABLES ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text UNIQUE NOT NULL,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'paused', 'ended')),
  config              jsonb NOT NULL DEFAULT '{
    "totalLevels": 60,
    "roomsPerLevel": 4,
    "mainTimerSec": 60,
    "roomTimerSec": 60,
    "matchDurationMinutes": null,
    "roomDifficultyFractions": [0.8, 0.6, 0.4, 0.2],
    "maxMainFailsPerLevel": null,
    "returnMode": "same_question"
  }'::jsonb,
  admin_code_hash     text NOT NULL,
  global_ends_at      timestamptz NULL,
  paused_remaining_ms int NULL,
  last_game_over      jsonb NULL,
  pulse_cache         jsonb NULL,
  pulse_cached_at     timestamptz NULL,
  leaderboard_dirty   boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS pulse_cache jsonb NULL;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS pulse_cached_at timestamptz NULL;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS leaderboard_dirty boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.questions (
  id             text PRIMARY KEY,
  track          text NOT NULL CHECK (track IN ('junior', 'senior')),
  lv             int NOT NULL CHECK (lv BETWEEN 0 AND 60),
  q              text NOT NULL,
  options        jsonb NOT NULL,
  correct_option int NOT NULL CHECK (correct_option BETWEEN 0 AND 3),
  type           text NOT NULL DEFAULT 'TECH',
  topic          text NOT NULL DEFAULT 'General',
  explanation    text NULL,
  active         boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.players (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id                  uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  session_id                text NOT NULL,
  name                      text NOT NULL,
  year                      int NOT NULL DEFAULT 1 CHECK (year BETWEEN 1 AND 4),
  grp                       text NOT NULL CHECK (grp IN ('junior', 'senior')),
  level                     int NOT NULL DEFAULT 0,
  phase                     text NOT NULL DEFAULT 'MAIN' CHECK (phase IN ('MAIN', 'ROOM')),
  room                      int NOT NULL DEFAULT 0,
  resets                    int NOT NULL DEFAULT 0,
  best_level                int NOT NULL DEFAULT 0,
  solved                    int NOT NULL DEFAULT 0,
  fails                     int NOT NULL DEFAULT 0,
  hints_used                int NOT NULL DEFAULT 0,
  cheats                    int NOT NULL DEFAULT 0,
  score                     int NOT NULL DEFAULT 0,
  streak                    int NOT NULL DEFAULT 0,
  main_fails_on_level       int NOT NULL DEFAULT 0,
  finished                  boolean NOT NULL DEFAULT false,
  status                    text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'dead', 'disqualified')),
  start_time                timestamptz NOT NULL DEFAULT now(),
  level_update_time         timestamptz NOT NULL DEFAULT now(),
  finish_time               timestamptz NULL,
  last_seen_at              timestamptz NOT NULL DEFAULT now(),
  seen_ids                  text[] NOT NULL DEFAULT '{}',
  last_question_id          text NULL,
  active_token              text NULL,
  active_question           jsonb NULL,
  active_correct_option_id  text NULL,
  active_deadline_at        timestamptz NULL,
  active_answered           boolean NOT NULL DEFAULT false,
  active_transition_pending boolean NOT NULL DEFAULT false,
  paused_remaining_ms       int NULL,
  last_cheat_feed_at        timestamptz NULL,
  UNIQUE (match_id, session_id)
);

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS last_cheat_feed_at timestamptz NULL;

CREATE TABLE IF NOT EXISTS public.attempts (
  id          bigserial PRIMARY KEY,
  match_id    uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id   uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  phase       text NOT NULL,
  room        int NOT NULL,
  level       int NOT NULL,
  correct     boolean NOT NULL,
  transition  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feed_events (
  id         bigserial PRIMARY KEY,
  match_id   uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  grp        text NOT NULL,
  t          text NOT NULL,
  n          text NOT NULL,
  lv         int NULL,
  room       int NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_auth_guard (
  match_id     uuid PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  fail_count   int NOT NULL DEFAULT 0,
  locked_until timestamptz NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. INDEXES FOR 500+ CONCURRENT USERS ────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_questions_track_lv_active
  ON public.questions(track, lv) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_questions_active_lv
  ON public.questions(lv) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_players_session_lookup
  ON public.players(match_id, session_id);

CREATE INDEX IF NOT EXISTS idx_players_match_rank
  ON public.players(match_id, (status = 'disqualified'), level DESC, level_update_time ASC, best_level DESC, fails ASC, cheats ASC);

CREATE INDEX IF NOT EXISTS idx_players_match_grp_rank
  ON public.players(match_id, grp, (status = 'disqualified'), level DESC, level_update_time ASC);

CREATE INDEX IF NOT EXISTS idx_players_room4_danger
  ON public.players(match_id) WHERE room >= 4 AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_players_online
  ON public.players(match_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_attempts_player
  ON public.attempts(player_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_recent
  ON public.feed_events(match_id, grp, id DESC);

CREATE INDEX IF NOT EXISTS idx_feed_match_latest
  ON public.feed_events(match_id, id DESC);

-- ─── 3. STRICT ROW LEVEL SECURITY (ZERO ANSWER LEAKAGE) ─────────────────────

ALTER TABLE public.matches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_auth_guard ENABLE ROW LEVEL SECURITY;

-- No public SELECT/INSERT/UPDATE policies! All access goes through SECURITY DEFINER RPCs.

-- ─── 4. DEFAULT MATCH BOOTSTRAP ──────────────────────────────────────────────

-- Migrate previous default match code if present
UPDATE public.matches
SET code = 'DANTE',
    status = 'pending',
    admin_code_hash = encode(digest('stalin', 'sha256'), 'hex')
WHERE code = 'DANTE'
  AND NOT EXISTS (SELECT 1 FROM public.matches WHERE code = 'DANTE');

INSERT INTO public.matches (code, status, admin_code_hash)
VALUES (
  'DANTE',
  'pending',
  encode(digest('stalin', 'sha256'), 'hex')
)
ON CONFLICT (code) DO UPDATE
  SET status = 'pending',
      global_ends_at = NULL,
      paused_remaining_ms = NULL,
      last_game_over = NULL,
      pulse_cache = NULL,
      leaderboard_dirty = true,
      admin_code_hash = EXCLUDED.admin_code_hash,
      config = public.matches.config || '{"mainTimerSec": 60, "roomTimerSec": 60}'::jsonb;

-- ─── 5. HELPER FUNCTIONS ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.eclipse_serialize_player(p public.players)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'id', p.id::text,
    'name', p.name,
    'year', p.year,
    'group', p.grp,
    'level', p.level,
    'phase', p.phase,
    'room', p.room,
    'resets', p.resets,
    'bestLevel', p.best_level,
    'solved', p.solved,
    'fails', p.fails,
    'hintsUsed', p.hints_used,
    'cheats', p.cheats,
    'score', p.score,
    'streak', p.streak,
    'finished', p.finished,
    'finishedAt', CASE WHEN p.finish_time IS NOT NULL THEN floor(extract(epoch FROM p.finish_time) * 1000) ELSE NULL END,
    'online', p.last_seen_at > (now() - interval '35 seconds'),
    'status', p.status,
    'time', GREATEST(0, extract(epoch FROM (COALESCE(CASE WHEN p.finished THEN p.finish_time END, p.level_update_time) - p.start_time)))
  );
$$;

-- Pick & shuffle next question inside Postgres without exposing correct_option to the client
CREATE OR REPLACE FUNCTION public.eclipse_issue_question(
  p_player_id uuid,
  p_config jsonb,
  p_transition_delay_ms int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_p public.players;
  v_total_levels int;
  v_next_lv int;
  v_target int;
  v_frac numeric;
  v_timer_sec int;
  v_q public.questions;
  v_labels text[] := ARRAY['A', 'B', 'C', 'D'];
  v_perm int[];
  v_opts jsonb := '[]'::jsonb;
  v_correct_id text := 'A';
  v_token text;
  v_deadline timestamptz;
  v_client_q jsonb;
  i int;
BEGIN
  SELECT * INTO v_p FROM public.players WHERE id = p_player_id FOR UPDATE;
  IF NOT FOUND OR v_p.status <> 'active' OR v_p.finished THEN
    RETURN NULL;
  END IF;

  v_total_levels := COALESCE((p_config->>'totalLevels')::int, 60);
  v_next_lv := LEAST(v_total_levels, GREATEST(1, v_p.level + 1));

  IF v_p.phase = 'MAIN' OR v_p.room <= 0 THEN
    v_target := v_next_lv;
    v_timer_sec := COALESCE((p_config->>'mainTimerSec')::int, 60);
  ELSE
    v_frac := COALESCE((p_config->'roomDifficultyFractions'->>(LEAST(3, GREATEST(0, v_p.room - 1))))::numeric, 0.2);
    v_target := GREATEST(1, LEAST(v_next_lv, round(v_next_lv * v_frac)::int));
    v_timer_sec := COALESCE((p_config->>'roomTimerSec')::int, 60);
  END IF;

  -- 1. Unseen question matching target or nearest difficulty across unified bank
  SELECT * INTO v_q
  FROM public.questions
  WHERE active = true
    AND lv >= 1
    AND id <> COALESCE(v_p.last_question_id, '')
    AND NOT (id = ANY(v_p.seen_ids))
  ORDER BY abs(lv - v_target) ASC,
           CASE WHEN v_p.phase = 'ROOM' AND lv <= v_target THEN 0 ELSE 1 END ASC,
           random()
  LIMIT 1;

  -- 2. Fallback if pool exhausted
  IF NOT FOUND THEN
    SELECT * INTO v_q
    FROM public.questions
    WHERE active = true
      AND lv >= 1
      AND id <> COALESCE(v_p.last_question_id, '')
    ORDER BY abs(lv - v_target) ASC, random()
    LIMIT 1;
  END IF;

  -- 3. Last resort fallback
  IF NOT FOUND THEN
    SELECT * INTO v_q FROM public.questions WHERE active = true ORDER BY random() LIMIT 1;
  END IF;

  -- Shuffle option indices 0..3
  SELECT array_agg(idx ORDER BY random()) INTO v_perm FROM generate_series(0, 3) AS idx;
  FOR i IN 1..4 LOOP
    v_opts := v_opts || jsonb_build_array(
      jsonb_build_object('id', v_labels[i], 'text', v_q.options->(v_perm[i]))
    );
    IF v_perm[i] = v_q.correct_option THEN
      v_correct_id := v_labels[i];
    END IF;
  END LOOP;

  v_token := encode(gen_random_bytes(12), 'hex');
  v_deadline := now() + make_interval(secs => v_timer_sec) + ((p_transition_delay_ms || ' milliseconds')::interval);

  v_client_q := jsonb_build_object(
    'questionToken', v_token,
    'id', v_q.id,
    'text', v_q.q,
    'options', v_opts,
    'difficulty', v_q.lv,
    'type', v_q.type,
    'topic', v_q.topic,
    'deadlineAt', floor(extract(epoch FROM v_deadline) * 1000),
    'phase', v_p.phase,
    'room', v_p.room,
    'targetLevel', v_next_lv,
    'hintAvailable', true
  );

  UPDATE public.players
  SET last_question_id = v_q.id,
      seen_ids = CASE WHEN array_length(seen_ids, 1) >= 200 THEN ARRAY[v_q.id] ELSE array_append(seen_ids, v_q.id) END,
      active_token = v_token,
      active_question = v_client_q,
      active_correct_option_id = v_correct_id,
      active_deadline_at = v_deadline,
      active_answered = false,
      active_transition_pending = (p_transition_delay_ms > 0)
  WHERE id = p_player_id;

  RETURN v_client_q;
END;
$$;

-- ─── 6. PLAYER RPCs ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.eclipse_join_match(
  p_match_code text,
  p_session_id text,
  p_name text,
  p_year int,
  p_reenter boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_match public.matches;
  v_player public.players;
  v_code text := upper(trim(COALESCE(p_match_code, '')));
  v_clean_session text := trim(COALESCE(p_session_id, ''));
  v_clean_name text;
  v_clean_year int := LEAST(4, GREATEST(1, COALESCE(p_year, 1)));
  v_grp text := CASE WHEN v_clean_year >= 2 THEN 'senior' ELSE 'junior' END;
  v_q jsonb;
  v_rank int;
  v_player_count int;
BEGIN
  IF length(v_clean_session) < 8 OR length(v_clean_session) > 96 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid session token.');
  END IF;

  SELECT * INTO v_match FROM public.matches WHERE code = v_code LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid Match Code.');
  END IF;

  v_clean_name := COALESCE(NULLIF(left(regexp_replace(trim(COALESCE(p_name, '')), '[\x00-\x1F\x7F]', '', 'g'), 24), ''), 'UNKNOWN');

  SELECT * INTO v_player
  FROM public.players
  WHERE match_id = v_match.id AND session_id = v_clean_session
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT count(*) INTO v_player_count FROM public.players WHERE match_id = v_match.id;
    IF v_player_count >= 800 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Match arena has reached capacity (800 players max).');
    END IF;
    INSERT INTO public.players (match_id, session_id, name, year, grp)
    VALUES (v_match.id, v_clean_session, v_clean_name, v_clean_year, v_grp)
    RETURNING * INTO v_player;
  ELSE
    IF p_reenter AND v_player.status <> 'disqualified' THEN
      IF v_player.start_time > now() - interval '3 seconds' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Please wait a moment before re-entering.');
      END IF;
      UPDATE public.players
      SET name = v_clean_name,
          year = v_clean_year,
          grp = v_grp,
          level = 0,
          phase = 'MAIN',
          room = 0,
          resets = 0,
          solved = 0,
          fails = 0,
          hints_used = 0,
          score = 0,
          streak = 0,
          main_fails_on_level = 0,
          finished = false,
          status = 'active',
          start_time = now(),
          level_update_time = now(),
          finish_time = NULL,
          last_seen_at = now(),
          seen_ids = '{}',
          last_question_id = NULL,
          active_token = NULL,
          active_question = NULL,
          active_answered = false
      WHERE id = v_player.id
      RETURNING * INTO v_player;
    ELSE
      UPDATE public.players
      SET name = v_clean_name,
          year = v_clean_year,
          grp = v_grp,
          last_seen_at = CASE WHEN last_seen_at < now() - interval '25 seconds' THEN now() ELSE last_seen_at END
      WHERE id = v_player.id
      RETURNING * INTO v_player;
    END IF;
  END IF;

  IF v_player.status = 'active' AND NOT v_player.finished AND v_match.status = 'live' THEN
    IF v_player.active_question IS NOT NULL AND NOT v_player.active_answered AND v_player.active_deadline_at > now() + interval '500 milliseconds' THEN
      v_q := v_player.active_question;
    ELSE
      v_q := public.eclipse_issue_question(v_player.id, v_match.config, 0);
      SELECT * INTO v_player FROM public.players WHERE id = v_player.id;
    END IF;
  ELSIF v_player.status = 'active' AND NOT v_player.finished AND v_match.status = 'paused' AND v_player.active_question IS NOT NULL AND NOT v_player.active_answered THEN
    v_q := v_player.active_question;
  END IF;

  SELECT count(*) + 1 INTO v_rank
  FROM public.players
  WHERE match_id = v_match.id
    AND (status = 'disqualified') = false
    AND (
      level > v_player.level
      OR (level = v_player.level AND level_update_time < v_player.level_update_time)
    );

  RETURN jsonb_build_object(
    'ok', true,
    'matchCode', v_match.code,
    'matchStatus', v_match.status,
    'config', v_match.config,
    'globalRemainingMs', CASE WHEN v_match.global_ends_at IS NOT NULL THEN GREATEST(0, floor(extract(epoch FROM (v_match.global_ends_at - now())) * 1000)) ELSE NULL END,
    'player', public.eclipse_serialize_player(v_player),
    'question', v_q,
    'rank', v_rank,
    'lastGameOver', v_match.last_game_over
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.eclipse_ready_next(
  p_match_code text,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_match public.matches;
  v_player public.players;
  v_timer_sec int;
  v_deadline timestamptz;
  v_q jsonb;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE code = upper(trim(p_match_code)) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false); END IF;

  SELECT * INTO v_player
  FROM public.players
  WHERE match_id = v_match.id AND session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND OR v_player.status <> 'active' OR v_player.finished THEN
    RETURN jsonb_build_object('ok', true, 'question', NULL);
  END IF;

  -- When Master starts the match from pending -> live, issue Question 1 on demand
  IF v_match.status = 'live' AND v_player.active_question IS NULL THEN
    v_q := public.eclipse_issue_question(v_player.id, v_match.config, 0);
    RETURN jsonb_build_object('ok', true, 'question', v_q);
  END IF;

  IF v_player.active_question IS NULL OR v_player.active_answered OR NOT v_player.active_transition_pending THEN
    RETURN jsonb_build_object('ok', true, 'question', v_player.active_question);
  END IF;

  v_timer_sec := CASE
    WHEN v_player.phase = 'MAIN' THEN COALESCE((v_match.config->>'mainTimerSec')::int, 60)
    ELSE COALESCE((v_match.config->>'roomTimerSec')::int, 60)
  END;
  v_deadline := now() + make_interval(secs => v_timer_sec);
  v_q := jsonb_set(v_player.active_question, '{deadlineAt}', to_jsonb(floor(extract(epoch FROM v_deadline) * 1000)));

  UPDATE public.players
  SET active_deadline_at = v_deadline,
      active_question = v_q,
      active_transition_pending = false,
      last_seen_at = now()
  WHERE id = v_player.id;

  RETURN jsonb_build_object('ok', true, 'question', v_q);
END;
$$;

CREATE OR REPLACE FUNCTION public.eclipse_submit_answer(
  p_match_code text,
  p_session_id text,
  p_question_token text,
  p_option_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_match public.matches;
  v_p public.players;
  v_is_timeout boolean;
  v_is_correct boolean;
  v_rem_sec int;
  v_total_levels int;
  v_rooms_per_level int;
  v_max_fails int;
  v_return_mode text;
  v_transition text;
  v_points int := 0;
  v_prev_level int;
  v_prev_room int;
  v_next_q jsonb := NULL;
  v_rank int;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE code = upper(trim(p_match_code)) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Match not found'); END IF;
  IF v_match.status <> 'live' THEN RETURN jsonb_build_object('ok', false, 'error', 'Match is not live'); END IF;

  SELECT * INTO v_p
  FROM public.players
  WHERE match_id = v_match.id AND session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND OR v_p.status <> 'active' OR v_p.active_answered OR v_p.active_token <> p_question_token THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Question token expired or already answered');
  END IF;

  v_prev_level := v_p.level;
  v_prev_room := v_p.room;
  v_is_timeout := (p_option_id IS NULL) OR (p_option_id = '__TIMEOUT__') OR (now() > (v_p.active_deadline_at + interval '3 seconds'));
  v_is_correct := (NOT v_is_timeout) AND (p_option_id = v_p.active_correct_option_id);
  v_rem_sec := GREATEST(0, ceil(extract(epoch FROM (v_p.active_deadline_at - now())))::int);

  v_total_levels := COALESCE((v_match.config->>'totalLevels')::int, 60);
  v_rooms_per_level := COALESCE((v_match.config->>'roomsPerLevel')::int, 4);
  v_max_fails := NULLIF(v_match.config->>'maxMainFailsPerLevel', '')::int;
  v_return_mode := COALESCE(v_match.config->>'returnMode', 'same_question');

  IF v_p.phase = 'MAIN' THEN
    IF v_is_correct THEN
      v_p.level := v_p.level + 1;
      v_p.best_level := GREATEST(v_p.best_level, v_p.level);
      v_p.solved := v_p.solved + 1;
      v_p.streak := v_p.streak + 1;
      v_p.main_fails_on_level := 0;
      v_p.level_update_time := now();
      v_points := 100 + v_rem_sec * 2 + floor(100 * v_p.streak * 0.1)::int;
      v_p.score := v_p.score + v_points;

      IF v_p.level >= v_total_levels THEN
        v_p.finished := true;
        v_p.finish_time := now();
        v_p.status := 'won';
        v_transition := 'FINISH';
      ELSE
        v_transition := 'ADVANCE';
      END IF;
    ELSE
      v_p.fails := v_p.fails + 1;
      v_p.streak := 0;
      v_p.main_fails_on_level := v_p.main_fails_on_level + 1;

      IF v_max_fails IS NOT NULL AND v_max_fails > 0 AND v_p.main_fails_on_level >= v_max_fails THEN
        v_p.level := 0;
        v_p.phase := 'MAIN';
        v_p.room := 0;
        v_p.resets := v_p.resets + 1;
        v_p.score := 0;
        v_p.main_fails_on_level := 0;
        v_transition := 'RESET';
      ELSE
        v_p.phase := 'ROOM';
        v_p.room := 1;
        v_transition := 'ENTER_ROOM';
      END IF;
    END IF;
  ELSE
    -- ROOM recovery
    IF v_is_correct THEN
      v_p.solved := v_p.solved + 1;
      v_points := round((100 + v_rem_sec * 2) * 0.5)::int;
      v_p.score := v_p.score + v_points;

      IF v_return_mode = 'next_level' THEN
        v_p.level := v_p.level + 1;
        v_p.best_level := GREATEST(v_p.best_level, v_p.level);
        v_p.phase := 'MAIN';
        v_p.room := 0;
        v_p.main_fails_on_level := 0;
        v_p.level_update_time := now();
        IF v_p.level >= v_total_levels THEN
          v_p.finished := true;
          v_p.finish_time := now();
          v_p.status := 'won';
          v_transition := 'FINISH';
        ELSE
          v_transition := 'RETURN_TO_MAIN';
        END IF;
      ELSE
        v_p.phase := 'MAIN';
        v_p.room := 0;
        v_transition := 'RETURN_TO_MAIN';
      END IF;
    ELSE
      v_p.fails := v_p.fails + 1;
      v_p.streak := 0;
      IF v_p.room < v_rooms_per_level THEN
        v_p.room := v_p.room + 1;
        v_transition := 'NEXT_ROOM';
      ELSE
        v_p.level := 0;
        v_p.phase := 'MAIN';
        v_p.room := 0;
        v_p.resets := v_p.resets + 1;
        v_p.score := 0;
        v_p.main_fails_on_level := 0;
        v_transition := 'RESET';
      END IF;
    END IF;
  END IF;

  UPDATE public.players
  SET level = v_p.level,
      phase = v_p.phase,
      room = v_p.room,
      resets = v_p.resets,
      best_level = v_p.best_level,
      solved = v_p.solved,
      fails = v_p.fails,
      score = v_p.score,
      streak = v_p.streak,
      main_fails_on_level = v_p.main_fails_on_level,
      finished = v_p.finished,
      finish_time = v_p.finish_time,
      level_update_time = v_p.level_update_time,
      status = v_p.status,
      active_answered = true,
      last_seen_at = now()
  WHERE id = v_p.id;

  INSERT INTO public.attempts (match_id, player_id, question_id, phase, room, level, correct, transition)
  VALUES (v_match.id, v_p.id, COALESCE(v_p.last_question_id, 'UNKNOWN'), CASE WHEN v_prev_room > 0 THEN 'ROOM' ELSE 'MAIN' END, v_prev_room, v_prev_level, v_is_correct, v_transition);

  IF v_transition IN ('ADVANCE', 'FINISH', 'ENTER_ROOM', 'NEXT_ROOM', 'RESET') THEN
    INSERT INTO public.feed_events (match_id, grp, t, n, lv, room)
    VALUES (
      v_match.id,
      v_p.grp,
      CASE
        WHEN v_transition = 'ADVANCE' THEN 'lv'
        WHEN v_transition = 'FINISH' THEN 'won'
        WHEN v_transition = 'RESET' THEN 'reset'
        WHEN v_p.room >= v_rooms_per_level THEN 'room4'
        ELSE 'fall'
      END,
      v_p.name,
      v_p.level,
      v_p.room
    );
  END IF;

  IF v_p.status = 'active' AND NOT v_p.finished THEN
    v_next_q := public.eclipse_issue_question(v_p.id, v_match.config, CASE WHEN v_is_correct THEN 2200 ELSE 5500 END);
  END IF;

  SELECT count(*) + 1 INTO v_rank
  FROM public.players
  WHERE match_id = v_match.id
    AND (status = 'disqualified') = false
    AND (
      level > v_p.level
      OR (level = v_p.level AND level_update_time < v_p.level_update_time)
    );

  RETURN jsonb_build_object(
    'ok', true,
    'result', jsonb_build_object(
      'correct', v_is_correct,
      'isTimeout', v_is_timeout,
      'transition', v_transition,
      'pointsGained', v_points,
      'previousRoom', v_prev_room,
      'newRoom', v_p.room,
      'newLevel', v_p.level
    ),
    'player', public.eclipse_serialize_player(v_p),
    'nextQuestion', v_next_q,
    'rank', v_rank
  );
END;
$$;

DROP FUNCTION IF EXISTS public.eclipse_report_cheat(text, text);

CREATE OR REPLACE FUNCTION public.eclipse_report_cheat(
  p_match_code text,
  p_session_id text,
  p_kind text DEFAULT 'unknown'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_match_id uuid;
  v_p public.players;
  v_should_feed boolean := false;
BEGIN
  SELECT id INTO v_match_id FROM public.matches WHERE code = upper(trim(p_match_code)) LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT * INTO v_p FROM public.players WHERE match_id = v_match_id AND session_id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  -- Ignore synthetic flood calls occurring faster than 1.5s from the same session
  IF v_p.last_seen_at > now() - interval '1500 milliseconds' AND v_p.cheats >= 25 THEN
    RETURN;
  END IF;

  v_should_feed := (v_p.last_cheat_feed_at IS NULL OR v_p.last_cheat_feed_at < now() - interval '8 seconds');

  UPDATE public.players
  SET cheats = LEAST(cheats + 1, 10000),
      last_seen_at = now(),
      last_cheat_feed_at = CASE WHEN v_should_feed THEN now() ELSE last_cheat_feed_at END
  WHERE id = v_p.id;

  IF v_should_feed THEN
    INSERT INTO public.feed_events (match_id, grp, t, n) VALUES (v_match_id, v_p.grp, 'cheat', v_p.name);
    DELETE FROM public.feed_events
    WHERE match_id = v_match_id
      AND id < COALESCE((
        SELECT id FROM public.feed_events WHERE match_id = v_match_id ORDER BY id DESC OFFSET 24 LIMIT 1
      ), 0);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.eclipse_sever_run(
  p_match_code text,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_match_id uuid;
  v_p public.players;
BEGIN
  SELECT id INTO v_match_id FROM public.matches WHERE code = upper(trim(p_match_code)) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false); END IF;

  UPDATE public.players
  SET status = 'dead', active_answered = true, last_seen_at = now()
  WHERE match_id = v_match_id AND session_id = p_session_id AND status = 'active'
  RETURNING * INTO v_p;

  IF FOUND THEN
    INSERT INTO public.feed_events (match_id, grp, t, n) VALUES (v_match_id, v_p.grp, 'dead', v_p.name);
    RETURN jsonb_build_object('ok', true, 'player', public.eclipse_serialize_player(v_p));
  END IF;
  RETURN jsonb_build_object('ok', false);
END;
$$;

-- Coalesced pulse & top standings (rebuilt at most once per 2s across 500 concurrent players)
CREATE OR REPLACE FUNCTION public.eclipse_get_pulse(
  p_match_code text DEFAULT 'DANTE',
  p_session_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_match public.matches;
  v_p public.players;
  v_total int;
  v_online int;
  v_leader jsonb;
  v_top jsonb;
  v_feed jsonb;
  v_cache jsonb;
  v_rank int := NULL;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE code = upper(trim(COALESCE(p_match_code, 'DANTE'))) LIMIT 1;
  IF NOT FOUND THEN
    SELECT * INTO v_match FROM public.matches ORDER BY created_at DESC LIMIT 1;
  END IF;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false); END IF;

  -- Touch last_seen_at only if stale > 30s to minimize Postgres write pressure
  IF p_session_id IS NOT NULL THEN
    UPDATE public.players
    SET last_seen_at = now()
    WHERE match_id = v_match.id AND session_id = p_session_id AND last_seen_at < (now() - interval '30 seconds');

    SELECT * INTO v_p FROM public.players WHERE match_id = v_match.id AND session_id = p_session_id LIMIT 1;
  END IF;

  IF v_match.pulse_cache IS NOT NULL
     AND NOT v_match.leaderboard_dirty
     AND (
       (v_match.pulse_cached_at IS NOT NULL AND v_match.pulse_cached_at > (now() - interval '3 seconds'))
       OR NOT pg_try_advisory_xact_lock(hashtext('pulse:' || v_match.id::text))
     ) THEN
    v_cache := v_match.pulse_cache;
    v_total := (v_cache->>'total')::int;
    v_online := (v_cache->>'online')::int;
    v_leader := v_cache->'leader';
    v_top := v_cache->'topPlayers';
    v_feed := v_cache->'feed';
  ELSE
    SELECT count(*), count(*) FILTER (WHERE last_seen_at > now() - interval '35 seconds')
    INTO v_total, v_online
    FROM public.players WHERE match_id = v_match.id;

    SELECT jsonb_build_object('n', name, 'lv', level) INTO v_leader
    FROM public.players
    WHERE match_id = v_match.id AND status <> 'disqualified'
    ORDER BY level DESC, level_update_time ASC
    LIMIT 1;

    -- Compact top-25 + Room 4 Danger Zone snapshot shared across all players
    SELECT COALESCE(
      jsonb_agg(
        public.eclipse_serialize_player(sub)
        ORDER BY (sub.status = 'disqualified') ASC, sub.level DESC, sub.level_update_time ASC, sub.best_level DESC, sub.fails ASC
      ),
      '[]'::jsonb
    ) INTO v_top
    FROM (
      (SELECT * FROM public.players
       WHERE match_id = v_match.id
       ORDER BY (status = 'disqualified') ASC, level DESC, level_update_time ASC, best_level DESC, fails ASC
       LIMIT 25)
      UNION
      (SELECT * FROM public.players
       WHERE match_id = v_match.id AND room >= 4 AND status = 'active'
       LIMIT 25)
    ) sub;

    SELECT COALESCE(jsonb_agg(jsonb_build_object('t', f.t, 'n', f.n, 'lv', f.lv, 'room', f.room, 'g', f.grp)), '[]'::jsonb) INTO v_feed
    FROM (
      SELECT * FROM public.feed_events
      WHERE match_id = v_match.id
      ORDER BY id DESC LIMIT 6
    ) f;

    v_cache := jsonb_build_object(
      'total', v_total,
      'online', v_online,
      'leader', v_leader,
      'topPlayers', v_top,
      'feed', v_feed
    );

    UPDATE public.matches
    SET pulse_cache = v_cache,
        pulse_cached_at = now(),
        leaderboard_dirty = false
    WHERE id = v_match.id;
  END IF;

  IF v_p.id IS NOT NULL THEN
    SELECT count(*) + 1 INTO v_rank
    FROM public.players
    WHERE match_id = v_match.id AND (status = 'disqualified') = false
      AND (level > v_p.level OR (level = v_p.level AND level_update_time < v_p.level_update_time));
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'matchCode', v_match.code,
    'status', v_match.status,
    'config', v_match.config,
    'globalRemainingMs', CASE
      WHEN v_match.status = 'paused' AND v_match.paused_remaining_ms IS NOT NULL THEN v_match.paused_remaining_ms
      WHEN v_match.global_ends_at IS NOT NULL THEN GREATEST(0, floor(extract(epoch FROM (v_match.global_ends_at - now())) * 1000))
      ELSE NULL
    END,
    'total', v_total,
    'online', v_online,
    'grpTotal', v_total,
    'grpOnline', v_online,
    'leader', v_leader,
    'rank', v_rank,
    'myStatus', v_p.status,
    'topPlayers', v_top,
    'feed', v_feed,
    'lastGameOver', v_match.last_game_over
  );
END;
$$;

-- ─── 7. HOST / ADMIN RPCs ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.eclipse_get_standings(
  p_match_code text DEFAULT 'DANTE'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_match public.matches;
  v_players jsonb;
  v_online int;
  v_total int;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE code = upper(trim(COALESCE(p_match_code, 'DANTE'))) LIMIT 1;
  IF NOT FOUND THEN SELECT * INTO v_match FROM public.matches ORDER BY created_at DESC LIMIT 1; END IF;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false); END IF;

  SELECT count(*), count(*) FILTER (WHERE last_seen_at > now() - interval '35 seconds')
  INTO v_total, v_online FROM public.players WHERE match_id = v_match.id;

  SELECT COALESCE(jsonb_agg(public.eclipse_serialize_player(sub)), '[]'::jsonb) INTO v_players
  FROM (
    SELECT * FROM public.players
    WHERE match_id = v_match.id
    ORDER BY (status = 'disqualified') ASC, level DESC, level_update_time ASC, best_level DESC, fails ASC
    LIMIT 600
  ) sub;

  RETURN jsonb_build_object(
    'ok', true,
    'matchCode', v_match.code,
    'status', v_match.status,
    'config', v_match.config,
    'total', v_total,
    'online', v_online,
    'players', v_players,
    'globalRemainingMs', CASE
      WHEN v_match.status = 'paused' AND v_match.paused_remaining_ms IS NOT NULL THEN v_match.paused_remaining_ms
      WHEN v_match.global_ends_at IS NOT NULL THEN GREATEST(0, floor(extract(epoch FROM (v_match.global_ends_at - now())) * 1000))
      ELSE NULL
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.eclipse_verify_admin(
  p_match_id uuid,
  p_expected_hash text,
  p_admin_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_guard public.admin_auth_guard;
  v_hash text := encode(digest(lower(trim(COALESCE(p_admin_code, ''))), 'sha256'), 'hex');
  v_next_fails int;
BEGIN
  INSERT INTO public.admin_auth_guard (match_id, fail_count)
  VALUES (p_match_id, 0)
  ON CONFLICT (match_id) DO NOTHING;

  SELECT * INTO v_guard FROM public.admin_auth_guard WHERE match_id = p_match_id FOR UPDATE;

  IF v_guard.locked_until IS NOT NULL AND v_guard.locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Too many failed host attempts. Locked for 30 seconds.');
  END IF;

  IF p_expected_hash = v_hash THEN
    IF v_guard.fail_count > 0 OR v_guard.locked_until IS NOT NULL THEN
      UPDATE public.admin_auth_guard SET fail_count = 0, locked_until = NULL, updated_at = now() WHERE match_id = p_match_id;
    END IF;
    RETURN jsonb_build_object('ok', true);
  END IF;

  v_next_fails := CASE
    WHEN v_guard.locked_until IS NOT NULL AND v_guard.locked_until <= now() THEN 1
    ELSE v_guard.fail_count + 1
  END;

  IF v_next_fails >= 8 THEN
    UPDATE public.admin_auth_guard
    SET fail_count = 0, locked_until = now() + interval '30 seconds', updated_at = now()
    WHERE match_id = p_match_id;
    RETURN jsonb_build_object('ok', false, 'error', 'Too many failed host attempts. Locked for 30 seconds.');
  ELSE
    UPDATE public.admin_auth_guard
    SET fail_count = v_next_fails, locked_until = NULL, updated_at = now()
    WHERE match_id = p_match_id;
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid Host Passcode.');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.eclipse_host_auth(
  p_admin_code text,
  p_match_code text DEFAULT 'DANTE'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_match public.matches;
  v_auth jsonb;
  v_all jsonb;
  v_jun jsonb;
  v_sen jsonb;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE code = upper(trim(COALESCE(p_match_code, 'DANTE'))) LIMIT 1;
  IF NOT FOUND THEN SELECT * INTO v_match FROM public.matches ORDER BY created_at DESC LIMIT 1; END IF;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid Host Passcode.');
  END IF;

  v_auth := public.eclipse_verify_admin(v_match.id, v_match.admin_code_hash, p_admin_code);
  IF NOT COALESCE((v_auth->>'ok')::boolean, false) THEN
    RETURN v_auth;
  END IF;

  SELECT COALESCE(jsonb_object_agg(lv::text, cnt), '{}'::jsonb) INTO v_all
  FROM (SELECT lv, count(*) AS cnt FROM public.questions WHERE active AND lv >= 1 GROUP BY lv) a;
  SELECT COALESCE(jsonb_object_agg(lv::text, cnt), '{}'::jsonb) INTO v_jun
  FROM (SELECT lv, count(*) AS cnt FROM public.questions WHERE track = 'junior' AND active AND lv >= 1 GROUP BY lv) j;
  SELECT COALESCE(jsonb_object_agg(lv::text, cnt), '{}'::jsonb) INTO v_sen
  FROM (SELECT lv, count(*) AS cnt FROM public.questions WHERE track = 'senior' AND active AND lv >= 1 GROUP BY lv) s;

  RETURN jsonb_build_object(
    'ok', true,
    'standings', public.eclipse_get_standings(v_match.code),
    'perDifficulty', jsonb_build_object('all', v_all, 'junior', v_jun, 'senior', v_sen)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.eclipse_host_action(
  p_admin_code text,
  p_match_code text,
  p_action text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_match public.matches;
  v_auth jsonb;
  v_new_code text;
  v_w_jun jsonb;
  v_w_sen jsonb;
  v_sec int;
  v_target_grp text;
  v_q jsonb;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE code = upper(trim(COALESCE(p_match_code, 'DANTE'))) LIMIT 1;
  IF NOT FOUND THEN SELECT * INTO v_match FROM public.matches ORDER BY created_at DESC LIMIT 1; END IF;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unauthorized');
  END IF;

  v_auth := public.eclipse_verify_admin(v_match.id, v_match.admin_code_hash, p_admin_code);
  IF NOT COALESCE((v_auth->>'ok')::boolean, false) THEN
    RETURN v_auth;
  END IF;

  IF p_action = 'set_status' THEN
    IF p_payload->>'status' = 'paused' AND v_match.status = 'live' THEN
      UPDATE public.matches
      SET status = 'paused',
          paused_remaining_ms = CASE WHEN global_ends_at IS NOT NULL THEN GREATEST(0, floor(extract(epoch FROM (global_ends_at - now())) * 1000)) ELSE NULL END,
          pulse_cache = NULL,
          leaderboard_dirty = true
      WHERE id = v_match.id;
      UPDATE public.players
      SET paused_remaining_ms = GREATEST(1000, floor(extract(epoch FROM (active_deadline_at - now())) * 1000))
      WHERE match_id = v_match.id AND status = 'active' AND NOT active_answered AND active_deadline_at IS NOT NULL;
    ELSIF p_payload->>'status' = 'pending' THEN
      UPDATE public.matches
      SET status = 'pending',
          paused_remaining_ms = CASE WHEN global_ends_at IS NOT NULL THEN GREATEST(0, floor(extract(epoch FROM (global_ends_at - now())) * 1000)) ELSE paused_remaining_ms END,
          pulse_cache = NULL,
          leaderboard_dirty = true
      WHERE id = v_match.id;
      UPDATE public.players
      SET paused_remaining_ms = CASE
            WHEN active_question IS NOT NULL AND NOT active_answered AND active_deadline_at IS NOT NULL
            THEN GREATEST(1000, floor(extract(epoch FROM (active_deadline_at - now())) * 1000))
            ELSE paused_remaining_ms
          END
      WHERE match_id = v_match.id AND status = 'active' AND NOT active_answered AND active_question IS NOT NULL;
    ELSIF p_payload->>'status' = 'live' THEN
      UPDATE public.matches
      SET status = 'live',
          global_ends_at = CASE WHEN paused_remaining_ms IS NOT NULL THEN now() + ((paused_remaining_ms || ' milliseconds')::interval) ELSE global_ends_at END,
          paused_remaining_ms = NULL,
          last_game_over = NULL,
          pulse_cache = NULL,
          leaderboard_dirty = true
      WHERE id = v_match.id;
      IF v_match.status = 'pending' THEN
        UPDATE public.players
        SET start_time = now(),
            level_update_time = now(),
            paused_remaining_ms = NULL
        WHERE match_id = v_match.id AND status = 'active' AND level = 0 AND active_question IS NULL;
      END IF;
      UPDATE public.players
      SET active_deadline_at = now() + ((COALESCE(paused_remaining_ms, 60000) || ' milliseconds')::interval),
          active_question = CASE WHEN active_question IS NOT NULL THEN jsonb_set(active_question, '{deadlineAt}', to_jsonb(floor(extract(epoch FROM (now() + ((COALESCE(paused_remaining_ms, 60000) || ' milliseconds')::interval))) * 1000))) ELSE NULL END,
          paused_remaining_ms = NULL
      WHERE match_id = v_match.id AND status = 'active' AND NOT active_answered AND active_question IS NOT NULL;
    ELSIF p_payload->>'status' = 'ended' THEN
      SELECT public.eclipse_serialize_player(p) INTO v_w_jun FROM public.players p WHERE match_id = v_match.id AND status <> 'disqualified' ORDER BY level DESC, level_update_time ASC, best_level DESC, fails ASC LIMIT 1;
      v_w_sen := v_w_jun;
      UPDATE public.matches
      SET status = 'ended',
          global_ends_at = NULL,
          paused_remaining_ms = NULL,
          pulse_cache = NULL,
          leaderboard_dirty = true,
          last_game_over = jsonb_build_object(
            'at', floor(extract(epoch FROM now()) * 1000),
            'winners', jsonb_build_object('junior', v_w_jun, 'senior', v_w_sen),
            'message', 'THE ECLIPSE CYCLE HAS CONCLUDED.'
          )
      WHERE id = v_match.id;
    END IF;

  ELSIF p_action = 'update_config' THEN
    UPDATE public.matches SET config = v_match.config || p_payload, pulse_cache = NULL, leaderboard_dirty = true WHERE id = v_match.id;

  ELSIF p_action = 'start_timer' THEN
    v_sec := LEAST(86400, GREATEST(10, COALESCE((p_payload->>'seconds')::int, 3600)));
    UPDATE public.matches
    SET global_ends_at = CASE WHEN status = 'pending' THEN NULL ELSE now() + make_interval(secs => v_sec) END,
        paused_remaining_ms = CASE WHEN status = 'pending' THEN v_sec * 1000 ELSE NULL END,
        status = CASE WHEN status = 'ended' THEN 'live' ELSE status END,
        last_game_over = NULL,
        pulse_cache = NULL,
        leaderboard_dirty = true
    WHERE id = v_match.id;

  ELSIF p_action = 'disqualify' THEN
    UPDATE public.players SET status = 'disqualified', active_answered = true WHERE match_id = v_match.id AND id = (p_payload->>'playerId')::uuid;
    UPDATE public.matches SET pulse_cache = NULL, leaderboard_dirty = true WHERE id = v_match.id;

  ELSIF p_action = 'reset_all' THEN
    DELETE FROM public.players WHERE match_id = v_match.id;
    DELETE FROM public.feed_events WHERE match_id = v_match.id;
    UPDATE public.matches SET status = 'pending', global_ends_at = NULL, paused_remaining_ms = NULL, last_game_over = NULL, pulse_cache = NULL, leaderboard_dirty = true WHERE id = v_match.id;

  ELSIF p_action = 'regen_code' THEN
    v_new_code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    UPDATE public.matches SET code = v_new_code, leaderboard_dirty = true WHERE id = v_match.id;

  ELSIF p_action = 'upload_questions' THEN
    v_target_grp := COALESCE(p_payload->>'targetGroup', 'all');
    IF v_target_grp IN ('all', 'both') THEN
      DELETE FROM public.questions WHERE track IN ('junior', 'senior');
      FOR v_q IN SELECT * FROM jsonb_array_elements(p_payload->'questions') LOOP
        INSERT INTO public.questions (id, track, lv, q, options, correct_option, type, topic, explanation)
        VALUES (
          (v_q->>'id'), 'junior', (v_q->>'lv')::int, v_q->>'q', v_q->'options', (v_q->>'a')::int,
          COALESCE(v_q->>'type', 'TECH'), COALESCE(v_q->>'topic', 'General'), v_q->>'explanation'
        ) ON CONFLICT (id) DO UPDATE SET lv = EXCLUDED.lv, q = EXCLUDED.q, options = EXCLUDED.options, correct_option = EXCLUDED.correct_option;
      END LOOP;
    ELSIF v_target_grp = 'junior' THEN
      DELETE FROM public.questions WHERE track = 'junior';
      FOR v_q IN SELECT * FROM jsonb_array_elements(p_payload->'questions') LOOP
        INSERT INTO public.questions (id, track, lv, q, options, correct_option, type, topic, explanation)
        VALUES (
          (v_q->>'id') || '-J', 'junior', (v_q->>'lv')::int, v_q->>'q', v_q->'options', (v_q->>'a')::int,
          COALESCE(v_q->>'type', 'TECH'), COALESCE(v_q->>'topic', 'General'), v_q->>'explanation'
        ) ON CONFLICT (id) DO UPDATE SET lv = EXCLUDED.lv, q = EXCLUDED.q, options = EXCLUDED.options, correct_option = EXCLUDED.correct_option;
      END LOOP;
    ELSIF v_target_grp = 'senior' THEN
      DELETE FROM public.questions WHERE track = 'senior';
      FOR v_q IN SELECT * FROM jsonb_array_elements(p_payload->'questions') LOOP
        INSERT INTO public.questions (id, track, lv, q, options, correct_option, type, topic, explanation)
        VALUES (
          (v_q->>'id') || '-S', 'senior', (v_q->>'lv')::int, v_q->>'q', v_q->'options', (v_q->>'a')::int,
          COALESCE(v_q->>'type', 'TECH'), COALESCE(v_q->>'topic', 'General'), v_q->>'explanation'
        ) ON CONFLICT (id) DO UPDATE SET lv = EXCLUDED.lv, q = EXCLUDED.q, options = EXCLUDED.options, correct_option = EXCLUDED.correct_option;
      END LOOP;
    END IF;
  END IF;

  SELECT * INTO v_match FROM public.matches WHERE id = v_match.id;
  RETURN jsonb_build_object('ok', true, 'standings', public.eclipse_get_standings(v_match.code));
END;
$$;

GRANT EXECUTE ON FUNCTION public.eclipse_join_match(text, text, text, int, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclipse_ready_next(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclipse_submit_answer(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclipse_report_cheat(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclipse_sever_run(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclipse_get_pulse(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclipse_get_standings(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclipse_host_auth(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclipse_host_action(text, text, text, jsonb) TO anon, authenticated;
