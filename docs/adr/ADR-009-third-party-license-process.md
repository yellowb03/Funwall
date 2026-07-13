# ADR-009: Third-party license process

## Status

Accepted — 2026-07-14

## Context

Funwall is a greenfield clean-room build. Unlicensed Wordwall clones must never be dependencies or code sources. MIT components may be considered carefully.

## Decision

Before any third-party code or media is added:

1. Record problem, alternatives considered, license, version, bundle impact, server/client boundary, security signal, replacement plan.
2. Integration lead approves the dependency and merges package change.
3. Append entry to `THIRD_PARTY_NOTICES.md` with license text or link, version, and usage location.
4. Original audio/art only unless explicitly licensed; never copy Wordwall assets.

Candidates noted in the master plan (not adopted in Phase 1):

- CrazyTim/spin-wheel (MIT) — possible wheel renderer behind adapter.
- joshbduncan/word-search-generator (MIT) — possible generator reference.
- H5P MIT components — behavioral reference only unless attribution recorded.

## Consequences

- `THIRD_PARTY_NOTICES.md` starts as a ready template; empty of package attributions until first approved reuse.
- Activity agents that need a library request it via handoff.
