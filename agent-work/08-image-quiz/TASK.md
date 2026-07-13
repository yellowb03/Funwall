# Workstream 08: Image Quiz

Recommended model: a senior React animation/media engineer with deterministic timing, responsive image geometry, and quiz-domain experience.

## Mission

Implement Image Quiz as its own reveal-and-buzz game using approved quiz-family editor/review primitives: required reveal image, tile schedule, buzzer, answer phase, scoring, layouts, settings, results, and tests.

## Starts when

- Media selection/crop/fit is stable.
- Integration lead has merged the approved quiz-family primitives from Gameshow.
- Shared player timer/result contracts are stable.

## Owned scope

- `src/features/templates/image-quiz/**`
- Image Quiz fixtures/tests
- Original Image Quiz illustration/stage assets

Do not import Gameshow player state, lifelines, bonuses, or scoring.

## Deliverables

### A. Editor adapter

- 1-100 questions.
- Optional/recommended prompt rich content.
- Required reveal image with crop/focal/alt metadata.
- 2-6 rich answers, exactly one correct.
- Shared nested answer operations from approved quiz primitives.
- Clear missing-image and broken-asset validation.

### B. Settings

- Total reveal duration; default 30 seconds, bounded range.
- Base points per question.
- Lives/unlimited.
- Shuffle questions.
- Auto-proceed.
- Show answers.
- Image/answers separate or together.
- Logical tile grid policy if exposed; keep advanced by default.
- Settings version/defaults/migration and registry export.

### C. Reveal algorithm

- Logical tile grid default 12 x 8 landscape, adapted by image aspect ratio with a bounded tile count.
- Seeded reveal permutation with distribution heuristic so early reveals are spatially useful but not clustered.
- Schedule based on total duration and monotonic clock.
- Batch/rate-limit very fast tile updates.
- Resize changes visual geometry without changing logical revealed set/order.
- Pause stops reveal through player-shell timer semantics.
- Broken image before ready prevents session start and offers owner repair/public retry.

### D. Player state machine

`intro -> loadingImage -> revealing -> buzzed -> answering -> locked/feedback -> next -> completed/gameOver -> review`

- Start only after image decode/readiness.
- Large Buzzer, click/touch/Space.
- Valid buzz pauses reveal within one animation frame and opens answer phase.
- No buzz: full reveal then answer automatically.
- Selection resolves once; life/score updates.
- Separate/together layouts remain the same domain state.
- Auto-proceed respects feedback readability and reduced motion.

### E. Scoring

Pure versioned formula:

- Correct base points.
- Bounded bonus for hidden-tile fraction at buzz.
- Small bounded answer-speed bonus.
- Incorrect/unanswered zero and possible life loss.
- Early buzz alone never earns points.

Store reveal index/count at buzz in the event/result detail for replay.

### F. Review

- Prompt, full reveal image, chosen/correct answer, buzz time, tiles revealed, points.
- Total score, accuracy, duration.
- Valid completion uses shared leaderboard.

## Acceptance criteria

- Same image/aspect/settings/seed yields identical logical reveal order.
- Buzzer pauses without an extra scheduled batch leaking after state change.
- Resize/orientation does not reveal or hide logical tiles incorrectly.
- Together/separate layout does not change scoring/state.
- Broken/slow image cannot start an unfair timer.
- Score replays exactly from events.
- Space key does not scroll page while acting as Buzzer.

## Required tests

- Required image and nested answer validation.
- Reveal permutation distribution and seed vectors.
- Fake-clock reveal schedule.
- Buzz at first tile, middle, final boundary, and after completion.
- Resize geometry mapping.
- Image load/error/retry.
- Score table/replay.
- Lives/game over/auto-proceed/layouts.
- Visual snapshots for landscape/portrait/square and 2/4/6 answers.
- Full create/search-image/save/reload/public-play/result/leaderboard E2E.

## Stop rule

Stop before copying Gameshow state/scoring, encoding reveal progress in DOM geometry alone, or allowing play before image readiness. If shared quiz/media primitives are missing, raise a narrow request.

## Copy-ready assignment prompt

> Recommended model: a senior React animation/media engineer. Read the master Image Quiz spec, shared contracts, and this packet. After quiz/media primitives are merged, implement only the image-quiz folder: required reveal-image editor, seeded responsive tile reveal, buzzer lifecycle, separate/together answers, pure scoring, review, and tests. Prove fake-clock pause, resize stability, image readiness, replay equality, and the image-search-to-leaderboard E2E. Do not import Gameshow mechanics or start timers before decode.

