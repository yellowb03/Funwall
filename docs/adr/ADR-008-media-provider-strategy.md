# ADR-008: Media provider strategy

## Status

Accepted — 2026-07-14

## Context

Editors need in-app image search and upload with license/attribution integrity. Provider credentials must never reach the browser.

## Decision

1. **Primary search:** Openverse (server-side). Env: `OPENVERSE_CLIENT_ID`, `OPENVERSE_CLIENT_SECRET`, optional base URL.
2. **Optional secondary:** Pexels via `PEXELS_API_KEY` when enabled.
3. **Upload:** owner-owned objects in Supabase Storage after server processing (orientation, metadata strip, derivatives — Workstream 02).
4. **Content reference:** only `imageAssetId` / `audioAssetId` (UUID) enter content packs — never arbitrary client URLs.
5. **Asset row:** `media_assets` stores provider metadata, license, attribution, dimensions, focal point.
6. **Hotlink policy:** prefer stored derivatives for play; remote URLs only when license and durability allow; always keep attribution.
7. **Adapter fields:** match CONTRACTS.md §15 provider-neutral search result shape.

## Consequences

- Workstream 02 implements providers behind a single media service interface.
- Missing credentials disable search with a clear owner-facing message; upload path still works when storage is configured.
