# Funwall — living progress log

**Purpose:** Single source of truth for *what exists in the repo right now*, so a new session or a new agent can continue without rediscovering history.

**Mandatory agent rule:** Every agent that changes application code, docs that affect build behavior, packages, or integration state **must update this file before ending its turn** (see [Agent update protocol](#agent-update-protocol)).

| Field | Value |
|---|---|
| **Last updated** | 2026-07-14 |
| **Last updater** | Grok integration lead (this session) |
| **Integration tip (`master`)** | `7ac49c6` — living PROGRESS.md + agent update rule |
| **Last verification** | `npm test` **282 passed**; `npm run build` **green** (at `eb6f6d3`; docs-only after) |
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
- **Services:** seeded RNG (Mulberry32 + named streams), timer/clock, semantic audio *interface* (noop emitter), Supabase client stubs, activity repository (memory default + Supabase adapter when env is real).
- **Auth:** local dev owner cookie mode when Supabase env is missing; Supabase auth path when configured.
- **My Activities** dashboard, owner activity page, soft-delete helpers.
- **Shared editor:** template picker (6 cards), progress strip, autosave machine, rich content field, media modal (Openverse/fixture/upload).
- **Shared player shell:** lifecycle machine, HUD, public play routes, result review plumbing, wheel score/leaderboard hidden by capability flags.
- **Templates implemented & registered:** Wheel, Wordsearch, Image Quiz, True/False.
- **Templates not on master yet:** Matching Pairs, Gameshow Quiz (Gemini branches — see below).
- **Not built yet:** real audio cue packs (WS10), full QA suite/release (WS11), production deploy pipeline (WS12), production Supabase project wiring.

### How to run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm test
npm run build
```

- Without Supabase: use **Local dev mode** login → create activities → memory store (optional `.data/` persistence).
- Demo public play fallback slug: `/play/demo-wheel` (fixture) if no published activity exists.
- Env template: `.env.example`.

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
| 10 | Audio & motion | **Not started** | none | Semantic events exist; cues missing |
| 11 | QA / security / a11y | **Not started** | none | Continuous later |
| 12 | Deployment & release | **Not started** | none | Vercel/Supabase production |
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
  design-system/       tokens, Button, Panel, ProgressStrip
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
| Wave 3 | Audio, QA, deploy, release gate | **Not started** |

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
| `npm test` | 282 passed (47 files) | `eb6f6d3` |
| `npm run build` | green (Next 16.2.10) | `eb6f6d3` |
| `npm run lint` | pass (when last run in Wave 1) | earlier |
| Full Playwright E2E journey | **not fully automated yet** | — |
| Production deploy | **not done** | — |

---

## Open coordination / risks

1. **Gemini branches** (`codex/funwall-matching-pairs`, `codex/funwall-gameshow-quiz`) forked early (`f8b3a6a` era). They **must rebase or merge modern `master`** before integration or conflicts will be severe.
2. **`.integration-wip/`** may hold copied WIP for matching-pairs; not part of the app. Do not commit secrets; treat as scratch.
3. **Product fixtures** (`docs/product/fixtures/*.json`) use a flatter narrative shape than runtime `RichContent` — map at import time or align later.
4. **Client/server boundary:** do not re-export Node `fs` memory repository from `@/services` barrel (breaks client bundle). Import `@/services/db` only on server.
5. **Middleware deprecation warning** (Next 16 proxy migration) — non-blocking.
6. **No real audio assets** yet — games emit semantic events only.

---

## Recommended next actions (priority)

1. Integrate Gemini **05 Matching Pairs** and **06 Gameshow Quiz** when ready (rebase → review ownership → register → full test).
2. Workstream **10 Audio & motion** — original cue packs mapped to semantic events.
3. Harden **browser E2E** for create → play on Wheel + one scored game.
4. Workstream **12** — Vercel + real Supabase project + env.
5. Workstream **11** — a11y/security/performance audit before “done.”

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
