# Workstream 01: foundation, authentication, persistence, and dashboard

Recommended model: a senior full-stack TypeScript/Postgres agent experienced with Next.js, Supabase RLS, and migrations.

## Mission

Build the secure foundation that makes every activity durable: project scaffold, environments, authentication, database/storage migrations, data access services, My Activities, folders, versions, trash, public slugs, and owner/public authorization boundaries.

This workstream does not implement a game. Its proof is a generic/mock activity that can be created, saved, listed, duplicated, published, resolved publicly, soft-deleted, and restored.

## Starts when

- Integration lead has approved the target stack and source boundaries.
- Shared contracts have code-level counterparts or a committed provisional interface.

## Owned scope

- App bootstrap requested through the integration lead when shared root files are involved.
- `src/features/activities/**`
- `src/services/db/**`
- Authentication services/routes/components assigned by integration lead
- Dashboard, folders, trash, and activity-version persistence
- `supabase/migrations/**` and `supabase/seed.sql`, with migration order merged by integration lead
- Storage bucket/policy definitions
- Foundation tests

Do not implement template players, media provider search, semantic audio cues, or template-specific editor rows.

## Required deliverables

### A. Project baseline

- Compatible pinned Next/React/TypeScript/toolchain chosen from current stable packages.
- Strict TypeScript, lint, format, unit/component test, and E2E commands.
- Environment validation with clear missing-variable errors.
- Local development path documented.
- Preview deployment can render a health page before feature work.

The integration lead owns final edits to package and root config. Request dependencies rather than racing on shared files.

### B. Authentication

- Owner sign-in, sign-out, password reset or magic-link flow appropriate to Supabase.
- Server-side session verification for owner routes.
- Redirect back to the intended owner route after sign-in.
- Public play routes never require auth.
- No demo credentials or service keys in committed source.

### C. Database and storage

Implement versioned migrations for the logical tables in the master plan:

- Activities.
- Activity versions.
- Folders.
- Media asset metadata (storage content will be owned by Workstream 02).
- Play sessions/events.
- Leaderboard entries.
- Owner preferences.

Add constraints for owner IDs, template keys, content family/version, revision monotonicity, public state, soft-delete timestamps, and bounded public names where database-level enforcement is appropriate.

### D. Row-level security

Policies must prove:

- Owner A cannot read/write Owner B's activities, versions, folders, media, defaults, or private results.
- Anonymous/public clients cannot enumerate activity rows.
- Public activity data is resolved through a sanitized server boundary, not a broad select policy.
- Anonymous result submission cannot write arbitrary activity IDs or owner records.
- Soft-deleted/private/draft activities are not publicly playable.

Prefer security-definer functions only when simpler policies cannot safely express the boundary; document and test every such function.

### E. Activity service

- Create an incomplete draft.
- Read an owner activity with versions/settings.
- Compare-and-swap autosave by revision.
- Finalize Done after playable validation is supplied by the template registry.
- List/search/filter/sort owner activities.
- Duplicate without shared mutable content.
- Rename and move folder.
- Soft-delete, list trash, restore, permanently clean later.
- Publish/disable/regenerate public slug.
- Create and read immutable session snapshots.

### F. My Activities UI

- Populated/empty/loading/error states.
- Search by title and indexed normalized content strategy.
- Template/folder filter and required sorts.
- Card overflow actions.
- Folder creation/rename/move.
- Trash and restore.
- Responsive behavior.

Use template metadata/thumbnail adapters from the registry; do not hard-code game components into dashboard cards.

### G. Seed and fixtures

- One owner for local/test environment only.
- One draft and one published generic activity per content family.
- Results and media metadata sufficient for dashboard/result service tests.
- Seed process is idempotent or clearly reset-only.

## Acceptance criteria

- A real owner session survives reload and cannot access another test owner's data.
- A draft can autosave incomplete content revisions without becoming public.
- Finalization creates a durable version and public snapshot only after external playable validation succeeds.
- Duplicate has a new ID/slug and later edits do not affect the source.
- Soft-delete removes public access immediately and restore does not unintentionally reactivate a disabled link.
- Public slug contains at least 128 bits of randomness and can be regenerated.
- Dashboard state persists across refresh.
- All RLS negative tests pass.
- Migrations apply from an empty database and from the previous milestone schema.

## Required tests

- Migration smoke/reset.
- RLS matrix with two owners plus anonymous.
- Autosave revision success, stale conflict, retry, and idempotence.
- Duplicate deep-copy behavior.
- Publish/disable/regenerate slug.
- Soft-delete/restore.
- Dashboard search/filter/sort actions.
- Public resolver returns only the sanctioned snapshot fields.
- Invalid template/content versions are rejected.

## Manual verification

1. Sign in.
2. Create a generic draft.
3. Save two revisions.
4. See it in My Activities.
5. Duplicate and rename it.
6. Publish and open the public resolver in a private context.
7. Delete and confirm the public link fails.
8. Restore and confirm state matches the documented rule.

## Handoff dependencies

- Give Workstream 02 the draft/autosave/media metadata interfaces.
- Give Workstream 03 the public snapshot/session/result interfaces.
- Give activity agents only code-level domain schemas; they do not query tables.

## Stop rule

Stop before adding a template-specific conditional to the activity service or dashboard. If a game needs a new shared field, raise an ADR request. Do not weaken RLS to unblock a UI.

## Copy-ready assignment prompt

> Recommended model: a senior full-stack TypeScript/Postgres agent. Read the master plan, shared contracts, and this packet. Build the project foundation, auth, migrations, RLS, durable activity/version services, public slug boundary, dashboard, folders, and trash. Prove the authorization matrix with automated tests and manually complete the generic create/save/list/duplicate/publish/delete/restore journey. Do not implement games or weaken RLS. Hand off exact interfaces to the editor and player workstreams. Stop if a template-specific demand would require changing a frozen shared contract without an ADR.

