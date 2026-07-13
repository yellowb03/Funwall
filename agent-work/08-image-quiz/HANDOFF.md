# Funwall workstream handoff

## Workstream

- Packet: 08-image-quiz
- Branch/worktree: workstream/08-image-quiz
- Source commit: based on master (c1952e8)
- Status: complete

## Outcome

Image Quiz is a full reveal-and-buzz game: owners can author questions with a required reveal image and 2–6 answers; public players watch a seeded tile reveal, buzz (button or Space), answer, earn score from base + hidden-tile + answer-speed bonuses, and finish to a scored review suitable for leaderboard. Central registry is **not** edited here—integration only needs one registration line.

## Scope completed

- Settings v1: revealDurationSeconds (default 30), basePoints, lives, shuffleQuestions, autoProceed, showAnswers, layout together|separate, optional tileGrid; migrate from product-fixture `reviewAnswers`
- Draft + playable validation (domain imageQuiz.v1 + editor messages for missing reveal/alt/answers/correct)
- Editor adapter: questions, prompt, required reveal image field, 2–6 answers, mark correct, reorder/duplicate/delete
- Pure reveal algorithm: adaptive logical grid (~12×8 landscape), seeded `board` permutation with region interleave, monotonic schedule, batch helper
- Pure scoring v1: base + reveal bonus + speed bonus; wrong/unanswered 0
- Session state machine: intro → loadingImage → revealing → buzzed → answering → feedback → completed|gameOver|review
- Player: buzzer + Space (preventDefault), image readiness gate, reduced-motion progress bar, together/separate layout, semantic audio (`imageQuiz.reveal`, `imageQuiz.buzzer`, `answer.correct`/`incorrect`)
- Result review adapter (scored detail: tiles at buzz, breakdown, accuracy)
- `createImageQuizRegistration()` with `isScored=true`, `hasLeaderboard=true`
- Fixtures (small/medium/stress) + unit/component tests

## Files changed

| File/folder | Why |
|---|---|
| `src/features/templates/image-quiz/**` | Full template package (settings, reveal, scoring, session, editor, player, review, registration, tests, fixtures) |
| `agent-work/08-image-quiz/HANDOFF.md` | This handoff |

## Contract or schema changes

- None to shared domain. Uses existing `imageQuiz.v1` (`revealImageAssetId`, `revealImageAlt`, nested quiz answers).
- Template-owned settings keys: `showAnswers` (migrates `reviewAnswers` from product fixtures).

## Requested integration changes

- **Registry only** — in `src/features/templates/registry.ts` `createProductRegistry()`:

```ts
import { createImageQuizRegistration } from "@/features/templates/image-quiz/registration";
// ...
registry.register(createImageQuizRegistration());
```

- Do **not** import gameshow-quiz internals.
- Optional later: wire real media URL resolver into player adapter context when shell exposes it (harness uses simulateImageLoad + alt placeholder).
- Dependencies: None
- Migrations/routes: None

## Verification

| Check | Command or method | Result |
|---|---|---|
| Unit/component | `npx vitest run src/features/templates/image-quiz` | 8 files / 56 tests green |
| Full suite | `npx vitest run` | 33 files / 192 tests green |
| Production build | `npm run build` | green |
| Manual/browser | Not run in this isolated worktree (registry not wired; no public play route for image-quiz yet) | n/a — integration after registry line |
| Accessibility | Space as buzzer with preventDefault; live region; 44px+ buzzer | covered in player code + tests |
| Visual/audio | Semantic events only; reduced-motion progress bar | unit-tested paths |

## Manual evidence

- Environment and URL: worktree unit tests only
- Activity fixture and seed: `fw-image-quiz-small-001` / `imageQuizFixtureSmall`
- Observed result: reveal order deterministic; buzzer locks once; scoring formula stable

## Known limitations and risks

- Media URL resolution is shell/media-owned; player shows alt/placeholder when no resolver (same pattern as Wheel).
- Product fixture JSON uses nested `revealImage` narrative shape; domain schema uses flat `revealImageAssetId`/`revealImageAlt` (code fixtures match domain).
- Full create/search-image/save/reload/public-play E2E requires registry wiring + integration (WS13).
- `tileGrid` is settings-advanced; not exposed in owner settings UI chrome (defaults adaptive).

## Recommended next action

- Next step: Integration lead register `createImageQuizRegistration()` and smoke public play with `imageQuizFixtureSmall`.
- Verify by: load editor for image-quiz template, play fixture seed `fw-image-quiz-small-001`, confirm score on result + leaderboard form.
- Stop before: importing Gameshow player/scoring or encoding reveal progress only in DOM geometry.
