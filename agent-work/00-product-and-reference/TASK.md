# Workstream 00: product fidelity and clean-room reference

Recommended model: a design-literate product/UX agent with strong browser inspection and accessibility judgment.

## Mission

Turn the master plan's Wordwall research into implementation-ready, original reference artifacts: screen inventory, design tokens, component states, fixture activities, copy, and parity acceptance criteria. This agent protects the product's soul while preventing copied branding/assets.

## Starts when

Immediately. Finish the shared reference baseline before activity agents begin final visual implementation.

## Owned scope

- `docs/product/**`
- `docs/references/**`
- Original design reference assets under a clearly marked docs-only directory
- Test-fixture content proposals, not runtime fixture code unless assigned

Do not edit application logic, root configuration, shared schemas, or third-party code.

## Required inputs

- [`../../FUNWALL_MASTER_PLAN.md`](../../FUNWALL_MASTER_PLAN.md)
- The two user-supplied screenshots identified in the master plan/research session
- Official Wordwall workflow/template guides linked in the master plan
- [`../shared/CONTRACTS.md`](../shared/CONTRACTS.md)

## Deliverables

### A. Screen and state inventory

Document at least:

- Login.
- My Activities: populated, empty, searching, filtered, trash.
- Template picker: desktop/tablet/phone, search-empty, keyboard focus.
- Each of six editor layouts: blank, partially valid, valid, row error, autosaving, save error.
- Media modal: search, loading, results, no results, rate limited, upload, crop/fit, My images.
- Owner activity page: intro, playing, settings, template switch, result.
- Public player: loading, intro, play, feedback, paused, completed, game over, invalid/disabled link.
- Result review and leaderboard.

For each screen, record primary action, secondary actions, destructive actions, empty/error behavior, and responsive collapse.

### B. Original visual reference

- Formal token table based on the master values.
- Component geometry for template cards, buttons, inputs, progress strip, panels, HUD, tiles, answer buttons, modals, and settings rows.
- Four original theme boards: Classic, TV Game Show, Classroom, High Readability.
- Six original template thumbnails/icons that match the supplied reference's blue/coral illustrative grammar without tracing Wordwall art.
- Typography scale and line-height rules.
- Focus, hover, pressed, disabled, loading, correct, and incorrect states.
- Reduced-motion substitutions.

### C. Copy deck

- Template names and one-sentence descriptions.
- Empty states and helper text.
- Field labels/placeholders.
- Validation and provider errors in plain language.
- Confirmation language for delete, restore, conversion, link reset, and abandon draft.
- Player instructions for all six games.
- Result/review copy.

### D. Canonical fixtures

Create small, medium, and stress fixture definitions for every template. Use harmless classroom content and stable IDs/names.

Minimum fixture coverage:

- Wheel: 6 text items; 12 mixed text/image items; 100-item label stress case.
- Pairs: 6 related pairs; identical image pairs; 30-pair stress case.
- Gameshow: 6 questions exercising 2, 4, and 6 answers; images; all lifelines; game over.
- Wordsearch: clues/no clues, diagonal/reverse, accents, long-word failure, non-Latin policy example.
- Image Quiz: landscape/portrait/square images; early buzz; no buzz; broken image.
- True/False: balanced set, imbalanced warning, long statements, repeat-until-time.

### E. Parity checklist

Create a visual/behavioral comparison checklist that QA can use without requiring exact screenshots of a signed-in Wordwall account. It must separate:

- Required experiential parity.
- Intentional Funwall differences.
- Prohibited copied elements.

## Acceptance criteria

- An implementer can build every screen/state without inventing missing copy or layout hierarchy.
- No reference artifact includes Wordwall logos, proprietary template art, or copied sound files.
- Template cards visibly echo the user's supplied references: split icon/copy layout, pale-blue icon pane, thin border, compact description, three-column desktop grid.
- The four themes have sufficient token coverage for all six games.
- Fixture content exposes algorithmic and responsive edge cases, not only happy paths.
- Accessibility states are specified alongside default states.
- The integration lead signs off on the fixture names/IDs and tokens.

## Verification

- Review at 1440 x 900, 1024 x 768, and 390 x 844.
- Verify text contrast with an automated checker.
- Verify every interactive component state has keyboard focus treatment.
- Search original assets for embedded Wordwall names/logos and reject any match.
- Have the QA agent run the parity checklist against the first wheel vertical slice.

## Handoff

Use [`../shared/HANDOFF_TEMPLATE.md`](../shared/HANDOFF_TEMPLATE.md). Include direct paths to the state inventory, token spec, fixtures, and parity checklist.

## Stop rule

Stop before producing application code, downloading Wordwall assets, or expanding the template list. If a screen depends on an unresolved domain contract, propose the missing state to the integration lead instead of inventing persistence behavior.

## Copy-ready assignment prompt

> Recommended model: a design-literate product/UX agent with browser inspection. Read `FUNWALL_MASTER_PLAN.md`, `agent-work/shared/CONTRACTS.md`, and this packet completely. Produce the clean-room screen/state inventory, original visual reference, copy deck, fixtures, and parity checklist under `docs/`. Do not implement application code or copy Wordwall assets. Verify the reference at desktop, tablet, and phone widths. Hand off using the shared template. Stop if a missing shared contract would force you to invent backend behavior.

