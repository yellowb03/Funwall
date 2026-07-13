# Funwall workstream handoff

## Workstream

- Packet: 07-wordsearch
- Branch/worktree: isolated worktree on master (~c1952e8)
- Source commit: c1952e8843abdd889285cc6a50abae485359ea19
- Status: complete

## Outcome

Owners can author Wordsearch activities (2–40 words, optional clues, bulk paste) with live grid-letter preview and validation. Players get a deterministic seeded letter grid with drag/tap/keyboard selection, lives, word list, found/miss review, and scored completion. Generator is pure, Unicode-aware, and bounded.

## Scope completed

- Unicode normalization (NFKC, diacritic fold, space/hyphen strip, A–Z v1 alphabet policy)
- Pure seeded board generator with intersections, H/V + optional diagonal/reverse, filler alphabet, structured failure
- Settings v1 + migrate (timer, lives, selection mode, diagonal, reverse, letter case, show list, answers at end, diacritic policy)
- Draft/playable validation
- Editor adapter (rows, clues, bulk paste, reorder/duplicate/delete)
- Player adapter (semantic grid, drag selection, tap modes, aria-live, audio events, createRoot mount)
- Registration factory: `createWordsearchRegistration()` (isScored + hasLeaderboard)
- Unit/property/component tests (54 in package; full suite 190 green)
- No third-party generator dependency (custom clean-room implementation)

## Files changed

| File/folder | Why |
|---|---|
| `src/features/templates/wordsearch/**` | Full template package |
| `agent-work/07-wordsearch/HANDOFF.md` | This handoff |

## Contract or schema changes

- None. Uses existing `wordsearch.v1` domain schema (`words[]` with `displayWord` / `normalizedWord` / optional `clue`).
- Template-owned settings: `WordsearchSettings` v1 under the wordsearch folder.
- v1 Latin grid policy: playable packs still require A–Z `normalizedWord` per domain schema; display may keep accents/spaces.

## Requested integration changes

1. **Registry one-liner** (integration lead only):

```ts
import { createWordsearchRegistration } from "@/features/templates/wordsearch";
// in createProductRegistry():
registry.register(createWordsearchRegistration());
```

2. Optional: re-export from `src/features/templates/index.ts` if desired.
3. Optional: original thumbnail asset keyed `wordsearch` when art pipeline lands.
4. Dependencies: **None**. Custom generator; do not add MIT word-search-generator unless a future audit requests it.
5. package.json / lockfile: **None**.

## Verification

| Check | Command or method | Result |
|---|---|---|
| Unit/component (wordsearch) | `npx vitest run src/features/templates/wordsearch` | 8 files, 54 tests passed |
| Full unit suite | `npx vitest run` | 33 files, 190 tests passed |
| Production build | `npx next build` | Passed (TS + static generation) |
| Integration/E2E | Not wired until registry merge + play route | Pending integration |
| Manual/browser | Not run in this worktree (registry does not mount yet) | Pending after register |
| Accessibility | Semantic `role=grid` cells, keyboard start/extend/confirm, `aria-live` found announce | Covered in component tests + implementation |
| Visual/audio | Semantic events `wordsearch.trace` / `wordsearch.found` | Emitted; WS10 maps audio |

Include exact failed checks; do not summarize red as green.

## Manual evidence

- Environment and URL: N/A until `registry.register(createWordsearchRegistration())`
- Viewport/device: N/A
- Activity fixture and seed: `wordsearchFixtureSmall` / `fw-wordsearch-small-001`
- Screenshot/trace/artifact path: none
- Observed result: automated tests prove generate → path verify → select → complete

## Known limitations and risks

- Domain `wordsearch.v1` playable schema is A–Z only; non-Latin scripts fail validation/generation with structured errors (by design for v1).
- Product fixture JSON uses `entries`/`mode`; package uses domain `words` shape (fixtures in package are domain-aligned).
- Tap-first/tap-any assisted modes use solution map internally; full Wordwall-parity polish can deepen after shell timer integration.
- Shell timer countdown to game-over is shell-owned; player honors lives/miss and completion.
- No original thumbnail illustration asset yet (`thumbnailKey: "wordsearch"`).
- Visual snapshot / full E2E create-save-play-result waits on registry + route wiring (WS13).

## Recommended next action

- Next step: Integration lead registers `createWordsearchRegistration()` and smoke-tests `/activities/new/wordsearch` + public play with `wordsearchFixtureSmall`.
- Verify by: create activity → Done with 6 farm words → play seed `fw-wordsearch-small-001` → find all → result score = 6.
- Stop before: editing shared registry from this packet again after merge; stop before adding third-party generators without license audit.
