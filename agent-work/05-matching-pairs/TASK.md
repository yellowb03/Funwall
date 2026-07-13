# Workstream 05: Matching Pairs

Recommended model: a senior React interaction engineer skilled in card animation, accessibility, responsive grids, and race-condition testing.

## Mission

Implement the Matching Pairs editor adapter, typed content/settings, deterministic deck, accessible reveal/match state machine, scoring/result detail, and isolated tests inside the template boundary.

## Starts when

- Shared editor/player adapters have passed the Wheel vertical slice.
- Pair content family and common result contracts are frozen.

## Owned scope

- `src/features/templates/matching-pairs/**`
- Matching-pairs fixtures and colocated tests
- Original template illustration assigned to this folder

## Deliverables

### A. Editor adapter

- Mode: identical or related/different pairs.
- 2-30 pairs.
- Rich content on both sides; identical mode stores one source and mirrors at deck construction.
- Clear two-column row layout, images, alt text, stable IDs.
- Bulk paste of tab-separated pairs.
- Pair-aware duplicate/delete/reorder.
- Draft/playable validation and error messages.

### B. Settings

- Timer: none/count up/count down.
- Numbered tile backs.
- Remove matched tiles.
- Automatically proceed after marking.
- Mixed or separated layout.
- Lives/unlimited.
- Settings version/defaults/migration and registry export.

### C. Deterministic board

- Derive two unique card IDs from each pair ID.
- Seeded shuffle.
- In separated layout, enforce side constraints without placing pairs in trivially corresponding positions unless that is an explicit design choice.
- Preserve a stable board through non-game-affecting re-renders.
- Restart creates a new session/seed through the shell.

### D. Player state machine

`intro -> ready -> oneSelected -> checking -> matched | mismatch -> ready -> completed/gameOver`

- First selection reveals one card.
- The same card cannot be second selection.
- Second selection locks board input.
- Match resolves visibly and stays/removes according to settings.
- Mismatch remains visible 650-900 ms before hiding in normal motion.
- Attempts increment once per two-card check.
- Finite lives decrement only on mismatch.
- Completion reports pair count, attempts, accuracy, and time.

### E. Responsive/accessibility

- Grid chooses columns from card count/aspect ratio while keeping usable card size.
- Very large decks have a documented scroll/scale/layout policy; never render unreadable 20 px cards.
- Card is a semantic button with concealed/revealed accessible name policy that does not leak answers.
- Live region announces first selection, match, miss, lives, and completion without reading the whole board.
- Keyboard focus remains predictable if matched cards are removed.
- Reduced motion replaces 3D flip with fast fade/crossfade.

## Acceptance criteria

- No tile matches itself and no third tile opens during resolution.
- Known seed yields a known board.
- Identical and related pair modes both persist and reload exactly.
- Images load with placeholders/alt; decode failure never freezes checking.
- Attempt/accuracy result reconstructs from session events.
- Mixed/separated and remove/stay settings materially alter behavior.
- Touch and keyboard completion both work.

## Required tests

- Content/settings schema edges.
- Board construction and seed vectors.
- Identical vs related cards.
- Same-card and rapid-third-click guards.
- Match/mismatch timers with fake clock.
- Lives/game over/completion.
- Remove/stay and focus behavior.
- Image failure.
- Visual grids for 2, 6, 12, and 30 pairs across target viewports.
- Full create/save/reload/play/result E2E.

## Stop rule

Stop before putting pair logic into the shared shell or changing global timer/audio implementation. Emit semantic audio events and shared result data only. Raise any missing shared capability to integration.

## Copy-ready assignment prompt

> Recommended model: a senior React interaction engineer. Read the master Matching Pairs spec, shared contracts, and this packet. Implement only the matching-pairs template folder: editor, schemas/settings, deterministic board, locked two-card state machine, responsive/a11y behavior, result detail, and exhaustive race tests. Integrate through shared adapters and semantic events. Verify create/save/reload/play/result with mouse, touch emulation, keyboard, reduced motion, and 2/6/12/30-pair visual cases. Do not alter shared shell or other templates.

