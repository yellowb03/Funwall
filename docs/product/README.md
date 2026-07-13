# Funwall product reference

Implementation-ready product artifacts for Funwall. These documents freeze experiential parity targets, original visual grammar, copy, fixtures, and acceptance criteria without application code.

## Contents

| Document | Purpose |
|---|---|
| [`screen-inventory.md`](screen-inventory.md) | Screen and state inventory for owner, editor, media, player, and results |
| [`copy-deck.md`](copy-deck.md) | All user-facing strings: templates, empty states, validation, player, results |
| [`parity-checklist.md`](parity-checklist.md) | Required parity vs intentional differences vs prohibited copies |
| [`fixtures/`](fixtures/README.md) | Canonical small / medium / stress content fixtures for all six templates |

## Related references

Visual and interaction tokens live under [`docs/references/`](../references/README.md):

- Design tokens
- Component geometry
- Theme boards
- Typography
- Interaction states

## How implementers should use this pack

1. Build routes and chrome from the [screen inventory](screen-inventory.md).
2. Pull strings only from the [copy deck](copy-deck.md); do not invent alternate labels for shared shell chrome.
3. Apply geometry and tokens from `docs/references/` rather than freehand spacing.
4. Seed tests and demos from [fixtures](fixtures/README.md) using the stable IDs provided.
5. Gate visual/behavioral acceptance with the [parity checklist](parity-checklist.md).

## Product boundaries (reminder)

- Exactly six launch templates: Wheel, Matching pairs, Gameshow quiz, Wordsearch, Image quiz, True or false.
- Greenfield clean-room build: no Wordwall logos, proprietary art, or audio.
- Public players need no account.
- Content is separate from template rendering.
- Game-affecting randomness is seeded.
- Wheel is unscored and never has a leaderboard.

## Ownership

Workstream 00 owns these files. Integration lead signs off on fixture IDs/names and token tables before visual freeze. Domain/persistence contracts remain in `agent-work/shared/CONTRACTS.md`; do not invent backend behavior from this pack alone.
