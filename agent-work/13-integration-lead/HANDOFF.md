# Funwall workstream handoff

## Workstream

- Packet: 13 — integration lead (Phase 1: orient, freeze contracts, scaffold)
- Branch/worktree: `master` (repo root)
- Source commit: (see latest `13:` commits on master after this handoff)
- Status: **complete** (Phase 1 only)

## Outcome

Wave 1 agents can install, test, and build a Next.js Funwall app and import **frozen** domain contracts, RNG/timer/audio interfaces, editor/player mock adapters, and a central template registry that already registers the **Wheel stub** with `isScored=false` and `hasLeaderboard=false`. Owner and public route shells compile; health API returns `{ ok: true }`.

## Scope completed

- Next.js 16 App Router + React 19 + TypeScript strict + Tailwind 4 scaffold at repo root (planning docs preserved).
- Scripts: `dev`, `build`, `start`, `lint`, `test`, `test:e2e`.
- `.env.example` for Supabase / Openverse / optional Pexels.
- ADRs 001–009, integration status board, `THIRD_PARTY_NOTICES.md` template.
- Domain Zod schemas for all six content families + rich content, results, session events, public snapshot, registration interface, conversion stubs.
- Seeded RNG (Mulberry32 + named streams + known vectors), timer/clock interface, semantic audio emitter interface, Supabase client stubs with clear missing-env errors.
- Central registry + wheel registration export + mock-generic helper for tests.
- Fake editor/player adapters (no-op).
- Design tokens CSS variables + Button / Panel / ProgressStrip.
- Route stubs: `/`, `/login`, `/activities`, `/activities/new`, `/play/[publicSlug]`, `/api/health`.
- Supabase initial migration stub + seed placeholder.
- Fixture builders under `src/test/fixtures`.
- Contract tests green; production build green.

## Files changed

| File/folder | Why |
|---|---|
| `package.json`, `package-lock.json` | App name, deps, scripts |
| `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore` | Toolchain |
| `.env.example` | Env contract |
| `README.md` | Local setup + import map |
| `docs/adr/ADR-001`…`ADR-009` | Architecture decisions |
| `docs/integration-status.md` | Workstream board |
| `THIRD_PARTY_NOTICES.md` | License process template |
| `src/domain/**` | Frozen contracts + schema tests |
| `src/services/**` | RNG, timer, audio, Supabase |
| `src/features/**` | Registry, wheel stub, editor/player mocks, feature barrels |
| `src/design-system/**` | Tokens + shell components |
| `src/app/**` | Routes + health + globals |
| `src/test/**` | Setup + fixture builders |
| `e2e/health.spec.ts` | Playwright scaffold |
| `supabase/migrations/*`, `supabase/seed.sql` | Schema stub |
| `agent-work/13-integration-lead/HANDOFF.md` | This handoff |

## Contract or schema changes

- **New code-level contracts** (first freeze). Import from `@/domain` and `@/services`.
- Content packs use nested `content: RichContent` (not flat `text` on items).
- Template keys fixed to six literals.
- Wheel capabilities frozen unscored / no leaderboard.
- Product registry registers Wheel only until other agents land.

### Alignment note (WS00)

`docs/product/fixtures/*.json` use a simplified narrative shape (e.g. `{ id, text }`, non-UUID media ids). Runtime schemas require nested rich content and UUID asset ids. Map fixtures at import time or update product fixtures in a follow-up with 00/13 coordination.

## Requested integration changes

- None from other agents yet (this packet owns shared roots).
- Future: register additional templates via one-line `registry.register(createXxxRegistration())` only when handoff requests it.

## Verification

| Check | Command or method | Result |
|---|---|---|
| Baseline/static | `npm run lint` | Pass (0 errors) |
| Unit/component | `npm test` | Pass — 25 tests |
| Build | `npm run build` | Pass — Next.js 16.2.10 |
| Integration/E2E | `npm run test:e2e` | Scaffold only; browsers may need `npm run test:e2e:install` — not required for Phase 1 gate |
| Manual/browser | Route stubs compile; health JSON in build | Not full interactive journey (no auth yet) |
| Accessibility | ProgressStrip uses nav/aria-current; Button focus ring tokens | Partial — shell only |
| Visual/audio | Tokens from product design-tokens | No real audio (noop emitter) |

## Manual evidence

- Environment: local Windows, Node v24.16.0, npm 11.13.0
- URL: n/a for full product journey
- Viewport/device: n/a
- Activity fixture and seed: builders + `funwall-vector-v1` RNG vectors
- Observed result: `npm test` + `npm run build` green

## Known limitations and risks

- No real Supabase project wired; clients throw `SupabaseConfigError` until env is set.
- Wheel editor/player are no-op stubs — WS04 must implement.
- RLS insert policies on play tables are intentionally loose stubs — WS01 must tighten via RPCs.
- Only Wheel is registered in the product registry.
- TypeScript pinned to 5.9.x (not 7) for Next toolchain compatibility (ADR-001).
- Product fixture JSON not yet schema-identical to domain packs.

## Exact package versions chosen

| Package | Version |
|---|---|
| next | 16.2.10 |
| react / react-dom | 19.2.4 |
| zod | ^4.4.3 |
| @supabase/supabase-js | 2.110.3 |
| @supabase/ssr | ^0.12.1 |
| typescript | ^5.9.3 |
| tailwindcss | ^4 (with @tailwindcss/postcss) |
| vitest | ^4.1.10 |
| @playwright/test | ^1.61.1 |
| @testing-library/react | ^16.3.2 |

## How Wave 1 agents should import contracts

```ts
import {
  TEMPLATE_KEYS,
  listContentV1Schema,
  parsePlayableContentPack,
  publicActivitySnapshotSchema,
  type TemplateRegistration,
} from "@/domain";

import { createSeededRng, createTimer, createNoopAudioEmitter } from "@/services";
import { getProductRegistry } from "@/features/templates";
import { createNoopEditorAdapter } from "@/features/editor";
import { createNoopPlayerAdapter } from "@/features/player";
import { buildListContent } from "@/test/fixtures";
```

- **01 Foundation:** own `src/features/activities/**`, `src/services/db/**` (if added), `supabase/**` detail — request migration order changes via handoff if needed; do not invent parallel content schemas.
- **02 Editor:** own `src/features/editor/**`, `src/features/media/**`; implement against `EditorAdapter` + domain drafts.
- **03 Player:** own `src/features/player/**`, `src/features/results/**`; implement against `PlayerAdapter` + snapshot/session contracts.
- **04 Wheel:** own only `src/features/templates/wheel/**`; export updated `createWheelRegistration()`; request registry merge if signature changes (already registered).

## Unlock

- **01 foundation, 02 editor, 03 player, 04 wheel** may start.
- **05–09 remain blocked** until deployed saved-wheel vertical slice passes (Milestone 1).

## Recommended next action

- Next step: Assign Workstream 01 (auth, RLS tightening, activity CRUD against domain schemas) in parallel with 02/03 mocks and 04 wheel package.
- Verify by: each packet’s TASK.md acceptance + unit tests; integration lead merges 01→02→03→04 then full E2E.
- Stop before: unlocking Matching Pairs / other games before the saved-wheel vertical slice is green on a preview deployment.

## Stop rule

Do not declare Phase 1 “product complete.” Stop further expansion of shared contracts unless an ADR is written. Do not implement full games, real media search, or production deploy in this packet. Do not unlock five activity agents early.
