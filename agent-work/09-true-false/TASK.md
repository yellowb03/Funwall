# Workstream 09: True or False

Recommended model: a senior React motion/state-machine engineer with timing-boundary and accessibility experience.

## Mission

Implement the True/False statement editor and a fast, readable moving-card player with deterministic order, strict answer/expiry resolution, speed/lives/repeat settings, reduced-motion alternative, result review, and tests.

## Starts when

- `statements.v1`, timer, result, semantic audio, and player lifecycle contracts are frozen.
- Shared editor/player vertical slice is stable.

## Owned scope

- `src/features/templates/true-false/**`
- True/False fixtures/tests
- Original True/False illustration/stage assets

## Deliverables

### A. Editor adapter

- 2-200 statements.
- Rich content plus explicit boolean truth value.
- Stable ordered list, even if UI offers grouped True/False views.
- Add/reorder/duplicate/delete.
- Optional bulk paste with an unambiguous truth marker format.
- Imbalance warning without blocking.
- Draft/playable validation.

### B. Settings

- Timer: none/count up/count down.
- Speed 1-10, default 5.
- Lives/unlimited.
- Repeat questions until time runs out.
- Show answers.
- Shuffle policy if approved; order always seeded when randomized.
- Settings version/defaults/migration and registry export.

### C. Timing model

- Derive answer-window duration from speed through a documented bounded function.
- Use shared monotonic clock; CSS animation duration is presentation, not source of truth.
- Record `presentedAt`, `answeredAt` or `expiredAt` once.
- Define boundary rule: an input timestamp at/before deadline wins only if the state machine processes the already-captured event according to the agreed policy.
- Repeat mode reshuffles only after the entire set has appeared once.

### D. Player state machine

`intro -> itemEntering -> answerWindow -> answered/expired -> feedback -> itemLeaving -> next/repeat -> completed/gameOver -> review`

- One statement at a time.
- Fixed large True/False buttons.
- Input locks on first answer or expiry.
- Correct/incorrect stamp combines icon/text/color and semantic event.
- Life decrement on wrong/expired when finite.
- Countdown completion stops new items and resolves active item once.
- Count-up/none finish after all statements unless repeat behavior is explicitly enabled with a countdown.

### E. Motion and reduced motion

- Normal card movement remains readable and speed-calibrated.
- Long text adapts font/layout rather than clipping.
- Reduced motion renders a stationary card with a visible answer-window progress bar.
- Motion state never moves the answer buttons.

### F. Result/review

- Correct, incorrect, unanswered, accuracy, score, duration, best streak.
- Per statement: truth value, player's answer/expiry, time, points.
- Repeated statements are represented as attempts while review can group by source statement.

## Acceptance criteria

- Double-click/two-button input resolves once.
- Answer/expiry boundary is deterministic under fake clock.
- Repeat mode never repeats before first-pass completion.
- Finite life reaches game over after feedback, not mid-transition.
- Reduced-motion mode is fully playable and does not merely slow the flying card.
- Long text/image statements remain readable at phone and classroom sizes.
- Result reconstructs from events.

## Required tests

- Statement validation and imbalance warning.
- Speed-to-window table.
- Answer/expiry race matrix.
- Double input/idempotence.
- Timer modes, lives, game over, repeat order.
- Reduced-motion stationary flow.
- Long text/image visual snapshots.
- Keyboard shortcuts/focus and screen-reader announcements.
- Full create/save/reload/public-play/result/leaderboard E2E.

## Stop rule

Stop before using CSS `animationend` as the authoritative timeout, moving the answer controls, or making audio necessary to know the result. Do not add another timer implementation.

## Copy-ready assignment prompt

> Recommended model: a senior React motion/state-machine engineer. Read the master True/False spec, shared contracts, and this packet. Implement only the true-false folder: statement editor/settings, monotonic speed/timing model, single-resolution moving-card state machine, lives/repeat, stationary reduced-motion mode, review, and timing-race tests. Prove create/save/reload/public-play/leaderboard with long text, image, keyboard, and reduced motion. Do not use CSS animation completion as game truth or create a private timer.

