# Workstream 07: Wordsearch generator and player

Recommended model: a senior algorithms/TypeScript engineer with Unicode, property testing, and accessible grid interaction expertise.

## Mission

Implement a deterministic, bounded, Unicode-aware word-search generator plus the Wordsearch editor, settings, clue modes, semantic grid player, results, and unusually deep algorithm tests.

## Starts when

- `wordsearch.v1`, rich clue, timer/result, and seeded RNG contracts are frozen.
- Shared editor/player harnesses are stable.

## Owned scope

- `src/features/templates/wordsearch/**`
- Generator/property/golden tests and fixtures
- Original Wordsearch illustration

Any adoption of an MIT generator requires an isolated audit, attribution, and integration-lead approval. Do not paste it silently.

## Deliverables

### A. Editor adapter

- Mode: no clues or with clues.
- 2-40 entries.
- Display word and separately previewed normalized grid value.
- Rich clue in clue mode.
- Duplicate-normalized-word detection.
- Inline errors for empty result, unsupported characters, impossible length, and conflicting normalization.
- Bulk paste: one word per line or tab-separated word/clue.

### B. Language/normalization policy

Document and implement:

- Activity language/alphabet selection or a bounded v1 auto/default policy.
- Unicode normalization form.
- Space/hyphen/apostrophe handling.
- Diacritic retain/fold setting and display preservation.
- Case mapping without locale-unsafe assumptions.
- Rejection/fallback for unsupported grapheme clusters.

Never use naive ASCII regexes as the only policy.

### C. Generator

- Seeded directions from settings.
- Sort/attempt strategy deterministic for a seed.
- Prefer intersections with a defined scoring heuristic.
- Bounded backtracking/attempt count.
- Grid grows from calculated minimum to explicit maximum.
- Return success with grid + exact solution paths, or structured failure with problematic words/reason.
- Filler letters use selected alphabet/distribution.
- Generator is pure and has no DOM dependency.

Time/memory budgets must prevent crafted input from hanging the server or browser.

### D. Settings

- Timer and lives.
- Selection: full drag, tap first, tap any.
- Show target word list.
- Diagonal and reverse.
- Upper/lowercase.
- Show answers at end.
- Diacritic policy if approved.
- Settings version/defaults/migration and registry export.

### E. Player

- Semantic cell grid with pointer drag and touch path.
- Straight-line selection only; snap/cancel invalid bends.
- Keyboard start cell + direction/endpoint interaction with instructions.
- Assisted tap modes use solution map without exposing it accessibly before selection.
- Correct path highlights and marks word/clue.
- Incorrect complete attempt may cost life.
- Overlapping/intersecting found words preserve distinct visual identity.
- Completion/game over/review lists found and missed words plus solution paths.

### F. Result

- Found/total, incorrect attempts, lives, accuracy, duration.
- Per-word found order/time and missed status.
- Seed/grid dimensions/generator version in template detail for replay.

## Acceptance criteria

- For every successful generated fixture, every target exists exactly at its recorded path and player selection recognizes it.
- Generator completes or fails within the documented budget for all valid bounded input.
- Same inputs/settings/seed produce identical grid/path output.
- Duplicate normalized values are rejected before generation.
- Horizontal/vertical/diagonal/reverse policies are honored exactly.
- Mouse, touch, keyboard, and reduced-motion use are complete.
- No canvas-only grid.

## Required tests

- Unit cases for normalization languages/accents/spaces/hyphens/case.
- Golden seeds.
- Property tests across at least 100 seeds and varied word sets.
- Impossible placement and budget failure.
- Direction constraints and intersections.
- Filler alphabet policy.
- Pointer/touch/keyboard path selection.
- Overlap rendering and found state.
- Lives/game over/review.
- Visual snapshots for 8x8, medium, maximum supported grid, clues/no clues.
- Full create/save/reload/play/result E2E.

## Stop rule

Stop before adding unbounded recursive search, silently stripping unsupported scripts, or using a third-party generator without license/behavior audit. A structured failure is preferable to a frozen game.

## Copy-ready assignment prompt

> Recommended model: a senior algorithms/TypeScript engineer. Read the master Wordsearch spec, shared contracts, and this packet. Implement only the wordsearch folder: Unicode-aware normalization policy, pure seeded bounded generator with exact paths, editor/settings, semantic mouse/touch/keyboard grid, clues, result detail, and extensive golden/property tests. Audit any MIT generator before adoption. Prove 100+ seeds and bounded failure. Do not use unbounded recursion, ASCII-only rules, or an opaque canvas.

