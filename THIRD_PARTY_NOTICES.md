# Third-party notices

Funwall is a clean-room product. This file records approved third-party code and media.

Process: see [`docs/adr/ADR-009-third-party-license-process.md`](docs/adr/ADR-009-third-party-license-process.md).

## Policy summary

- No source or assets from unlicensed Wordwall clones.
- Runtime dependencies require integration-lead approval and a lockfile update.
- Each entry below must include: package/name, version, license, source URL, where used, and replacement plan.

## Approved reuse

### Kenney audio packs (curated subset) @ pack releases on kenney.nl
- License: CC0 1.0 Universal
- Source: https://kenney.nl/assets (Interface Sounds, UI Audio, Digital Audio, Casino Audio, RPG Audio, Music Jingles)
- Used for: Launch semantic SFX cue set (Workstream 10)
- Location in repo: `public/audio/cues/**`, `public/audio/licenses/kenney-cc0.txt`, mapping in `src/services/audio/cue-packs.ts`
- Provenance: `docs/audio/PROVENANCE.md`
- Replacement plan: Swap cue files with original recordings; keep semantic event names stable


### Template for new entries

```
### <name> @ <version>
- License: <SPDX or name>
- Source: <url>
- Used for: <purpose>
- Location in repo: <paths>
- Replacement plan: <how we would remove it>
```

## Candidate libraries (not adopted)

| Candidate | License | Notes |
|---|---|---|
| CrazyTim/spin-wheel | MIT | Possible wheel renderer behind adapter (WS04) |
| joshbduncan/word-search-generator | MIT | Possible generator reference (WS07) |
| H5P MIT components | MIT | Behavioral reference; full H5P runtime not planned |
