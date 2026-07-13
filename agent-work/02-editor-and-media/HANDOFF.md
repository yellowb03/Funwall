# Funwall workstream handoff

## Workstream

- Packet: 02 — editor and media
- Branch/worktree: `master` (isolated worktree `subagent-019f5dc1-90b0-70f1-ab83-90dad34c8a1e`)
- Source commit: see git log for `02:` series
- Status: **complete** (standalone editor UX against mocks)

## Outcome

Owners can pick any of the six launch templates, open a shared content editor with autosave status, title/instruction fields, and a Done action. Image search/upload/library works via in-app modal against fixture stock results when Openverse keys are absent. Drafts persist in an in-memory port with CAS revisions and localStorage recovery until Workstream 01 wires real storage.

## Scope completed

- Template picker at `/activities/new` (search, recommended/alphabetical, 3/2/1 grid, keyboard select).
- Editor route `/activities/new/[template]` creates draft via persistence port and loads registry editor adapter when present.
- Shared `EditorFrame` + `EditorWorkspace` (progress strip, template indicator, autosave, validation, Done, conflict/recovery banners, beforeunload guard).
- Pure autosave state machine (clean/dirty/saving/saved/error/conflict), 800ms debounce, flush on Done + visibilitychange, local recovery drafts.
- `EditorActivityPort` + `MemoryEditorPort` (createDraft / autosave CAS / finalize / get).
- `RichContentField` (text, image add/replace/remove, alt + fit).
- `MediaModal` + server routes: search (Openverse or fixtures), select, upload (JPEG/PNG/WebP), library.
- Row helpers for adapters; template catalog from copy deck.
- Unit/component tests for machine, picker, rich field, port, normalize, rows.

## Files changed

| File/folder | Why |
|---|---|
| `src/features/editor/**` | Picker, frame, workspace, autosave, persistence, rich field, rows, catalog |
| `src/features/media/**` | Types, fixtures, Openverse client, media store, MediaModal |
| `src/app/activities/new/page.tsx` | Template picker shell |
| `src/app/activities/new/[template]/page.tsx` | Draft create + editor workspace |
| `src/app/api/media/**` | search, select, upload, library routes |
| `src/test/setup.ts` | RTL cleanup between tests |
| `agent-work/02-editor-and-media/HANDOFF.md` | This handoff |

## Contract or schema changes

- None to domain Zod schemas.
- **New editor-facing contracts** under `src/features/editor/persistence` (`EditorActivityPort`, `EditorActivity`, CAS errors) for 01 to implement against ADR-004.
- Media asset shape under `src/features/media/types` aligned with CONTRACTS.md §15.

## Requested integration changes

- **Routes:** Confirm merge of `/api/media/search|select|upload|library` and `/activities/new/[template]`.
- **Persistence swap:** Workstream 01 should implement `EditorActivityPort` against Supabase and inject it instead of `getDefaultEditorPort()` / `MemoryEditorPort`.
- **Media storage:** Replace `MemoryMediaStore` with Supabase Storage + `media_assets` (Sharp processing, EXIF strip) when ready.
- **Registry:** No registry edit required. Wheel loads via `getProductRegistry().loadEditorAdapter`; other templates show “adapter coming soon” until registered.
- **package.json / lockfile:** None required for this packet. Optional later: image processing package (e.g. `sharp`) when 01/02 harden uploads — request via integration lead only.
- **Env:** Existing `OPENVERSE_CLIENT_ID` / `OPENVERSE_CLIENT_SECRET` already in `.env.example`; fixture search works without them.
- **Done navigation:** Currently navigates to `/play/{publicSlug}` after finalize; owner activity page from 01/03 may want `/activities/{id}` instead — coordinate with 03/01.

## Verification

| Check | Command or method | Result |
|---|---|---|
| Baseline/static | TypeScript via `npm run build` | Pass |
| Unit/component | `npm test` | Pass — 59 tests |
| Build | `npm run build` | Pass — Next.js 16.2.10; new editor + media routes listed |
| Integration/E2E | Not added for full throttle journey | Partial — unit coverage only; wheel E2E once WS04 adapter lands |
| Manual/browser | Routes compile; memory draft create | Not full interactive session in this agent run |
| Accessibility | Focus rings on cards/fields; modal Escape + focus trap; ProgressStrip aria | Partial |
| Visual/audio | Tokens: canvas/primary/tile-pale | No audio |

## Manual evidence

- Environment: local Windows, npm test + npm run build green after implement
- URL: `/activities/new`, `/activities/new/wheel`
- Viewport/device: n/a automated
- Activity fixture: empty list draft + builders for finalize tests
- Observed result: 59/59 tests pass; production build green

## Known limitations and risks

- Persistence is in-memory (`globalThis` Map); server restarts lose drafts (by design until 01).
- Upload stores data URLs in memory (not Sharp-processed derivatives).
- Wheel/other adapters: noop adapter returns null → “Editor adapter coming soon” placeholder until WS04+ ship real fields.
- Media insert to adapter fields uses a shared `funwall:media-insert` event; template adapters should also call `openMediaModal` and apply target descriptors themselves for precise field targeting.
- Finalize navigates to public play route; owner “activity page” may not exist yet.
- `package-lock.json` was not modified in commits (integration-owned).

## Recommended next action

- Next step: Workstream 01 implement real `EditorActivityPort` + media_assets; Workstream 04 wire real wheel editor adapter into registration.
- Verify by: create wheel with real adapter, autosave across reload against Supabase, insert Openverse image, Done → public play.
- Stop before: inventing a second autosave protocol or per-template editor chrome.
