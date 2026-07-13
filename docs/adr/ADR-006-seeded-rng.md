# ADR-006: Seeded RNG algorithm and serialization

## Status

Accepted — 2026-07-14

## Context

Game-affecting randomness must be reproducible for tests and result reconstruction. Browser and server must agree.

## Decision

1. **Seed serialization:** opaque non-empty string (prefer UUID hex without dashes). Stored on `play_sessions.seed`.
2. **Algorithm:** Mulberry32 per named stream; stream seed = `fnv1a32(\`${seed}::${streamName}\`) XOR fnv1a32(seed)`.
3. **Named streams:** `contentOrder`, `board`, `bonus`, `visual`.
4. **API:** `createSeededRng(seed)` in `src/services/rng/seeded-rng.ts`.
5. **Forbidden:** `Math.random` for game-affecting selections.
6. **Tests:** known seed/output vectors in `seeded-rng.test.ts`. Changing algorithm requires this ADR update and vector regeneration.

## Consequences

- Decorative-only particles may use non-seeded randomness if they never affect score or outcomes.
- Replay = snapshot + settings + seed + ordered actions.
