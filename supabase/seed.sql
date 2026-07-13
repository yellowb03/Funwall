-- Funwall seed data (optional local development)
-- Idempotent preferences insert after a real auth user exists.
-- Memory-repo fixtures for offline vertical slice live in
-- src/features/activities/seed-fixtures.ts (list.v1 wheel content).
--
-- No auth.users rows are inserted here; create a user via Supabase Auth first.

-- Example (run after signing up as owner):
-- insert into public.owner_preferences (owner_id, sound_enabled, reduced_motion)
-- values ('00000000-0000-4000-8000-000000000001', true, false)
-- on conflict (owner_id) do nothing;

-- When using Supabase locally with a known owner UUID, you may insert demo
-- activities matching the list.v1 classroom supplies fixture. Prefer the
-- application create/finalize path so revision history stays consistent.
