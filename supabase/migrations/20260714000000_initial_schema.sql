-- Funwall initial schema (Workstream 01 tightened)
-- Tables, indexes, RLS policies, and public snapshot security-definer RPC.
-- Apply with Supabase CLI when a project is linked: `supabase db push` / `supabase migration up`.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- folders
-- ---------------------------------------------------------------------------
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists folders_owner_id_idx on public.folders (owner_id);

-- ---------------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  instruction text,
  template_key text not null,
  content_family text not null,
  content_version integer not null default 1,
  content jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  theme_key text not null default 'classic',
  -- draft | published | archived (soft workflow; deleted_at is soft delete)
  lifecycle_state text not null default 'draft'
    check (lifecycle_state in ('draft', 'published', 'archived')),
  public_slug text unique,
  revision integer not null default 0 check (revision >= 0),
  play_count integer not null default 0 check (play_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists activities_owner_id_idx on public.activities (owner_id);
create index if not exists activities_public_slug_idx on public.activities (public_slug)
  where public_slug is not null and deleted_at is null;
create index if not exists activities_updated_at_idx on public.activities (owner_id, updated_at desc);
create index if not exists activities_owner_title_idx on public.activities (owner_id, title);

-- ---------------------------------------------------------------------------
-- activity_versions (revision history / autosave snapshots)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_versions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  revision integer not null check (revision >= 0),
  content jsonb not null,
  settings jsonb not null,
  theme_key text not null,
  author_id uuid references auth.users (id) on delete set null,
  reason text not null check (reason in ('autosave', 'done', 'conversion', 'restore')),
  created_at timestamptz not null default now(),
  unique (activity_id, revision)
);

create index if not exists activity_versions_activity_id_idx
  on public.activity_versions (activity_id, revision desc);

-- ---------------------------------------------------------------------------
-- media_assets
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  storage_path text,
  remote_url text,
  provider text,
  provider_asset_id text,
  mime_type text,
  width integer,
  height integer,
  content_hash text,
  license text,
  license_url text,
  attribution_text text,
  creator_name text,
  creator_url text,
  source_page_url text,
  title text,
  alt_text text,
  focal_x real check (focal_x is null or (focal_x >= 0 and focal_x <= 1)),
  focal_y real check (focal_y is null or (focal_y >= 0 and focal_y <= 1)),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists media_assets_owner_id_idx on public.media_assets (owner_id);

-- ---------------------------------------------------------------------------
-- play_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.play_sessions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  public_slug text,
  template_key text not null,
  template_version integer not null default 1,
  activity_revision integer not null,
  seed text not null,
  player_token text,
  player_display_name text,
  status text not null default 'started'
    check (status in ('started', 'completed', 'game_over', 'abandoned', 'invalid')),
  score integer check (score is null or score >= 0),
  accuracy real check (accuracy is null or (accuracy >= 0 and accuracy <= 1)),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  settings_snapshot jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists play_sessions_activity_id_idx on public.play_sessions (activity_id);

-- ---------------------------------------------------------------------------
-- play_events
-- ---------------------------------------------------------------------------
create table if not exists public.play_events (
  id bigserial primary key,
  session_id uuid not null references public.play_sessions (id) on delete cascade,
  sequence integer not null check (sequence > 0),
  event_type text not null,
  item_id uuid,
  elapsed_ms integer not null check (elapsed_ms >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, sequence)
);

create index if not exists play_events_session_id_idx on public.play_events (session_id);

-- ---------------------------------------------------------------------------
-- leaderboard_entries (scored templates only; never Wheel)
-- ---------------------------------------------------------------------------
create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.play_sessions (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  score integer not null check (score >= 0),
  duration_ms integer not null check (duration_ms >= 0),
  moderation_state text not null default 'visible'
    check (moderation_state in ('visible', 'hidden', 'flagged')),
  submitted_at timestamptz not null default now()
);

create index if not exists leaderboard_entries_activity_score_idx
  on public.leaderboard_entries (activity_id, score desc, duration_ms asc);

-- ---------------------------------------------------------------------------
-- owner_preferences
-- ---------------------------------------------------------------------------
create table if not exists public.owner_preferences (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  sound_enabled boolean not null default true,
  reduced_motion boolean not null default false,
  template_defaults jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.folders enable row level security;
alter table public.activities enable row level security;
alter table public.activity_versions enable row level security;
alter table public.media_assets enable row level security;
alter table public.play_sessions enable row level security;
alter table public.play_events enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.owner_preferences enable row level security;

-- Drop Phase-1 stub policies if re-applied
drop policy if exists folders_owner_all on public.folders;
drop policy if exists activities_owner_all on public.activities;
drop policy if exists activities_public_read_published on public.activities;
drop policy if exists activity_versions_owner_all on public.activity_versions;
drop policy if exists media_assets_owner_all on public.media_assets;
drop policy if exists play_sessions_insert_public on public.play_sessions;
drop policy if exists play_sessions_owner_select on public.play_sessions;
drop policy if exists play_events_insert_public on public.play_events;
drop policy if exists play_events_owner_select on public.play_events;
drop policy if exists leaderboard_public_select on public.leaderboard_entries;
drop policy if exists leaderboard_insert_public on public.leaderboard_entries;
drop policy if exists owner_preferences_owner_all on public.owner_preferences;

-- Owner full access to own folders
create policy folders_owner_all on public.folders
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Owner full access to own activities (including soft-deleted for trash/restore)
create policy activities_owner_all on public.activities
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- IMPORTANT: No direct public SELECT on activities.
-- Anonymous clients cannot enumerate rows. Public play resolves via
-- security-definer RPC `resolve_public_activity_snapshot` only.

-- Owner versions
create policy activity_versions_owner_all on public.activity_versions
  for all
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_id and a.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.activities a
      where a.id = activity_id and a.owner_id = auth.uid()
    )
  );

-- Owner media
create policy media_assets_owner_all on public.media_assets
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Play sessions: no open insert. Owners may read sessions for their activities.
-- Session creation is intended via controlled server path / future RPC (WS03).
create policy play_sessions_owner_select on public.play_sessions
  for select
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_id and a.owner_id = auth.uid()
    )
  );

create policy play_events_owner_select on public.play_events
  for select
  using (
    exists (
      select 1
      from public.play_sessions s
      join public.activities a on a.id = s.activity_id
      where s.id = session_id and a.owner_id = auth.uid()
    )
  );

-- Leaderboard: public read only for published, non-deleted activities.
-- Inserts go through future validated RPC (not open insert).
create policy leaderboard_public_select on public.leaderboard_entries
  for select
  using (
    moderation_state = 'visible'
    and exists (
      select 1 from public.activities a
      where a.id = activity_id
        and a.deleted_at is null
        and a.lifecycle_state = 'published'
    )
  );

-- Owner preferences
create policy owner_preferences_owner_all on public.owner_preferences
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- Security-definer: public activity snapshot (sanitized)
-- ---------------------------------------------------------------------------
-- Returns only player-safe fields. Never exposes owner_id, deleted drafts,
-- or non-published / archived activities.
create or replace function public.resolve_public_activity_snapshot(p_public_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.activities%rowtype;
  settings_public jsonb;
  is_scored boolean;
  has_leaderboard boolean;
  template_version integer;
begin
  if p_public_slug is null or length(trim(p_public_slug)) < 8 then
    return null;
  end if;

  select * into r
  from public.activities a
  where a.public_slug = p_public_slug
  limit 1;

  if not found then
    return null;
  end if;

  if r.deleted_at is not null then
    return null;
  end if;

  if r.lifecycle_state <> 'published' then
    return null;
  end if;

  is_scored := coalesce((r.settings ->> '__isScored')::boolean, false);
  has_leaderboard := coalesce((r.settings ->> '__hasLeaderboard')::boolean, false);
  template_version := coalesce((r.settings ->> '__templateVersion')::integer, 1);

  settings_public := r.settings
    - '__isScored'
    - '__hasLeaderboard'
    - '__templateVersion';

  return jsonb_build_object(
    'activityId', r.id,
    'publicSlug', r.public_slug,
    'revision', r.revision,
    'title', r.title,
    'instruction', r.instruction,
    'templateKey', r.template_key,
    'templateVersion', template_version,
    'content', r.content,
    'settings', settings_public,
    'themeKey', r.theme_key,
    'isScored', is_scored,
    'hasLeaderboard', has_leaderboard
  );
end;
$$;

revoke all on function public.resolve_public_activity_snapshot(text) from public;
grant execute on function public.resolve_public_activity_snapshot(text) to anon, authenticated;

comment on function public.resolve_public_activity_snapshot(text) is
  'Public play boundary: sanitized immutable snapshot by unguessable slug. SECURITY DEFINER; strips owner_id.';

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------
-- 1. No broad public SELECT on activities — prevents enumeration.
-- 2. Public resolve only via resolve_public_activity_snapshot.
-- 3. Play session/event/leaderboard inserts intentionally closed; WS03 adds RPCs.
-- 4. Wheel sessions must never create leaderboard_entries (app + future RPC).
-- 5. Soft-deleted / archived activities are not returned by the public RPC.
