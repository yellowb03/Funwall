# Third-party notices

Funwall is a clean-room product. This file records approved third-party code and media.

Process: see [`docs/adr/ADR-009-third-party-license-process.md`](docs/adr/ADR-009-third-party-license-process.md).

## Policy summary

- No source or assets from unlicensed Wordwall clones.
- Runtime dependencies require integration-lead approval and a lockfile update.
- Each entry below must include: package/name, version, license, source URL, where used, and replacement plan.

## Approved reuse

_None yet (Phase 1 scaffold uses only standard open-source toolchain packages listed in `package.json`; npm dependency licenses are governed by their respective packages and are not individually duplicated here until non-toolchain product libraries are introduced)._

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
