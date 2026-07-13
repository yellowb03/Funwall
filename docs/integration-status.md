# Funwall integration status board

> **Prefer [`../PROGRESS.md`](../PROGRESS.md)** for live status, ownership claims, and the session log every agent must update. This board is a secondary snapshot and may lag.

Maintained by Workstream 13 (integration lead).  
Contract version: **domain-v1 / registry-v1**.

| ID | Workstream | Owner | Branch | Status | Contract | Last rebased integration commit | Tests last run | Open contract requests | Merge commit | Downstream unlocks | Known risk / owner |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 00 | Product and reference | product agent | master / docs | **docs landed** | n/a (docs) | planning baseline | n/a | Align product fixtures flat `text` → nested `content` for schema import | TBD | informs tokens/fixtures | Fixture shape drift / 13 |
| 01 | Foundation and data | — | — | **unlocked** | domain-v1 | — | — | — | — | 02, 03 | RLS open insert stubs need tightening / 01 |
| 02 | Editor and media | — | — | **unlocked** (against mocks) | domain-v1 | — | — | — | — | 04+ | Media env optional / 02 |
| 03 | Player shell | — | — | **unlocked** (against mocks) | domain-v1 | — | — | — | — | 04+ | Visibility pause policy default / 03 |
| 04 | Spin wheel | — | — | **unlocked** (template package) | domain-v1 + wheel stub | — | — | Replace noop adapters | — | Milestone 1 gate | Physics/renderer choice / 04 |
| 05 | Matching pairs | — | — | blocked until Milestone 1 | — | — | — | registration export | — | — | — |
| 06 | Gameshow quiz | — | — | blocked until Milestone 1 | — | — | — | registration export | — | 08 | — |
| 07 | Wordsearch | — | — | blocked until Milestone 1 | — | — | — | generator + registration | — | — | Unicode/seeding / 07 |
| 08 | Image quiz | — | — | blocked (after 06 media+quiz) | — | — | — | — | — | — | — |
| 09 | True/False | — | — | blocked until Milestone 1 | — | — | — | registration export | — | — | — |
| 10 | Audio and motion | — | — | blocked (player events frozen later) | semantic-audio-v1 interface | — | — | cue packs | — | — | original assets only / 10 |
| 11 | QA / security / a11y | — | — | continuous inspect | — | — | — | — | — | release gate | — |
| 12 | Deployment and release | — | — | foundation preview later | — | — | — | env wiring | — | production | — |
| 13 | Integration lead | active | master | **Phase 1 complete** | authors freeze | scaffold commits | see HANDOFF | fixture alignment w/ 00 | scaffold series | **01, 02, 03, 04** | do not unlock 05–09 early / 13 |

## Merge order (Milestone 1)

`01 foundation → 02 editor → 03 player → 04 wheel → integration E2E`

Do not unlock five activity agents until the deployed saved-wheel vertical slice passes.
