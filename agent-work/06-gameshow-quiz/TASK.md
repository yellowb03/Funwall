# Workstream 06: Gameshow Quiz and quiz-family contract

Recommended model: a senior interactive-game TypeScript engineer experienced with deterministic scoring, timers, and complex finite-state UI.

## Mission

Define the approved reusable quiz-family primitives with the integration lead, then implement the Gameshow Quiz editor/player: timed questions, lives, four lifelines, deterministic bonus rounds, scoring, result review, sound/motion events, and complete tests.

## Starts when

- Shared editor/player vertical slice is stable.
- Integration lead assigns the code-level `quiz.v1` schema location and approves exactly-one-correct-answer for v1.

## Owned scope

- `src/features/templates/gameshow-quiz/**`
- Quiz primitive proposal/implementation only in the location assigned by integration lead
- Gameshow fixtures and colocated tests
- Original Gameshow-specific stage/illustration assets

Do not implement Image Quiz reveal behavior. Do not directly edit the central registry.

## Deliverables

### A. Quiz editor adapter

- 1-100 questions.
- Prompt rich content.
- 2-6 rich answers.
- Exactly one correct answer.
- Add/reorder/duplicate/delete questions.
- Add/remove answers within bounds.
- Correct-answer control cannot leave a finalized question with none/multiple.
- Keyboard focus after nested operations.
- Draft/playable validation.

### B. Settings

- Per-question timer: none/countdown.
- Lives: unlimited or 1-5.
- Questions before bonus.
- Lifeline toggles: 50:50, x2, extra time, reveal.
- Shuffle questions/answers.
- Show answers at end.
- Settings version/defaults/migration and registry export.

### C. Player state machine

`intro -> questionEnter -> answering -> locked -> feedback -> bonusMaybe -> next -> completed/gameOver -> review`

- Present one question.
- Timer begins only when answer controls are ready.
- Selection/timeout locks once and emits one resolution.
- Correct/incorrect and life changes are immediate.
- Transition duration does not consume next-question time.
- Game over occurs after the resolving feedback for the life-ending answer.
- Final question never triggers a bonus after completion.

### D. Scoring

Define pure, versioned formula with tests:

- Base points for correct.
- Bounded remaining-time bonus.
- x2 modifier.
- Reveal lifeline severely caps/zeros time bonus.
- Incorrect/unanswered = zero.
- Never negative.

Store scoring version in session/result detail. Server/replay calculation must match client.

### E. Lifelines

- 50:50 removes two seeded incorrect choices and cannot remove the correct one.
- x2 arms for current question and consumes on resolve.
- Extra Time adds one fixed bounded increment and updates timer contract through an approved method.
- Reveal identifies correct answer and marks usage for scoring/review.
- Each enabled lifeline has a documented initial count; default once per session.
- Double click and late click are idempotent/ignored.

### F. Bonus rounds

- Deterministic reward deck from named RNG stream.
- Default after every 3 answered questions.
- Rewards: points, multiplier/boost, extra life where finite, lifeline refill.
- Ineligible rewards are filtered before draw (for example extra life under unlimited lives).
- Bonus state is resumable/testable and cannot overlap a question.
- Original TV-style visual, not copied artwork.

### G. Review and leaderboard

- Prompt, displayed answer order, chosen/correct answer, correctness, time, points, lifelines.
- Total score, accuracy, duration.
- Valid completion eligible for shared leaderboard.

## Acceptance criteria

- Known snapshot/seed/actions reproduce question order, answer order, 50:50 removals, bonuses, and score.
- Timeout/select race resolves once according to a documented timestamp rule.
- Disabled lifelines never appear.
- Lifeline and bonus events replay correctly.
- Bonus never occurs after last question/game over.
- Game survives finite-lives and unlimited-lives paths.
- Image/text answers remain usable at phone and classroom sizes.
- Result recalculates identically from event log.

## Required tests

- Nested editor operations and validation.
- Shuffle seed vectors.
- Scoring table tests.
- Every lifeline happy/invalid/double-use/timeout edge.
- Bonus reward eligibility/determinism/frequency.
- Timeout versus answer race.
- Lives/game over/final question.
- Review detail.
- Visual snapshots for 2/4/6 answers, images, long text, bonus, game over.
- Full create/save/reload/public-play/result/leaderboard E2E.

## Handoff to Image Quiz

Document the stable quiz-family pieces Image Quiz may consume:

- Rich prompt/answer model.
- Answer editor primitives.
- Correct-answer validation.
- Review display primitives.
- What is intentionally Gameshow-only.

## Stop rule

Stop before sharing the Gameshow state machine, HUD layout, scoring formula, lifelines, or bonus code with Image Quiz. Share only approved quiz data/editor/review primitives. Raise shared-schema changes to integration.

## Copy-ready assignment prompt

> Recommended model: a senior interactive-game TypeScript engineer. Read the master Gameshow spec, shared contracts, and this packet. Coordinate the `quiz.v1` primitive location with integration, then implement only Gameshow: nested editor, settings, deterministic question/answer order, pure scoring, lives, 50:50/x2/extra-time/reveal lifelines, deterministic bonus rounds, review, and tests. Prove replay equality and the public leaderboard E2E. Hand Image Quiz a narrow quiz primitive contract. Do not make Image Quiz a Gameshow skin or edit the central registry.

