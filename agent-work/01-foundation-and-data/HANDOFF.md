# Funwall workstream handoff

## Workstream

- Packet: 01 — foundation, authentication, persistence, and dashboard
- Branch/worktree: isolated worktree on `master` base (`f8b3a6a` + Phase 1 scaffold)
- Source commits: `a66b6a6` → `eb5ab0e` → `e324dc0` → `b8ab082` (tip may move if amended)
- Status: **complete**

## Outcome

Without Supabase credentials, an owner can open the app, use **Local dev mode** login, create a Wheel draft, autosave with revision CAS, finalize/publish, receive a ≥128-bit public slug, resolve a sanitized public snapshot at `/play/[slug]`, soft-delete (public link fails), and restore without accidentally re-enabling a disabled link. With Supabase env present, the same repository interface uses `SupabaseActivityRepository` and real Auth; public rows are not enumerable via RLS.

## Scope completed

- **Activity repository port** with `MemoryActivityRepository` (default, optional `.data/activities.json`) and `SupabaseActivityRepository` (when env configured).
- **Activity domain service** over the registry: create draft, get, autosave CAS, finalize (playable validation), list/search/sort, duplicate, rename, move folder, soft-delete/trash/restore, publish/disable/regenerate slug, public snapshot resolve, folders.
- **Auth:** Supabase session when configured; otherwise single local owner cookie (`funwall_dev_session` / `dev-owner`) labeled **Local dev mode**. Middleware protects `/activities/**` and `/trash/**`; `/play/**` stays public.
- **Dashboard UI** at `/activities`: cards (title, template label, updated), empty state CTA, search, soft-delete, loading/error, create link.
- **Owner activity page** `/activities/[id]`: title, public play link, sample autosave/finalize/publish/duplicate/delete actions for the vertical slice.
- **Server actions** for owner CRUD + `resolvePublicSnapshotAction` for public play.
- **Migrations:** removed broad public SELECT; added security-definer `resolve_public_activity_snapshot`; closed open play insert stubs.
- **Tests:** CAS conflict, duplicate isolation, soft-delete hides public, slug entropy ≥128 bits, cross-owner authz, list search.
- **Seed fixtures:** `src/features/activities/seed-fixtures.ts` for list.v1 wheel content (memory).

## Files changed

| File/folder | Why |
|---|---|
| `src/services/db/**` | Repository interface, memory + supabase adapters, slug, factory, errors |
| `src/features/activities/**` | Service, actions, empty content, dashboard components, seed fixtures, tests |
| `src/features/auth/**` | Session helpers, local-dev + Supabase auth actions/constants |
| `src/middleware.ts` | Owner route protection |
| `src/app/login/page.tsx` | Local-dev / Supabase login UI |
| `src/app/activities/**` | Dashboard, new template create, owner activity page |
| `src/app/play/[publicSlug]/page.tsx` | Public resolve proof (player shell still WS03) |
| `src/app/auth/callback/route.ts` | Supabase magic-link/PKCE callback |
| `src/app/page.tsx` | Local-dev banner + session-aware home |
| `src/services/index.ts` | Re-export db helpers |
| `supabase/migrations/20260714000000_initial_schema.sql` | RLS tighten + public snapshot RPC |
| `supabase/seed.sql` | Notes + pointer to memory fixtures |
| `.gitignore` | Ignore `.data/` |
| `.env.example` | Document local-dev memory path |
| `agent-work/01-foundation-and-data/HANDOFF.md` | This handoff |

## Contract or schema changes

- No changes to frozen domain Zod packs or template registry keys.
- Activity storage embeds optional settings meta keys for public snapshot capabilities: `__isScored`, `__hasLeaderboard`, `__templateVersion` (stripped before public response).
- DB: removed `activities_public_read_published` direct SELECT; added `resolve_public_activity_snapshot(text)` SECURITY DEFINER.

## Requested integration changes

- **None required for package.json/lockfile** — used existing `@supabase/ssr`, `@supabase/supabase-js`, `zod`, Next 16.
- **Middleware note:** Next 16.2 logs that the `middleware` file convention is deprecated in favor of `proxy`. Integration lead may rename/migrate when adopting the new convention.
- **Routes already assembled under WS01 ownership** for vertical slice: `/activities`, `/activities/new`, `/activities/[id]`, `/login`, `/auth/callback`, play resolve on `/play/[publicSlug]`.
- **Editor link** `/activities/[id]/edit` is linked but not implemented (WS02).
- **Optional later:** register additional templates remain blocked until their packages land; create only allows registered templates (Wheel today).
- **Memory singleton** is process-scoped; multi-instance production must use Supabase, not memory.

## Verification

| Check | Command or method | Result |
|---|---|---|
| Baseline/static | `npm run lint` | Pass (run with tests/build gate) |
| Unit/component | `npm test` | Pass — 38 tests (13 new foundation + existing) |
| Build | `npm run build` | Pass — Next.js 16.2.10 |
| Integration/E2E | Playwright full journey | Not automated in this packet; vertical slice is unit + route compile |
| Manual/browser | Local dev login → create → autosave → finalize → play resolve → delete | Designed path; run with `npm run dev` without Supabase env |
| Accessibility | Labels on search/login inputs; focus ring tokens on Button | Partial — dashboard only |
| Visual/audio | Design tokens (canvas, primary) | No real audio |

## Manual evidence

- Environment: local Windows, Node v24.16.0, npm 11.13.0, no Supabase credentials
- URL: `http://localhost:3000` after `npm run dev`
- Viewport/device: desktop
- Activity fixture and seed: `buildListContent()` classroom supplies; memory seed helper `buildMemorySeedFixtures()`
- Observed result: `npm test` 38 passed; `npm run build` green

### Manual journey (no Supabase)

1. `npm run dev` → open `/` → see Local dev mode banner.
2. Log in → **Continue as local owner** → land on `/activities` (empty).
3. Create → Spin the wheel → draft at `/activities/[id]`.
4. **Fill sample list + autosave** → revision increments.
5. **Done (finalize + publish)** → public slug shown.
6. Open `/play/[slug]` in another context → sanitized snapshot (title, template, no owner id).
7. Soft-delete from dashboard → public link shows unavailable.
8. (Optional) restore via service/API — lifecycle preserved if previously archived.

## Known limitations and risks

- Local-dev auth is intentionally insecure; must never be production default when Supabase is configured it is disabled.
- Memory repo is not multi-tenant safe across processes; use Supabase for shared/preview deployments.
- Public slug stored in plaintext (not hashed) for lookup simplicity; regeneration invalidates old links.
- Supabase path for session/event/leaderboard inserts is closed until WS03 RPCs — by design.
- Owner activity page uses fixture helper buttons instead of full editor (WS02).
- Play page shows snapshot JSON stub, not a real game (WS03/WS04).
- Next middleware deprecation warning (proxy migration deferred to integration lead).
- Product fixture JSON under `docs/product` still not schema-identical (WS00 note from Phase 1).

## Interfaces for downstream workstreams

### Workstream 02 (editor)

```ts
import {
  autosaveActivityAction,
  finalizeActivityAction,
  getActivityAction,
  createActivityJsonAction,
} from "@/features/activities";
import { requireOwnerSession } from "@/features/auth";
```

- Client draft base revision → `autosaveActivityAction({ activityId, baseRevision, content, settings, title })`.
- Done → `finalizeActivityAction` (validates via registry `playableSchema`).
- Empty packs: `emptyContentForTemplate(templateKey)`.

### Workstream 03 (player)

```ts
import { resolvePublicSnapshotAction } from "@/features/activities";
// or ActivityService.resolvePublicSnapshot(publicSlug)
```

- Snapshot type: `PublicActivitySnapshot` from `@/domain`.
- Never trust browser for owner fields; always resolve server-side by slug.
- Session/result writes need future RPCs (RLS closed on inserts).

### Activity agents (04–09)

- Do not query tables. Use domain schemas + registration factories only.
- Create/list go through foundation service; playable validation uses your `playableSchema`.

## Recommended next action

- Next step: Integration lead merges WS01; WS02 wires editor autosave/Done to actions; WS03 mounts player on resolved snapshot; WS04 implements wheel adapters.
- Verify by: full manual journey above + `npm test` + preview deploy with either memory (dev) or Supabase.
- Stop before: weakening RLS, adding template conditionals to activity service, or unlocking games 05–09 before saved-wheel vertical slice is green.

## Stop rule

Do not add template-specific branches to the activity service or dashboard. New shared fields require an ADR. Do not re-open public SELECT on `activities`.
