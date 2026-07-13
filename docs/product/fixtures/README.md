# Canonical content fixtures

Stable classroom-safe content packs for tests, demos, and visual review.  
IDs are **frozen proposals** for integration-lead sign-off (Workstream 00 → 13).

## Naming

```
{templateKey}-{size}
```

Sizes:

| Size | Intent |
|---|---|
| `small` | Minimum or near-minimum playable happy path |
| `medium` | Representative classroom activity |
| `stress` | Edge cases: volume, layout, validation, failure modes |

## Template keys

`wheel` · `matching-pairs` · `gameshow-quiz` · `wordsearch` · `image-quiz` · `true-false`

## Files

| File | Fixtures |
|---|---|
| [`wheel.json`](wheel.json) | small (6 text), medium (12 mixed), stress (100 labels) |
| [`matching-pairs.json`](matching-pairs.json) | small (6 related), medium (identical images), stress (30 pairs) |
| [`gameshow-quiz.json`](gameshow-quiz.json) | small, medium (2/4/6 answers + images + lifelines), stress (game over pressure) |
| [`wordsearch.json`](wordsearch.json) | small (no clues), medium (clues + diagonal/reverse), stress (accents, long word, non-Latin policy) |
| [`image-quiz.json`](image-quiz.json) | small, medium (aspect ratios + buzz paths), stress (broken image) |
| [`true-false.json`](true-false.json) | small (balanced), medium (long statements), stress (imbalance + repeat-until-time) |

## Conventions

- Content family + version match `CONTRACTS.md`.
- Every item/answer/pair/statement has a stable UUID (fixed strings below—do not regenerate casually).
- `imageAssetId` values are **logical fixture media IDs**, not production URLs. Implementers map them in test harnesses.
- Harmless classroom topics: planets, animals, shapes, water cycle, nutrition, geography.
- Wheel fixtures set `isScored: false` and `hasLeaderboard: false`.

## Settings blocks

Each fixture may include `suggestedSettings` for player tests. Applied settings at runtime remain template-owned defaults unless tests override them.

## Seed hints

`suggestedSeed` values are fixed strings for deterministic replay demos. Session seeds at runtime are still generated per play unless tests inject these.
