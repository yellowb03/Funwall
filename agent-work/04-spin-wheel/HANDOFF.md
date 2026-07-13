# Funwall workstream handoff

## Workstream

- Packet: 04 — Spin the Wheel (Milestone 1 vertical slice template)
- Branch/worktree: isolated worktree `subagent-019f5dc1-90b6-7a41-8b19-43cf88c7e6c2` (branch `master`)
- Source commit: base `f8b3a6a` + wheel implementation commits
- Status: **complete** (template package; full product E2E blocked on 01/02/03 shells)

## Outcome

The Spin the wheel template is implementable end-to-end as a package: draft/playable list.v1 validation, settings v1 with migration, accessible list editor adapter, deterministic custom SVG player (winner before animation, session-only eliminate, reduced-motion path), and registry export with `isScored=false` / `hasLeaderboard=false`. Unit and component tests pass; production build passes.

## Scope completed

- Content validation helpers on domain `list.v1` (draft issues + playable min 2 non-empty items; warn >30).
- Settings schema v1: timer mode/seconds, spin power low/medium/high, shuffle, allow eliminate, image display policy; pure defaults; migration from provisional fixture keys (`timer`, `shuffleItems`).
- Editor adapter: instruction, rich items (text + image modal hook), add/reorder/duplicate/delete, bulk paste (one line per item), limits helper copy.
- Player: custom semantic SVG wheel (decision: **no** MIT spin-wheel dependency — see `src/features/templates/wheel/DECISION_SPIKE.md`).
- State machine: `intro → idle → spinning → decelerating → selected → idle | complete`.
- Seeded winner via RNG stream `board` at spin start; target angle math so pointer always matches winner.
- Semantic audio: `wheel.tick` (rate-limited boundary crossings), `wheel.selected`, `ui.press`.
- Result panel: Resume / Spin again / Eliminate; complete when one item left; restart restores session originals.
- Reduced motion: short highlight sequence (~450ms), no multi-turn spin.
- aria-live selection announcement; keyboard-operable Spin and result actions.
- Fixtures: small (6), medium (12 mixed), min (2), odd (3), many (30).
- Registration lazy-loads client adapters so Server Components / central registry stay clean.

## Files changed

| File/folder | Why |
|---|---|
| `src/features/templates/wheel/**` | Full wheel package (settings, validation, geometry, session, editor, player, fixtures, tests, decision spike) |
| `agent-work/04-spin-wheel/HANDOFF.md` | This handoff |

## Contract or schema changes

- **None to shared domain.** Wheel settings remain template-owned under `wheel/settings.ts`.
- Settings fields beyond Phase 1 stub: `allowEliminate`, `imageDisplayPolicy` (`auto` \| `always` \| `resultOnly`).
- Migration normalizes product-fixture aliases (`timer` → `timerMode`, `shuffleItems` → `shuffleItemOrder`).

## Requested integration changes

1. **Editor shell (WS02):** When template key is `wheel`, call:
   ```ts
   const { createEditorAdapter } = await registry.loadEditorAdapter("wheel");
   const adapter = createEditorAdapter();
   // draft: ListContentV1; limits from registration / WHEEL_LIMITS
   adapter.render({ draft, onDraftChange, validation, onDirty, openMediaModal, limits, RichContentField? });
   ```
   Provide `RichContentField` when media UI is ready; wheel has a self-contained text+image-button fallback.

2. **Player shell (WS03):** Mount host with `data-funwall-stage` (or `#funwall-player-stage`), then:
   ```ts
   const { createPlayerAdapter } = await registry.loadPlayerAdapter("wheel");
   const player = createPlayerAdapter();
   await player.mount({
     snapshot, content, settings, themeTokens, rng, timer, audio, sessionEvents, lifecycle, commands,
   });
   // unmount / pause / resume / restart on shell lifecycle
   ```
   Alternatively render `WheelPlayer` from `@/features/templates/wheel/player/WheelPlayer` directly with parsed content/settings.

3. **Settings application:** Run `registration.settings.migrate(version, raw)` (or `migrateWheelSettings`) before play; do not pass narrative fixture JSON unmigrated without migrate.

4. **Results / leaderboard:** Never create leaderboard rows for `wheel`. Result `score` must be `null`. Session may record completed/abandoned unscored events.

5. **Theme tokens (optional):** `wheel.segment.0`… or `wheel.palette` CSV for segment fills; falls back to classroom palette.

6. **Dependencies:** None requested. Custom SVG only.

7. **E2E after 01/02/03 merge:** Wire real path  
   `picker → editor → autosave → Done → activity → public link → spin → eliminate → spin → exit/reload`.

## Verification

| Check | Command or method | Result |
|---|---|---|
| Baseline/static | (lint not required gate) | Not blocking |
| Unit/component | `npm test` | **Pass — 63 tests** |
| Build | `npm run build` | **Pass — Next.js 16.2.10** |
| Integration/E2E | Full create/save/public-play | **Blocked** on WS01/02/03 real shells |
| Manual/browser | Interactive classroom journey | Not run (no wired editor/player routes yet) |
| Accessibility | Spin button role, aria-live, keyboard buttons, reduced motion | Covered by component tests + structure |
| Visual/audio | Semantic events recorded in tests; no real audio pack | Noop emitter until WS10 |

## Manual evidence

- Environment: local Windows, Node v24.16.0, npm 11.13.0
- URL: n/a (package-level)
- Viewport/device: jsdom component tests
- Activity fixture and seed: `fw-wheel-small-001`, `wheelFixtures.small`
- Observed result: `npm test` + `npm run build` green

## Known limitations and risks

- Full vertical-slice browser E2E not possible until foundation/editor/player shells mount adapters.
- Segment images are indicators only (asset URL resolution is media/shell-owned); result panel shows alt/fallback.
- Gesture/flick spin not implemented (button spin is required path; flick is progressive enhancement).
- Player adapter creates an internal host if shell stage element is missing (harness convenience).
- Rapid-click lock covered in reduced-motion component test; full 4–7s animation timing covered by pure geometry/session tests.

## How editor/player shells should load adapters

```ts
import { getProductRegistry } from "@/features/templates";
import { listContentV1PlayableSchema } from "@/domain";
import { createSeededRng, createNoopAudioEmitter } from "@/services";

const registry = getProductRegistry();
const reg = registry.get("wheel");

// Editor
const { createEditorAdapter } = await reg.loadEditorAdapter();
const editor = createEditorAdapter();

// Player
const content = listContentV1PlayableSchema.parse(snapshot.content);
const settings = reg.settings.migrate?.(1, snapshot.settings) ?? reg.settings.defaults();
const { createPlayerAdapter } = await reg.loadPlayerAdapter();
const player = createPlayerAdapter();
await player.mount({ /* PlayerAdapterContext */ });
```

Pure helpers for tests / harnesses:

```ts
import {
  selectWinnerId,
  targetRotationForWinner,
  createWheelSession,
  wheelFixtures,
} from "@/features/templates/wheel";
```

## Recommended next action

- Next step: Integration lead merges WS01→02→03 shells, then mount wheel adapters on `/activities/new` (editor) and `/play/[publicSlug]` (player) for saved-wheel vertical slice E2E.
- Verify by: known seed `fw-wheel-small-001` + fixture items → stable winner; eliminate does not change saved pack; public reload starts full set; no leaderboard UI/API.
- Stop before: unlocking Matching Pairs (05) before the saved-wheel preview E2E is green; do not add spin-wheel npm dependency without a new decision.
