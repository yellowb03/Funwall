# Workstream 03: shared player shell, sessions, results, and public play

Recommended model: a senior interactive-web engineer with deterministic state machines, browser APIs, and test-replay experience.

## Mission

Build the common runtime that makes six games feel like one product: public/owner player chrome, lifecycle, asset readiness, seeded randomness, timer, HUD, pause/fullscreen/mute/restart, session event collection, completion/game-over, result persistence, review, and leaderboard plumbing.

## Starts when

- Foundation supplies public snapshot and session/result interfaces.
- Integration lead freezes player input/lifecycle/event/result contracts.
- Activity agents can work against a mock player harness.

## Owned scope

- `src/features/player/**`
- `src/features/results/**`
- Session/result endpoints or services assigned by integration lead
- Seeded RNG and timer services if not placed in a shared service by integration lead
- Player-shell tests and generic replay fixtures

Do not implement game boards, template scoring formulas, or final audio cue synthesis.

## Deliverables

### A. Public resolver and sanitized snapshot consumption

- Resolve public slug through server boundary.
- Render not-found/disabled/deleted/private states without leaking existence details.
- Freeze activity revision, template version, settings, theme, and media references for the session.
- Validate snapshot before passing to a player adapter.

### B. Shared lifecycle state machine

Implement and test:

`loading -> ready -> playing -> paused -> feedback -> playing -> completed | gameOver -> review`

- Illegal transitions fail clearly in development and become safe fatal states in production.
- Page visibility/fullscreen changes follow documented pause rules.
- Restart closes/abandons the current session and creates a new seed/session.
- Template adapter can expose bounded sub-state but cannot override shell invariants.

### C. Seeded RNG

- Stable seed serialization.
- Named derived streams.
- Known vectors in tests.
- No direct `Math.random` in game-affecting shared paths.
- Replay helper consumes activity revision, settings, seed, and actions.

### D. Timer/clock

- Monotonic elapsed time.
- None/count-up/count-down.
- Pause/resume recorded.
- Idempotent timeout.
- Whole-second display without one interval per component.
- Fake clock test harness for activity agents.

### E. Player chrome and HUD

- Loading and start overlay.
- Progress, score, lives, timer slots/capabilities.
- Sound, fullscreen, restart, exit.
- Owner vs public chrome.
- Template switch panel only on owner activity page, driven by registry compatibility.
- Responsive 16:9 stage with intentional phone layout.
- Error boundary and recoverable asset error.
- Reduced-motion flag passed to templates.

### F. Session event buffering

- Monotonic sequence.
- Bounded batching and retry.
- Offline queue for completion/result submission.
- Idempotency keys server-side.
- Abandon signal when possible; no guarantee on browser close.
- Never log full content or sensitive data.

### G. Result and leaderboard

- Common result summary shell.
- Template review adapter slot.
- Submit display name only after valid scored completion.
- Name length/content validation and owner delete/moderate capability.
- Sort policy: score descending, then duration ascending, then earliest completion.
- Wheel capability hides score/leaderboard entirely.
- Owner results list/detail consumes validated result records.

### H. Adapter harness

Create a fake template that can trigger correct, incorrect, timeout, pause, complete, game over, fatal error, and unscored completion. Activity agents use it to validate integration before real merges.

## Acceptance criteria

- Public player cannot see owner controls or private record fields.
- Start creates one session and one seed after a valid user gesture.
- Timer and timeout are correct across pause and background-tab behavior.
- Double complete, double timeout, and double restart are idempotent.
- Result queues offline and submits once after reconnect.
- Leaderboard rejects unscored, abandoned, invalid, or tampered sessions.
- Wheel runs through the same lifecycle without fake score fields.
- All six adapters can be lazy-loaded; public bundle does not contain every game.
- Fullscreen/mute/restart work on desktop and degrade safely on mobile browsers.

## Required tests

- State-machine transition table.
- Fake clock count-up/count-down/pause/timeout.
- RNG vectors and named streams.
- Event sequence/batch/retry/idempotence.
- Completion and restart races.
- Public snapshot validation and disabled link.
- Leaderboard validation/sort/ties.
- Owner/public chrome permissions.
- Accessibility of start overlay/HUD/dialogs.
- E2E with Wheel vertical slice.

## Manual verification

1. Open owner activity and public link in separate contexts.
2. Start with sound blocked until gesture, then mute/unmute.
3. Enter fullscreen, background the tab, return, and confirm documented timer state.
4. Complete once online and once with network disabled at completion.
5. Refresh/reconnect and prove a single result.
6. Restart mid-game and prove the first session is abandoned and the next seed differs.

## Stop rule

Stop before adding `if template === ...` branches for game mechanics to the shell. If a template cannot fit the shared lifecycle, raise a contract proposal; do not give it a parallel private shell.

## Copy-ready assignment prompt

> Recommended model: a senior interactive-web engineer. Read the master plan, shared contracts, and this packet. Build the public/owner player shell, deterministic lifecycle, seeded RNG, monotonic timer, HUD, fullscreen/mute/restart, session buffering, result review shell, and validated leaderboard plumbing. Provide a fake adapter harness and prove race/idempotency/offline behavior. Do not implement template boards or template-specific shell conditionals. Verify with fake clocks, replay tests, and the Wheel public E2E. Stop if a template requires a shared-contract change and raise it to integration.

