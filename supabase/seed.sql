-- Funwall seed data (optional local development)
-- No auth.users rows are inserted here; create a user via Supabase Auth first.
-- Workstream 01 may expand classroom demo activities once auth is wired.

-- Example (run after signing up as owner):
-- insert into public.owner_preferences (owner_id, sound_enabled, reduced_motion)
-- values ('00000000-0000-4000-8000-000000000001', true, false)
-- on conflict (owner_id) do nothing;
