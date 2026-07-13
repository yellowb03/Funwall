# ADR-005: Public snapshot / session / result boundary

## Status

Accepted — 2026-07-14

## Context

Public players need no account. They must receive only sanitized activity data and emit reconstructable events/results.

## Decision

1. **Snapshot:** `PublicActivitySnapshot` (`src/domain/snapshot.ts`) — activity id, public slug, revision, title, template key/version, validated content, settings, theme, capability flags. No owner id, email, or internal storage paths beyond media IDs.
2. **Resolve path:** `GET/RPC` by `publicSlug` only for `lifecycle_state=published` and `deleted_at is null`.
3. **Session:** server creates `play_sessions` with seed, template key/version, activity revision, settings snapshot.
4. **Events:** `SessionEventEnvelope` with monotonic sequence; bounded metadata; no raw content packs or secrets.
5. **Result:** `ResultContract`; score null for Wheel; leaderboard only for completed valid scored sessions.
6. **Player adapter:** never queries DB directly; shell supplies snapshot + services.

## Consequences

- Invalid snapshots fail before template player import (shell validation gate).
- Wheel must not write leaderboard rows (app + RPC enforcement).
