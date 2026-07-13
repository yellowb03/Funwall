# ADR-002: Content-family schema location and versioning

## Status

Accepted — 2026-07-14

## Context

Activities separate educational content from template rendering. Each pack needs a family, version, stable IDs, and validation that rejects unknown versions until a migration exists.

## Decision

1. **Location:** `src/domain/content/*.v1.ts` with a barrel at `src/domain/content/index.ts`. Re-exported from `@/domain`.
2. **Families (v1):** `list`, `pairs`, `quiz`, `wordsearch`, `imageQuiz`, `statements`.
3. **Version field:** integer literal `1` on every pack. Unknown versions fail Zod parse.
4. **Draft vs playable:** draft schemas accept incomplete rows for autosave; `*PlayableSchema` / `parsePlayableContentPack` enforce minimum playable rules.
5. **Rich content:** nested under item fields via `richContentSchema` (`src/domain/rich-content.ts`) — never arbitrary HTML.
6. **Migrations:** future `v2` files live beside `v1`; a migration function converts stored JSON before validation. No silent coercion of unknown versions.

## Consequences

- Activity agents must not invent private content schemas.
- Product fixtures under `docs/product/fixtures` that use flat `text` on items are narrative/reference until mapped into the nested `content` shape at import time.
- Template switching uses conversion descriptors; source packs remain immutable.
