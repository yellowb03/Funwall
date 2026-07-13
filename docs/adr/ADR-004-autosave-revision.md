# ADR-004: Autosave / revision conflict protocol

## Status

Accepted — 2026-07-14

## Context

Owners need debounced draft autosave with explicit Saving/Saved/Save failed states. Concurrent tabs must not silently clobber newer server revisions.

## Decision

1. Client draft carries `baseRevision` (integer, starts at 0).
2. Server save is **compare-and-swap**: accept only if `request.baseRevision === activities.revision`.
3. On success: persist content/settings, increment revision, write `activity_versions` row with reason `autosave` or `done`, return `{ revision, updatedAt }`.
4. On conflict (`409`): return server revision + snapshot; client must not overwrite; show recovery UI.
5. Local recovery (localStorage/idb) retains dirty draft until the latest dirty revision is acknowledged.
6. **Done:** flush draft → playable validation → reason `done` → mark published/finalized → navigate only after ack.

Schema support: `activities.revision`, `activity_versions` table in initial migration.

## Consequences

- Workstream 01/02 implement the API against this protocol; clients share one hook.
- Templates never implement their own save paths.
