# Funwall workstream handoff

## Workstream

- Packet: `00-product-and-reference`
- Branch/worktree: main workspace (`C:\Users\Briam\OneDrive\Documentos\Funwall`)
- Source commit: (see git after commit)
- Status: complete

## Outcome

Funwall now has an implementation-ready, clean-room product reference pack: every major screen/state is inventoried, original design tokens/themes/geometry/type/interaction states are specified, a full copy deck exists, canonical small/medium/stress fixtures cover all six templates, and QA has a parity checklist that separates required feel, intentional differences, and prohibited copies. No application code was written and no Wordwall assets were downloaded or copied.

## Scope completed

- Screen and state inventory for login, My Activities (populated/empty/search/filter/trash), template picker, six editors, media modal, owner activity page, public player lifecycle, results/leaderboard, settings
- Design tokens, component geometry (including six original thumbnail concepts as text), four theme boards, typography, interaction + reduced-motion states
- Copy deck for chrome, validation, player instructions, results
- Fixtures: wheel, matching-pairs, gameshow-quiz, wordsearch, image-quiz, true-false × small/medium/stress
- Parity checklist (required / intentional / prohibited)
- Index READMEs under `docs/product` and `docs/references`

## Files changed

| File/folder | Why |
|---|---|
| `docs/product/README.md` | Product pack index |
| `docs/product/screen-inventory.md` | Deliverable A |
| `docs/product/copy-deck.md` | Deliverable C |
| `docs/product/parity-checklist.md` | Deliverable E |
| `docs/product/fixtures/README.md` | Fixture conventions |
| `docs/product/fixtures/wheel.json` | Wheel fixtures |
| `docs/product/fixtures/matching-pairs.json` | Pairs fixtures |
| `docs/product/fixtures/gameshow-quiz.json` | Gameshow fixtures |
| `docs/product/fixtures/wordsearch.json` | Wordsearch fixtures |
| `docs/product/fixtures/image-quiz.json` | Image quiz fixtures |
| `docs/product/fixtures/true-false.json` | True/false fixtures |
| `docs/references/README.md` | Design reference index |
| `docs/references/design-tokens.md` | Token table |
| `docs/references/component-geometry.md` | Geometry + thumbnail concepts |
| `docs/references/themes.md` | Four theme boards |
| `docs/references/typography.md` | Type scale |
| `docs/references/interaction-states.md` | Control/game states |
| `agent-work/00-product-and-reference/HANDOFF.md` | This handoff |

## Contract or schema changes

- None in code. Fixture JSON shapes **propose** content pack layouts aligned to `CONTRACTS.md` families (`list`, `pairs`, `quiz`, `wordsearch`, `imageQuiz`, `statements`) v1.
- Integration lead should freeze fixture IDs and token CSS variable names before visual implementation freeze.
- Identical-pairs fixture uses `"right": { "mirrorOf": "left" }` as a documentation convenience—confirm whether runtime schema stores mirrored materialization or a mirror flag (**propose**: store once + `mode: "identical"`).

## Requested integration changes

- Sign off on fixture IDs/names listed in `docs/product/fixtures/*.json`.
- Sign off on token table in `docs/references/design-tokens.md` and theme semantic keys in `docs/references/themes.md`.
- Map logical `media-fixture-*` asset IDs to test media in the foundation/media harness (not production URLs).
- Resolve **[contract-open]** items called out in screen inventory (listed under Known limitations)—do not invent persistence in activity workstreams.
- None for package.json / registry / routes from this packet.

## Verification

| Check | Command or method | Result |
|---|---|---|
| Baseline/static | Docs-only; no app build | N/A (no application code) |
| Unit/component | N/A | N/A |
| Integration/E2E | N/A | N/A |
| Manual/browser | Structural review of docs against master plan §2–5, §8–10 and CONTRACTS | Pass (content complete) |
| Accessibility | Specs include focus, contrast notes, reduced-motion, live regions | Pass (specified; not runtime-verified) |
| Visual/audio | Thumbnail concepts text-only; no assets downloaded; no Wordwall strings in product copy deck UI | Pass |
| Clean-room scan | Docs reference Wordwall only as research/parity comparator and prohibition lists, not as product branding | Pass |

Failed checks: none for docs scope. Runtime contrast checker and 1440/1024/390 UI verification await implementation (WS01–03 + WS11).

## Manual evidence

- Environment and URL: local docs only
- Viewport/device: specification targets 1440×900, 1024×768, 390×844
- Activity fixture and seed: see `docs/product/fixtures/`
- Screenshot/trace/artifact path: none (no UI built)
- Observed result: deliverable set complete under `docs/`

## Known limitations and risks

- No raster/SVG thumbnail assets were generated; implementers have text concepts in `component-geometry.md` until an illustrator/WS10-adjacent art pass.
- Contrast numbers are approximate; QA must verify with a checker on real CSS.
- **[contract-open] proposals for integration lead** (do not invent in feature agents):
  1. Login invalid-credential field retention policy
  2. Autosave conflict resolution UX details beyond compare-and-swap
  3. Trash permanent-delete in v1 vs retention job only
  4. Share link regenerate/disable exact owner API/UI
  5. Dirty editor navigation guard when local recovery exists
  6. Owner vs public not-found messaging after auth
- Wordsearch stress fixture intentionally includes entries that **should fail validation/placement** for negative tests; not a single playable pack without subsetting.
- Image-quiz stress uses `media-fixture-MISSING-broken` + `simulateBroken` flag for harnesses.
- Theme application rule: owner chrome stays Classic-adjacent; themes primarily affect stage/player—confirm with integration if global owner theming is ever desired.

## Recommended next action

- Next step: Integration lead (WS13) freezes tokens + fixture IDs, then Foundation (WS01) implements shell/auth/dashboard against screen inventory and copy deck while Player shell (WS03) and Wheel (WS04) consume fixtures `wheel-small` / `wheel-medium`.
- Verify by: WS11 runs `docs/product/parity-checklist.md` sections A/C/D applicable to the first wheel vertical slice.
- Stop before: Expanding template count, downloading Wordwall assets, or treating fixture JSON as a substitute for Zod schemas without an ADR.
