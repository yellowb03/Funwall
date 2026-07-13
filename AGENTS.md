# Funwall agent instructions

## Current repository state

This repository is plan-only until an implementation task is explicitly assigned. Do not treat the absence of application code as permission to invent a different product.

## Required reading before implementation

1. `FUNWALL_MASTER_PLAN.md`
2. `agent-work/shared/CONTRACTS.md`
3. `agent-work/README.md`
4. The assigned `agent-work/<workstream>/TASK.md`

## Work routing

- Repo-wide architecture, packages, registry, routes, migrations, and merge work: Workstream 13.
- Auth/database/dashboard: Workstream 01.
- Template picker/editor/media: Workstream 02.
- Public player/session/results shell: Workstream 03.
- A single game: Workstreams 04-09.
- Audio/motion: Workstream 10.
- QA/security/accessibility/performance: Workstream 11.
- CI/deployment/release: Workstream 12.

If no packet was assigned, begin with Workstream 13 and do not launch broad parallel implementation before the saved-Wheel vertical slice passes.

## Shared-file rule

Only the integration lead merges edits to package/lock files, root configuration, shared schemas, central template registry, global tokens, root route assembly, migration ordering, and third-party notices. Other agents request those changes in their handoff.

## Product boundaries

- Exactly six launch templates: Wheel, Matching Pairs, Gameshow Quiz, Wordsearch, Image Quiz, True/False.
- Greenfield clean-room build. Do not copy Wordwall or unlicensed clone code/assets/audio.
- Public players need no account.
- Content is separate from template rendering.
- Game-affecting randomness is seeded.
- Wheel is unscored and never has a leaderboard.
- Use the shared editor and player contracts; no private per-game platform infrastructure.

## Completion and handoff

Run verification proportionate to the packet, including its real browser journey. Use `agent-work/shared/HANDOFF_TEMPLATE.md`. A green build alone is not completion.

