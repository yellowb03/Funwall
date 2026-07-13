# Funwall agent instructions

## Current repository state

Implementation is **in progress** on `master`. Do not invent a different product. Read [`PROGRESS.md`](./PROGRESS.md) for what already exists, who owns open workstreams, and the latest session log.

## Required reading before implementation

1. [`PROGRESS.md`](./PROGRESS.md) — **living progress log** (status, ownership, last actions)
2. `FUNWALL_MASTER_PLAN.md`
3. `agent-work/shared/CONTRACTS.md`
4. `agent-work/README.md`
5. The assigned `agent-work/<workstream>/TASK.md`

## Mandatory: update PROGRESS.md

**Every agent that changes the repo must update `PROGRESS.md` before ending its session** (or when pausing mid-task).

1. Refresh the header fields: **Last updated**, **Last updater**, **Integration tip**, **Last verification** (if tests were run).
2. Update **Workstream status**, **Registered templates**, and **Open coordination** if they changed.
3. **Append** a new entry under **Latest session entries** (newest first) using the template in that file.
4. State an **Ownership claim**: which branch/workstream you still hold, or `none` if released.

Do not delete prior session entries. If the log grows huge, archive old entries under `docs/progress-archive/` and leave a pointer.

A handoff without a `PROGRESS.md` update is incomplete.

## Work routing

- Repo-wide architecture, packages, registry, routes, migrations, and merge work: Workstream 13.
- Auth/database/dashboard: Workstream 01.
- Template picker/editor/media: Workstream 02.
- Public player/session/results shell: Workstream 03.
- A single game: Workstreams 04-09.
- Audio/motion: Workstream 10.
- QA/security/accessibility/performance: Workstream 11.
- CI/deployment/release: Workstream 12.

Check `PROGRESS.md` for which workstreams are already complete or claimed by another agent. Do not launch broad parallel game work that collides with an active claim.

## Shared-file rule

Only the integration lead merges edits to package/lock files, root configuration, shared schemas, central template registry, global tokens, root route assembly, migration ordering, and third-party notices. Other agents request those changes in their handoff **and** note them in `PROGRESS.md`.

## Product boundaries

- Exactly six launch templates: Wheel, Matching Pairs, Gameshow Quiz, Wordsearch, Image Quiz, True/False.
- Greenfield clean-room build. Do not copy Wordwall or unlicensed clone code/assets/audio.
- Public players need no account.
- Content is separate from template rendering.
- Game-affecting randomness is seeded.
- Wheel is unscored and never has a leaderboard.
- Use the shared editor and player contracts; no private per-game platform infrastructure.

## Completion and handoff

1. Run verification proportionate to the packet, including its real browser journey when UI is involved.
2. Use `agent-work/shared/HANDOFF_TEMPLATE.md` for packet handoffs.
3. **Update `PROGRESS.md`** (mandatory).
4. A green build alone is not completion.
