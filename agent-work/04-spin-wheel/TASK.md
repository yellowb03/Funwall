# Workstream 04: Spin the Wheel vertical slice

Recommended model: a senior React/SVG animation engineer with deterministic game-state and browser testing experience.

## Mission

Implement the first complete template and prove the full architecture: Wheel content editor adapter, validation/settings, accessible wheel player, deterministic selection/animation, session elimination state, result behavior, registry export, and tests. This is Milestone 1's vertical slice.

## Starts when

- Shared contracts are frozen.
- Editor and player harnesses exist, even if backed by mocks.
- Foundation provides a draft/public snapshot path.

## Owned scope

- `src/features/templates/wheel/**`
- Wheel fixtures and colocated tests
- Original wheel-specific illustration in the approved template asset boundary

Do not edit central registry, root dependencies, global audio service, dashboard, or shared schemas directly.

## Product requirements

Follow section 8.1 of the master plan. Preserve these invariants:

- 2-100 items.
- Optional instruction.
- Text/image-rich items with stable IDs.
- Wheel has no score, accuracy, result ranking, or leaderboard.
- Winner is seeded and selected before animation.
- Pointer/visual landing must always agree with the winner.
- Elimination is session-only.

## Deliverables

### A. Content and settings adapters

- Draft/playable validation.
- Bulk paste, stable reorder, duplicate, delete through shared editor helpers.
- Settings schema/version/defaults: timer, spin power, shuffle, eliminate permission, image display policy.
- Migration test from any provisional settings shape used during vertical-slice development.
- Registry export with `isScored=false`, `hasLeaderboard=false`.

### B. Renderer/physics decision spike

Time-box an isolated comparison:

1. Custom semantic SVG wheel.
2. MIT `CrazyTim/spin-wheel` wrapped behind a template adapter.

Evaluate bundle size, deterministic target control, touch gesture, label/image rendering, accessibility, resize behavior, tick callbacks, cleanup, and reduced motion. Record the decision and third-party obligations. Prefer custom SVG if the library prevents exact lifecycle control.

### C. Player state machine

`intro -> idle -> dragging/spinning -> decelerating -> selected -> idle | complete`

- Button spin is required; gesture/flick is enhancement.
- Lock repeated inputs during spin/selection transition.
- 4-7 second spin based on power.
- Wheel tick events derive from actual boundary crossings and are rate-limited.
- Selected view shows full rich item and Resume/Spin again/Eliminate.
- Eliminate rebuilds geometry without mutating the saved pack.
- One item remaining yields a clear complete/reset state.
- Restart restores the session's original item set through shared shell semantics.

### D. Responsive and accessible behavior

- Stable SVG viewBox/resizing.
- Label truncation/curving policy documented for item counts.
- Images are optional within segments; result panel always shows full content.
- Accessible spin button and live announcement of selected item.
- Reduced motion uses a short randomized highlight/selection sequence rather than multi-turn rotation.
- Keyboard can spin and activate post-selection actions.

### E. Integration proof

The full real path must work:

`template picker -> editor -> autosave -> Done -> owner activity -> public link -> start -> spin -> eliminate -> spin -> exit/reload`

The public attempt may record a completed/abandoned unscored session but never a leaderboard entry.

## Acceptance criteria

- Known seed and item set produce the expected winner.
- Final transform angle places the expected segment under the pointer within a documented tolerance.
- 20 rapid clicks still create one spin.
- Resize/orientation change during idle is safe; during spin it either preserves state or follows a documented locked-layout rule.
- Removing selected items cannot leave an invalid angle/index.
- Muting stops tick cues immediately.
- Wheel page contains no score/leaderboard placeholder.
- Vertical-slice E2E passes after browser refresh and in a clean public context.

## Required tests

- Settings/content validation boundaries.
- Seed -> winner vectors.
- Winner -> target-angle calculations for odd/even and 2/3/6/30/100 segments.
- State transition and input lock.
- Elimination/session reset.
- Tick event rate/boundary logic with fake time.
- Reduced-motion selection.
- Component keyboard/a11y.
- Visual snapshots at 1280 x 720, 1024 x 768, and 390 x 844.
- Full create/save/reload/public-play E2E.

## Stop rule

Stop before inventing scoring, storing eliminated items in the activity, or committing a third-party wheel dependency without integration-lead license/bundle approval. If editor/player contracts block the vertical slice, return the smallest concrete contract change instead of building private infrastructure.

## Copy-ready assignment prompt

> Recommended model: a senior React/SVG animation engineer. Read the master plan's Wheel section, shared contracts, and this packet. Implement only `templates/wheel`: editor/settings adapters, deterministic accessible player, session-only eliminate flow, and tests. Time-box custom SVG versus the MIT wheel library and record the decision. Prove the full create/save/reload/public-play vertical slice, including no leaderboard. Do not edit shared registry/config or invent scoring. Stop and raise a minimal contract request if shared infrastructure is insufficient.

