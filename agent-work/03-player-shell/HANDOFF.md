# Funwall workstream handoff

## Workstream

- Packet: 03 — shared player shell, sessions, results, public play
- Branch/worktree: `master` (isolated worktree `subagent-019f5dc1-90b3-7e01-a02d-93642f8050ec`)
- Source commit: based on `f8b3a6a` (post Phase 1 + product docs)
- Status: **complete**

## Outcome

Public play links resolve a sanitized snapshot into a shared player shell with lifecycle, seeded RNG, timer, HUD, mute/fullscreen/restart, session event buffering, completion/review, and leaderboard plumbing. Wheel runs unscored with no leaderboard UI. A fake template adapter harness lets other agents validate integration without real boards.

## Scope completed

- `PublicPlayPort` interface + `MemoryPublicPlayPort` (injectable snapshots, sessions, events, results, leaderboard sort/no-op for Wheel)
- Pure lifecycle state machine: `loading → ready → playing → paused → feedback → completed|gameOver → review` with strict illegal-transition errors
- Session event buffer with monotonic sequence, batch flush, offline re-queue
- `PlayerShell` React component: 16:9 stage, loading, start overlay, HUD, controls, reduced-motion, error boundary, adapter mount, review handoff
- Result review + leaderboard name entry (gated by `isScored` / `hasLeaderboard`)
- Public routes: `/play/[publicSlug]`, `/play/[publicSlug]/result/[sessionId]`, generic not-found
- Fake player adapter harness for correct/incorrect/timeout/pause/complete/gameOver/fatal/unscoredComplete
- Unit/component tests for machine, port, buffer, shell, HUD capabilities, result review

## Files changed

| File/folder | Why |
|---|---|
| `src/features/player/lifecycle/**` | Pure lifecycle machine + tests |
| `src/features/player/session/**` | PublicPlayPort, memory impl, event buffer + tests |
| `src/features/player/shell/**` | PlayerShell, HUD, start overlay, error boundary + tests |
| `src/features/player/harness/**` | Fake template adapter |
| `src/features/player/fixtures.ts` | Wheel/scored quiz snapshots for tests/dev |
| `src/features/player/types.ts` | Re-export lifecycle state from machine |
| `src/features/player/index.ts` | Barrel exports for shell consumers |
| `src/features/results/**` | ResultReview, LeaderboardList + tests |
| `src/app/play/[publicSlug]/**` | Public play page, client, not-found, result route |
| `src/test/setup.ts` | RTL cleanup between tests |
| `agent-work/03-player-shell/HANDOFF.md` | This handoff |

## Contract or schema changes

- None to frozen domain Zod schemas.
- New shell-owned types: `PublicPlayPort`, `PlaySession`, lifecycle machine API under `@/features/player`.
- Consumers should import shell APIs from `@/features/player` and results from `@/features/results`.

## Requested integration changes

- **WS01:** Replace `MemoryPublicPlayPort` on public routes with real Supabase-backed port (resolve published slug → snapshot; start/complete session; append events; leaderboard RPC). Keep the interface shape.
- **WS04:** Export real wheel `loadPlayerAdapter` that mounts into the stage; shell already supplies snapshot + RNG + timer + audio + callbacks.
- **WS13 (optional later):** Wire real audio unlock (WS10) when semantic audio lands; no package.json changes required from 03.
- Dev fixture slugs currently served: `pub-wheel-fixture-01`, `demo-wheel`.

## Verification

| Check | Command or method | Result |
|---|---|---|
| Baseline/static | TypeScript via `npm run build` | Pass |
| Unit/component | `npm test` | Pass — 51 tests |
| Build | `npm run build` | Pass — Next.js 16.2.10 |
| Integration/E2E | Playwright public play journey | Not run (no browsers required for packet gate; shell unit/smoke cover lifecycle) |
| Manual/browser | `/play/demo-wheel` with memory fixture | Build includes dynamic route; memory fixture ready for `npm run dev` |
| Accessibility | Start overlay dialog labels, HUD aria-labels, focus rings on controls | Partial — structure in place |
| Visual/audio | Pale-blue canvas, large blue Play; noop audio unlock | Shell chrome only |

## Manual evidence

- Environment: local Windows, Node (repo worktree), npm
- URL: `/play/demo-wheel` or `/play/pub-wheel-fixture-01` after `npm run dev`
- Viewport/device: n/a automated; stage is 16:9 responsive
- Activity fixture and seed: `buildWheelSnapshot()`; session seed stored on `PlaySession.seed` and passed to `createSeededRng`
- Observed result: `npm test` (51) + `npm run build` green

## Known limitations and risks

- Public resolve uses in-memory fixtures until WS01 persistence.
- Deep-linked `/result/[sessionId]` cannot load historical results without server store (neutral message + back link).
- Noop player adapter (registry wheel stub) does not draw a wheel board — WS04 owns the stage.
- Visibility-change auto-pauses while playing (shell policy); ADR-007 allows either approach as long as pause is recorded.
- Fullscreen API degrades silently when the browser rejects it.
- Template adapters that need a DOM root currently receive services only; real boards should attach to `[data-testid=player-adapter-host]` or own a portal — raise contract proposal if a shared stage mount ref is required.

## Recommended next action

- Next step: Integration lead merges 03; WS04 implements wheel player adapter against `PlayerAdapter` + shell context; WS01 swaps memory port for real public resolve/session RPCs.
- Verify by: open `/play/demo-wheel`, Play → fake/noop ready → (with WS04) spin → Spin complete without score/leaderboard; `npm test` stays green.
- Stop before: adding `if (templateKey === …)` game mechanics inside `PlayerShell`.

## Stop rule

Shell is complete for Wave 1 plug-in. Do not invent per-template platform forks. Contract changes go through ADR + integration lead.
