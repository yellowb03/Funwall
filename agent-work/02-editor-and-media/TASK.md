# Workstream 02: shared editor, autosave, and media workflow

Recommended model: a senior React/Next.js product engineer with form architecture, media APIs, and browser verification experience.

## Mission

Build the Wordwall-like creator experience shared by all six templates: template picker, progress strip, editor frame, stable repeating rows, rich content fields, draft validation, autosave/recovery, Done, and an in-app image search/upload/library workflow.

## Starts when

- Foundation agent has supplied provisional activity create/read/autosave/finalize contracts.
- Integration lead has frozen content-family and editor-adapter contracts.
- Product/reference agent has supplied initial tokens and states; temporary token values may be used until then.

## Owned scope

- `src/features/editor/**`
- `src/features/media/**`
- Media search/upload endpoints assigned by integration lead
- Template picker route content under an agreed boundary
- Shared editor/media tests

Do not implement template game players or put template-specific fields in the shared editor. Template rows arrive through adapters.

## Deliverables

### A. Template picker

- Six cards only.
- Recommended/alphabetical sort.
- Search by name/description.
- Three/two/one-column responsive layouts.
- Keyboard and focus behavior.
- Loading/error states if registry metadata is lazy.
- Card artwork loaded from the registry.

### B. Shared editor frame

- `Pick a template > Enter content > Play` strip.
- Selected template indicator.
- Title and optional instruction.
- Slot for template-owned editor adapter.
- Common row actions/drag handles.
- Shared Add action style.
- Autosave status.
- Validation summary and inline errors.
- Done action.
- Navigation guard when the latest local revision cannot be flushed.

### C. Row operations

- Stable ID add, update, reorder, duplicate, delete.
- Undo for destructive row delete during the current edit session.
- Keyboard reorder alternative; drag is not the only mechanism.
- Focus moves predictably after add/delete/duplicate.
- Limits are enforced before adding beyond maximum.

### D. Autosave and recovery

- 700-1000 ms debounced save.
- Immediate dirty state.
- Single in-flight save or ordered queue; stale responses cannot overwrite new local state.
- Compare-and-swap revision support.
- Save error retry with edits preserved.
- Local recovery draft until server acknowledgment.
- Flush on Done, relevant route change, and visibility change.
- Conflict UI that preserves local and server versions.
- Testable state machine isolated from React rendering.

### E. Rich content field

- Plain text input/textarea appropriate to the adapter.
- Image button, thumbnail, replace, remove.
- Audio hook/placeholder compatible with a later audio-content feature; do not invent upload if out of v1 owner scope.
- Alt text/focal/fit metadata.
- Errors connected to fields accessibly.
- No arbitrary HTML.

### F. Image modal

Tabs: Search, Upload, My images.

Search:

- Openverse provider adapter first.
- Provider-neutral result normalization from shared contracts.
- Search submit/debounce, pagination, caching, loading, no results, rate limit, provider down.
- Thumbnail grid with creator/license context.
- Server-side provider calls; no API key in browser.

Selection:

- Server records provider/license/attribution and returns an owner media ID before insertion.
- Crop/fit/focal-point confirmation.
- Editable alt text.
- Exact target field preserved if the modal remains open during autosave.

Upload:

- JPEG/PNG/WebP only for v1.
- Progress, cancellation where practical, validation, retry.
- Server MIME/dimension/size validation and Sharp processing.
- EXIF/GPS stripped; safe responsive derivatives.

My images:

- Search/recent sort.
- Reuse without duplicating bytes.
- Show attribution/provider badge.
- Prevent deleting an in-use asset without a clear impact flow; soft-delete metadata first.

### G. Template adapter harness

Provide a story/test harness where each activity agent can render its editor adapter with:

- Empty draft.
- Valid fixture.
- Error fixture.
- Shared media opener.
- All row helpers.
- Autosave callback spy.

## Acceptance criteria

- Owner can select a template and reach the correct editor with no template-specific branching in the shared frame.
- Typing, adding, reordering, duplicating, deleting, and image insertion produce stable serializable drafts.
- Autosave never loses newer edits when responses arrive out of order.
- Refresh after an acknowledged save restores the exact content and order.
- Refresh after an unacknowledged save offers local recovery.
- Done refuses invalid content, focuses/reports errors, and navigates only after acknowledged finalize.
- Search result selection retains required attribution/license metadata.
- Provider failure does not break uploads or My images.
- Modal is keyboard accessible and restores focus to the originating field.

## Required tests

- Autosave state machine and fake-timer tests.
- Out-of-order response and revision conflict.
- Row ID/order operations.
- Template picker search/sort/keyboard.
- Media adapter normalization.
- Provider rate-limit/failure UI.
- Upload validation and image metadata stripping integration.
- Modal focus trap/restore and alt validation.
- Done flush and validation.
- E2E with the wheel adapter once available.

## Manual verification

Use a throttled network:

1. Select Wheel.
2. Add/reorder/duplicate/delete items quickly.
3. Search Openverse and insert an image.
4. Upload a rotated phone photo and confirm orientation/metadata behavior.
5. Go offline while typing, reconnect, recover, and finish.
6. Reload and confirm exact persistence.

## Stop rule

Stop before importing a template player, embedding provider secrets, scraping an image search engine, or bypassing activity revisions. If the media provider terms cannot be satisfied, keep the adapter disabled and report the legal/technical blocker.

## Copy-ready assignment prompt

> Recommended model: a senior React/Next.js product engineer. Read the master plan, shared contracts, and this packet. Build the six-card template picker, shared editor frame, stable row operations, robust autosave/recovery, Done flow, RichContentField, and Openverse-first image search/upload/My images modal. Work only through foundation contracts and template editor adapters. Verify with throttled-network and keyboard browser tests plus the Wheel E2E. Do not add player logic, provider secrets, or scraped images. Stop if persistence/media contracts are missing rather than inventing incompatible ones.

