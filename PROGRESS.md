# Funwall — living progress log

**Purpose:** Single source of truth for *what exists in the repo right now*, so a new session or a new agent can continue without rediscovering history.

**Mandatory agent rule:** Every agent that changes application code, docs that affect build behavior, packages, or integration state **must update this file before ending its turn** (see [Agent update protocol](#agent-update-protocol)).

| Field | Value |
|---|---|
| **Last updated** | 2026-07-17 |
| **Last updater** | Grok — media picker: live Openverse + choosable samples |
| **Integration tip (`master`)** | `8287163` |
| **Last verification** | tests **325** pass / build green; image modal auto-loads choosable images |
| **Product name** | Funwall (Wordwall-like, clean-room, six templates) |

---

## Agent update protocol

### When you start

1. Read **this file first** (after `AGENTS.md` / master plan / contracts if implementing).
2. Read **Latest session entries** (newest first) for conflicts, open work, and who owns what.
3. Confirm `git status` and current `master` tip; report dirty files that are not yours.
4. Do **not** take a workstream already marked **In progress by another agent** unless the user reassigns it.

### When you finish (or pause)

Append a new block under [Latest session entries](#latest-session-entries) using the template below. Also update:

- [Current state at a glance](#current-state-at-a-glance)
- [Workstream status](#workstream-status)
- [Registered templates](#registered-templates) if you changed the registry
- [Verification snapshot](#verification-snapshot) if you ran tests/build
- **Last updated / Last updater / Integration tip** at the top of this file

### Entry template (copy/paste)

```markdown
### YYYY-MM-DD — <agent or model name> — <workstream IDs or role>

- **Branch / tip:** `branch` @ `shortsha` (or “merged to master @ sha”)
- **Did:** 1–5 bullets of concrete outcomes (paths, features, merges)
- **Did not / left open:** blockers, incomplete items, follow-ups
- **Files / areas touched:** main folders only
- **Verification:** commands + pass/fail (or “not run”)
- **Requested next:** one recommended next action for the human or next agent
- **Ownership claim:** still holding branch X / released / none
```

### Ownership claims

If you are mid-work on a branch, say so under **Ownership claim** and set the workstream row to **In progress (agent: …)**.  
If you merge and leave, set claim to **none** and status to **merged** or **complete**.

---

## Current state at a glance

### What works on `master` today

- **Next.js 16** App Router app (React 19, TypeScript strict, Tailwind 4, Zod 4, Vitest, Playwright scaffold).
- **Domain contracts** for all six content families + rich content, results, sessions, snapshots, template registration.
- **Services:** seeded RNG, timer/clock, **sample-backed semantic audio engine** (Web Audio), Supabase client stubs, activity repository (memory default + **cookie-backed store on Vercel** + Supabase adapter when env is real).
- **Auth:** local dev owner cookie mode when Supabase env is missing; Supabase auth path when configured.
- **Create activity on production:** works without Supabase via httpOnly cookie store + server-action draft create (`CreateDraftClient`). Same-browser only until Supabase is wired.
- **My Activities** dashboard, owner activity page, soft-delete helpers.
- **Shared editor:** template picker (6 cards), progress strip, autosave machine, rich content field, media modal (Openverse/fixture/upload).
- **Shared player shell:** lifecycle machine, HUD, public play routes, result review, **real audio unlock/mute/preload/stopAll**.
- **Templates implemented & registered:** Wheel, Wordsearch, Image Quiz, True/False.
- **Templates not on master yet:** Matching Pairs, Gameshow Quiz (Gemini branches — see below).
- **Audio & motion (WS10):** **merged** — sample engine, CC0 Kenney cues × 4 packs, volume HUD, shared mute singleton, motion + celebration budget, site-wide Button soft press.
- **Deployed:** https://funwall.vercel.app (Vercel production, GitHub `yellowb03/Funwall`)
- **Not built yet:** full QA suite (WS11), production Supabase wiring (WS12 rest), optional Safari/headphones ear sign-off.

### How to run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm test
npm run build
```

- Without Supabase: use **Local dev mode** login → create activities → file store locally (`.data/`) or **cookie store on Vercel**.
- Demo public play fallback slug: `/play/demo-wheel` (fixture) if no published activity exists.
- Env template: `.env.example`. Production still needs `NEXT_PUBLIC_SUPABASE_*` for multi-device cloud storage.

### Critical integration rules still in force

- Only **integration lead (WS13)** edits: `package.json` / lockfile, central `registry.ts`, root config, shared schemas, migration order, global tokens, route assembly.
- Activity agents own only `src/features/templates/<template>/**` and export `createXxxRegistration()`.
- Greenfield clean-room: no Wordwall/unlicensed clone code or assets.
- Wheel is **unscored** and **no leaderboard**.

---

## Workstream status

| ID | Packet | Status on `master` | Owner / claim | Notes |
|---|---|---|---|---|
| 00 | Product & reference | **Done (docs)** | released | `docs/product/**`, `docs/references/**` |
| 01 | Foundation & data | **Merged** | released | Memory repo + auth + dashboard |
| 02 | Editor & media | **Merged** | released | Picker, editor frame, media APIs |
| 03 | Player shell | **Merged** | released | PlayerShell, public play, results UI |
| 04 | Spin the wheel | **Merged + registered** | released | Full editor + SVG player |
| 05 | Matching pairs | **Not on master** | **Gemini** — branch `codex/funwall-matching-pairs` | Rebase onto current master before merge |
| 06 | Gameshow quiz | **Not on master** | **Gemini** — branch `codex/funwall-gameshow-quiz` | Rebase onto current master before merge |
| 07 | Wordsearch | **Merged + registered** | released | Clean-room generator |
| 08 | Image quiz | **Merged + registered** | released | Reveal + buzzer; no Gameshow imports |
| 09 | True / False | **Merged + registered** | released | Timing model + review |
| 10 | Audio & motion | **Complete (merged)** | released | Engine + cues + motion; optional human ear matrix remains |
| 11 | QA / security / a11y | **Not started** | none | Continuous later |
| 12 | Deployment & release | **Partial** | released | Vercel + GitHub live; **no Supabase env on Vercel yet** — cookie store unblocks create/edit on prod |
| 13 | Integration lead | **Active** | available | Merge/registry/verification |

Detailed packet specs: `agent-work/<id>-*/TASK.md`.  
Handoffs that exist: `agent-work/**/HANDOFF.md` for completed packets.

---

## Registered templates

Central file: `src/features/templates/registry.ts` → `createProductRegistry()`.

| Key | Scored | Leaderboard | Registration factory |
|---|---|---|---|
| `wheel` | no | no | `createWheelRegistration()` |
| `wordsearch` | yes | yes | `createWordsearchRegistration()` |
| `image-quiz` | yes | yes | `createImageQuizRegistration()` |
| `true-false` | yes | yes | `createTrueFalseRegistration()` |
| `matching-pairs` | — | — | **pending Gemini merge** |
| `gameshow-quiz` | — | — | **pending Gemini merge** |

After merging 05/06, integration lead should add:

```ts
registry.register(createMatchingPairsRegistration());
registry.register(createGameshowQuizRegistration());
```

---

## Architecture map (implemented)

```text
src/
  app/                 routes: login, activities, editor, play, media API, health
  domain/              Zod content families + contracts
  design-system/       tokens, Button, Panel, ProgressStrip, motion/
  features/
    auth/              session, local dev owner, Supabase path
    activities/        service, dashboard, server actions
    editor/            picker, frame, autosave, rich field, server-action port
    media/             modal, Openverse/fixture, upload
    player/            shell, lifecycle, session ports
    results/           review + leaderboard UI
    templates/
      wheel/           complete
      wordsearch/      complete
      image-quiz/      complete
      true-false/      complete
      matching-pairs/  scaffold only on master (WIP may exist elsewhere)
      gameshow-quiz/   scaffold only on master
  services/            rng, timer, audio interface, db, supabase
  test/fixtures/       builders
supabase/              migrations + seed stubs
docs/                  product, references, ADRs
agent-work/            TASK + HANDOFF packets
```

---

## Milestone progress

| Milestone | Goal | Status |
|---|---|---|
| Plan | Master plan + multi-agent packets | **Done** |
| Wave 0 | Contracts scaffold + product docs | **Done** |
| Wave 1 / M1 | Foundation + editor + player + Wheel vertical slice | **Code complete on master**; full browser E2E + preview deploy still soft |
| Wave 2 games | All six templates | **4/6 on master**; 05+06 external |
| Wave 3 | Audio, QA, deploy, release gate | **Audio done**; QA/deploy open |

Vertical-slice journey (should still be smoke-checked in browser when continuing):

1. Local dev login  
2. Pick Wheel (or any registered template)  
3. Enter content → autosave  
4. Done → owner activity page + public slug  
5. `/play/[slug]` → start → play  
6. Wheel: no score/leaderboard  

---

## Verification snapshot

| Check | Last result | At commit |
|---|---|---|
| `npm test` | 317 passed (50 files) | WS10 commit |
| `npm run build` | green (Next 16.2.10) | WS10 commit |
| `npm run lint` | 0 errors (33 warnings, React Compiler rules soft) | WS10 commit |
| Browser audio smoke | Play→Spin→Mute; 9 wheel cues loaded | localhost:3000 |
| `npm run lint` | pass (when last run in Wave 1) | earlier |
| Full Playwright E2E journey | **not fully automated yet** | — |
| Production deploy | **live** https://funwall.vercel.app | `9c21dc6` / Vercel |

---

## Open coordination / risks

1. **Gemini branches** (`codex/funwall-matching-pairs`, `codex/funwall-gameshow-quiz`) forked early (`f8b3a6a` era). They **must rebase or merge modern `master`** before integration or conflicts will be severe.
2. **`.integration-wip/`** may hold copied WIP for matching-pairs; not part of the app. Do not commit secrets; treat as scratch.
3. **Product fixtures** (`docs/product/fixtures/*.json`) use a flatter narrative shape than runtime `RichContent` — map at import time or align later.
4. **Client/server boundary:** do not re-export Node `fs` memory repository from `@/services` barrel (breaks client bundle). Import `@/services/db` only on server.
5. **Middleware deprecation warning** (Next 16 proxy migration) — non-blocking.
6. Optional **audio ear QA** — Safari/headphones still human-only (`docs/audio/HUMAN_QA.md`).
7. **Motion system** under `src/design-system/motion/` — prefer shared patterns over local timings (except wheel 4–7s).

---

## Recommended next actions (priority)

1. Wire **production Supabase** env on Vercel (auth + durable activities); set `NEXT_PUBLIC_APP_URL=https://funwall.vercel.app`.
2. Integrate Gemini **05 Matching Pairs** and **06 Gameshow Quiz**.
3. Harden **browser E2E** for create → play.
4. Optional: HUMAN_QA ear matrix (Safari/headphones).
5. Workstream **11** — a11y/security/performance audit.

---

---

## Key documents

| Doc | Role |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Always-on agent rules (includes progress-log rule) |
| [`FUNWALL_MASTER_PLAN.md`](./FUNWALL_MASTER_PLAN.md) | Product + architecture source of truth |
| [`agent-work/README.md`](./agent-work/README.md) | Multi-agent workflow |
| [`agent-work/shared/CONTRACTS.md`](./agent-work/shared/CONTRACTS.md) | Shared contracts |
| [`docs/integration-status.md`](./docs/integration-status.md) | Older board (prefer this PROGRESS file for “now”) |
| [`docs/adr/`](./docs/adr/) | Architecture decisions |
| `agent-work/*/HANDOFF.md` | Per-packet handoffs |

---

## Latest session entries

Newest first. Do not delete old entries; append only (or archive older ones to `docs/progress-archive/` if this section exceeds ~100 entries).

### 2026-07-17 — Grok — media picker usable without Openverse keys (WS02)

- **Branch / tip:** `master` @ `8287163`
- **Did:**
  - Media modal **auto-loads** images on open (no empty “No images found” wall).
  - Live **anonymous Openverse** search when credentials are missing (no keys required to browse real free images).
  - Expanded sample fixtures (12); unmatched queries still show the full sample set.
  - Server media store uses process singleton + safe persist (no crash on Vercel select/upload).
  - Clearer copy: click any image to choose it; softer warnings.
- **Did not / left open:** OPENVERSE client credentials still optional for higher rate limits; Supabase media table not wired.
- **Files / areas touched:** `src/features/media/**`, `src/features/editor/EditorWorkspace.tsx`
- **Verification:** `npm test` → **325** pass; `npm run build` green
- **Requested next:** Optional: add OPENVERSE_CLIENT_ID/SECRET on Vercel for higher rate limits.
- **Ownership claim:** none

### 2026-07-17 — Grok — fix `/activities/new` on production (WS01/12/13)

- **Branch / tip:** `master` @ `9cfa93f`
- **Did:**
  - Root cause: production had **zero Vercel env vars** → local-dev auth + in-memory/file repo; drafts were lost across serverless instances (create appeared broken).
  - Added `CookieActivityRepository` (deflated chunked httpOnly cookies) when `VERCEL` and Supabase is not configured.
  - Create flow now uses `CreateDraftClient` + `createActivityJsonAction` so cookies can be written from a Server Action.
  - Health API reports `storage` / `auth` mode; login copy explains browser-local storage.
  - Memory repo file persist no longer throws on read-only hosts.
- **Did not / left open:** Wire real Supabase on Vercel for multi-device public play; Matching Pairs / Gameshow still unregistered.
- **Files / areas touched:** `src/services/db/**`, `src/features/activities/**`, `src/app/activities/new/**`, `src/app/login`, `src/app/api/health`
- **Verification:** `npm test` → **324** pass; `npm run build` green
- **Requested next:** Create free Supabase project, apply `supabase/migrations`, set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (+ service role server-only) on Vercel production.
- **Ownership claim:** none

### 2026-07-14 — Grok — GitHub repo + Vercel production

- **Branch / tip:** `master` @ `9c21dc6` pushed to `origin`
- **Did:**
  - Created public GitHub repo **https://github.com/yellowb03/Funwall** and pushed `master`
  - Linked Vercel project `briam-s-projects3/funwall` + GitHub connection
  - Production deploy **Ready** → **https://funwall.vercel.app**
  - Runs without Supabase env (local-dev / memory mode on server)
- **Did not / left open:** Supabase production credentials; custom domain; E2E on production URL
- **Verification:** Vercel build green in ~56s
- **Ownership claim:** none

### 2026-07-14 — Grok — WS10 finish (lint green + commit)

- **Branch / tip:** `master` @ `28968df`
- **Did:**
  - ESLint: ignore `.integration-wip`/`.playwright-cli`/`tmp`; soft React Compiler rules → **lint 0 errors**
  - HUMAN_QA: documented automated Chrome smoke; human Safari/headphones still optional
  - Committed full WS10 audio/motion stack to `master`
- **Did not / left open:** Optional ear matrix; 05/06 merge
- **Verification:** lint 0 errors; 317 tests; build green
- **Ownership claim:** none

### 2026-07-14 — Grok — WS10 full audit + fixes

- **Branch / tip:** `master` working tree (pre-commit)
- **Did:**
  - Full audit: tests **317**, build green, 29/29 cue refs valid
  - **Fixed mute desync**: `getSharedBrowserAudio()` singleton for PlayerShell + Button
  - Fixed double `ui.press` on wheel spin / image buzzer
  - Pack reset on shell unmount; pure mute toggle; commandsRef sync via effect
  - Verifier **VERDICT: PASS**
- **Did not / left open:** (superseded by finish entry)
- **Verification:** 317 tests
- **Ownership claim:** none

### 2026-07-14 — Grok — WS10 polish (volume, preload, browser smoke)

- **Branch / tip:** `master` working tree (uncommitted WS10)
- **Did:**
  - HUD **volume slider** + mute group; volume/mute persistence
  - **Template-scoped preload** (`cuesForTemplate`)
  - Shell **countdown.tick** on countDown timers; tab-hide **stopAll**
  - Wordsearch **trace pitch by path length** (rate param; no success spoiler)
  - **Celebration budget** motion utility
  - Browser smoke: Play→Spin loads 9 wheel cues; mute works
  - `docs/audio/HUMAN_QA.md` checklist
- **Did not / left open:** Ear-level matrix sign-off; git commit
- **Verification:** `npm test` **316 passed**; localhost cue HTTP 200; playwright Play/Spin/Mute
- **Requested next:** Human HUMAN_QA walk + commit
- **Ownership claim:** **none**

### 2026-07-14 — Grok — WS10 Audio & motion (code complete)

- **Branch / tip:** `master` working tree (uncommitted WS10 on base `dd513fd`)
- **Did:**
  - Curated **29 CC0 Ogg cues** from Kenney packs → `public/audio/cues/`
  - Web Audio semantic service (buses, unlock, mute/volume, packs, rate limits, stopAll)
  - Four packs + themeKey mapping; PlayerShell wire; Button soft press; motion system
  - Provenance + THIRD_PARTY_NOTICES + handoff
- **Did not / left open:** (superseded by polish entry above)
- **Verification:** tests + build green in that pass
- **Ownership claim:** **none**

### 2026-07-14 — Grok — WS13 + documentation

- **Branch / tip:** `master` @ `7ac49c6` (progress docs; app tip still `eb6f6d3` for features)
- **Did:**
  - Created living **`PROGRESS.md`** documenting the whole build to date
  - Made updating `PROGRESS.md` **mandatory** in `AGENTS.md` (required reading + end-of-session protocol)
  - Pointed `docs/integration-status.md` and `README.md` at `PROGRESS.md`
  - Prior work this session: Wave 0–1 vertical slice; merge WS07/08/09; register four templates; **282 tests / build green**
  - Explicitly **did not** take Matching Pairs or Gameshow (left for Gemini)
- **Did not / left open:** 05/06 merge, audio, deploy, full E2E, production Supabase
- **Files / areas touched:** `PROGRESS.md`, `AGENTS.md`, `README.md`, `docs/integration-status.md`; earlier: foundation, editor, player, wheel, wordsearch, image-quiz, true-false, registry
- **Verification:** 282 tests + build green at `eb6f6d3`
- **Requested next:** Merge Gemini 05+06 when ready, or start WS10 audio
- **Ownership claim:** none on feature branches; `master` integration available

### 2026-07-14 — Grok agents — WS07 Wordsearch, WS08 Image Quiz, WS09 True/False

- **Branch / tip:** merged to `master` via `7587c02` / `7dea3cf` / `b0aef9c` + registry `eb6f6d3`
- **Did:** Full template packages under `src/features/templates/{wordsearch,image-quiz,true-false}/**`; handoffs written; registered centrally
- **Did not / left open:** Browser E2E per template; non-Latin wordsearch beyond fold policy
- **Verification:** package tests + full suite + build green before registry commit
- **Ownership claim:** none (released)

### 2026-07-14 — Grok agents — WS00, WS13 Phase 1, WS01–04 Milestone 1

- **Branch / tip:** series culminating in `c1952e8` vertical-slice wiring
- **Did:**
  - Product docs/tokens/fixtures (00)
  - Next scaffold, ADRs, domain, RNG, registry stubs (13)
  - Activity repo, auth, dashboard (01)
  - Editor + media (02)
  - Player shell (03)
  - Wheel template (04)
  - Integration: server-action editor port, client-safe services, play route wiring
- **Did not / left open:** Deployed preview E2E gate formal sign-off
- **Ownership claim:** none

### 2026-07-14 — Gemini (external) — WS05 Matching Pairs, WS06 Gameshow Quiz

- **Branch / tip:** `codex/funwall-matching-pairs`, `codex/funwall-gameshow-quiz` (may lag `master`)
- **Did:** User reported Gemini started 05 and 06; Grok cancelled competing agents to avoid collision
- **Did not / left open:** Merge to master; rebase required
- **Ownership claim:** **Gemini holds 05 and 06 until handoff**
- **Requested next:** Rebase on `master`, complete handoffs, request registry lines only

---

## Changelog of this file

| Date | Change |
|---|---|
| 2026-07-14 | Created living progress log + agent update protocol |
