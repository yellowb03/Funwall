# Funwall workstream handoff

## Workstream

- Packet: 09-true-false
- Branch/worktree: isolated worktree on `master` (subagent-019f5dce-4da1-7d03-b574-2fe87f7ad7d1)
- Source commit: c1952e8843abdd889285cc6a50abae485359ea19
- Status: complete (template package ready; not wired into central registry)

## Outcome

Authors can draft True/False activities with statement lists, truth toggles, bulk paste, and imbalance warnings. Players get a timed True/False stage with deterministic answer/expiry resolution, lives, optional repeat-after-first-pass, reduced-motion progress bar, scoring, and per-statement review. Registration factory is exportable for the integration lead.

## Scope completed

- Settings v1: timer none|countUp|countDown, speed 1–10 (default 5), lives unlimited|1–5, repeatUntilTime, showAnswers, shuffle (seeded)
- Documented speed → answer-window ms formula (`answerWindowMs` / `answerWindowTable`)
- Settings migrate from product-fixture aliases (`timer`, `reviewAnswers`)
- Draft + playable validation against `statements.v1` (`isTrue` boolean field)
- Imbalance warning (non-blocking)
- Editor: list, True/False toggle, rich content fallback, reorder/duplicate/delete, bulk paste with `[T]`/`[F]` markers
- Player state machine: intro → itemEntering → answerWindow → answered|expired → feedback → itemLeaving → next|repeat → completed|gameOver → review
- First input or expiry wins once (double-click safe); deadline policy documented in `session.ts`
- Fake-clock testable timing via `clock` prop; shell `timer` for session countdown
- Lives on wrong/expired; game over after feedback
- Repeat only after first full pass (requires countDown + repeatUntilTime)
- Reduced motion: stationary card + answer-window progress bar
- Semantic audio: `trueFalse.enter`, `trueFalse.resolve`, `answer.correct`/`incorrect`
- Imperative `createRoot` player adapter (Wheel pattern)
- Results: correct/incorrect/unanswered, accuracy, score, duration, streak; attempt review
- `createTrueFalseRegistration()` with `isScored=true`, `hasLeaderboard=true`
- Unit/component tests for validation, timing races, double resolve, lives, repeat, registration

## Files changed

| File/folder | Why |
|---|---|
| `src/features/templates/true-false/**` | Full template package (settings, validation, session, editor, player, review, registration, tests, fixtures) |
| `agent-work/09-true-false/HANDOFF.md` | This handoff |

## Contract or schema changes

- None to shared domain. Consumes frozen `statements.v1` with `isTrue: boolean | null`.
- Product fixtures under `docs/product/fixtures/true-false.json` still use narrative `truth` key — migrate path should map `truth` → `isTrue` when integration loads those fixtures (template `migrateTrueFalseSettings` already maps settings aliases; content mapping is integration/fixture-loader concern).
- Domain max statements = **100** (`statements.v1`); product copy/master plan say 200. Template validation follows domain max 100. Request domain bump if product keeps 200.

## Requested integration changes

- Register `createTrueFalseRegistration()` from `@/features/templates/true-false` in `src/features/templates/registry.ts` (`createProductRegistry`).
- Optional: map product fixture `truth` → `isTrue` when seeding True/False activities.
- Optional: raise `statements.v1` max from 100 → 200 if product limit is intentional.
- Editor workspace limits already mention 2–200; align helper copy after domain decision.
- None of package.json / lockfile / routes / migrations from this workstream.

## Verification

| Check | Command or method | Result |
|---|---|---|
| Unit/component | `npx vitest run src/features/templates/true-false` | 36/36 pass |
| Full suite | `npx vitest run` | 172/172 pass |
| Production build | `npm run build` | green |
| Integration/E2E | Full create/save/public-play E2E | Not run — registry not wired yet |
| Manual/browser | — | Deferred to integration lead after registry wire |
| Accessibility | Keyboard T/F, live region, large touch targets | Implemented; a11y audit WS11 |
| Visual/audio | Semantic events only; no CSS animation as timeout truth | Covered by unit tests |

## Manual evidence

- Environment and URL: n/a (package-only; not in product registry)
- Viewport/device: n/a
- Activity fixture and seed: `trueFalseFixtures.small` / `fw-true-false-small-001`
- Screenshot/trace/artifact path: n/a
- Observed result: unit tests prove double-resolve, expiry with fake clock, repeat gate, game-over after feedback

## Known limitations and risks

- Not registered in central registry until Workstream 13 merges.
- Domain max 100 vs product narrative 200.
- Product JSON fixtures use `truth` not `isTrue`.
- Full browser journey / leaderboard E2E waits on registry + public play wiring.
- Player uses `setInterval` poll of injected clock for expiry (not CSS `animationend`); shell should still own session countdown via `context.timer`.
- Enter/feedback/leave phase delays use `setTimeout` for UX; game truth is monotonic clock + `tryResolve`.

## Recommended next action

- Next step: Integration lead registers `createTrueFalseRegistration()` and seeds a True/False fixture activity for public play.
- Verify by: create/save/reload/public-play/result smoke with `trueFalseFixtures.small` and reduced-motion on.
- Stop before: editing other templates, package.json, or inventing a private timer service.
