# ADR-003: Template registration and lazy loading

## Status

Accepted — 2026-07-14

## Context

Six templates must plug into one editor shell and one player shell without importing each other's internals. Public bundles should not ship every game.

## Decision

1. **Central registry:** `src/features/templates/registry.ts` — only integration lead merges edits.
2. **Registration factory:** each template folder exports `createXxxRegistration()` implementing `TemplateRegistration` (`src/domain/template-registration.ts`).
3. **Keys:** exactly `wheel | matching-pairs | gameshow-quiz | wordsearch | image-quiz | true-false`.
4. **Lazy loaders:** `loadEditorAdapter` / `loadPlayerAdapter` / optional `loadResultReviewAdapter` return dynamic import modules.
5. **Capabilities:** `isScored` and `hasLeaderboard` are validated (`hasLeaderboard` requires `isScored`).
6. **Wheel freeze:** `isScored=false`, `hasLeaderboard=false` in wheel registration stub.
7. **Phase 1 product registry** registers Wheel stub only; other keys appear as activity agents land and the lead merges registration calls.

## Consequences

- Activity agents never edit `registry.ts`; they request a one-line registration add in handoff.
- Registry contract tests guard uniqueness, capability rules, and wheel flags.
