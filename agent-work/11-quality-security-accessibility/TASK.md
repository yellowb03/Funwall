# Workstream 11: independent quality, security, accessibility, and performance gate

Recommended model: a skeptical senior QA/security engineer with Playwright, RLS, accessibility, and performance-audit experience.

## Mission

Independently prove that Funwall works as a saved product, not a collection of demos. Build and run the automated/manual matrix, attack authorization and media boundaries, audit accessibility and performance, and produce prioritized evidence-backed findings. Fix only narrow assigned issues; return broad issues to their owner.

## Starts when

Continuously after the foundation baseline. Final audit begins after all six templates are integrated.

## Owned scope

- Cross-feature E2E and visual-regression tests
- Security/RLS/accessibility/performance audit documents
- Test fixtures/builders under the approved shared test boundary
- Narrow QA-owned test infrastructure
- Small fixes explicitly assigned by the integration lead

Do not redesign the product or perform broad refactors without assignment.

## Deliverables

### A. Test matrix

Track every master-plan required journey across:

- Owner vs anonymous.
- Six templates.
- Draft/save/reload/edit/duplicate/delete/restore.
- Search image/upload/reuse/provider failure.
- Public play/disabled link/session/result/leaderboard.
- Keyboard/touch/reduced motion/mute.
- Target viewports and supported browsers.

Each cell records automated/manual, last result, environment, evidence, and owner.

### B. End-to-end suite

- One complete owner-to-public journey per template.
- Network-loss autosave and completion retry.
- Two-owner authorization isolation.
- Public slug disable/regenerate.
- Provider error and upload fallback.
- Refresh/restart/timeout/game-over races.
- Deterministic replay fixtures.
- Soft-delete and restore.

Use stable test IDs only where semantic queries are insufficient. Do not couple tests to fragile DOM nesting.

### C. Security audit

Threat model at minimum:

- Cross-owner IDOR.
- Anonymous activity/result enumeration.
- Tampered score/events.
- Replay/duplicate submission.
- Public slug brute force/leak.
- XSS through title/content/alt/player name/provider metadata.
- CSRF where applicable.
- SSRF/redirect/DNS rebinding in remote media fetch.
- MIME spoof, decompression bomb, EXIF/GPS leak, storage overwrite.
- Rate-limit abuse.
- Secret/service-key exposure.
- RLS gaps and overly broad storage policies.
- Dependency/supply-chain risk.

Run negative tests, not only configuration review.

### D. Accessibility audit

- Automated axe-like checks on all major states.
- Keyboard-only complete creation and play for each template.
- Focus trap/restore, route focus, error focus, and dynamic grid focus.
- Screen-reader announcements at representative states.
- Contrast, zoom 200%, text spacing, touch targets.
- Reduced motion verified functionally.
- Audio-independent information.
- Wordsearch alternative interaction and Wheel result announcement.

Report conformance against WCAG 2.2 AA criteria with severity.

### E. Visual fidelity audit

- Compare implemented shell/template picker/editor to product/reference checklist.
- Review all target viewports.
- Catch generic UI drift: excess pills, large shadows, inconsistent radii, random gradients, mismatched icon styles, spacing, typography.
- Review all game start/play/feedback/result states.
- Keep approved visual snapshots in source; changes require review.

### F. Performance audit

- Public selected-template code splitting.
- Cold and warm owner/player timings.
- Input latency under gameplay.
- Image derivative use.
- Animation frame health.
- Memory/listener/timer cleanup after repeated restarts and route changes.
- 100-item Wheel, 30-pair deck, 100-question quiz editor, maximum Wordsearch, 100-question Image Quiz metadata, and 200-statement True/False stress.

### G. Findings format

Every issue contains:

- Severity P0-P3.
- Exact route/template/state.
- Preconditions and seed/fixture.
- Reproduction steps.
- Expected vs actual.
- Evidence path.
- Likely owning workstream.
- Whether it blocks release.

## Release-blocking criteria

- Any cross-owner/public authorization break.
- Data loss or autosave overwrite.
- Reproducible invalid score/duplicate result acceptance.
- Main flow inaccessible by keyboard or unusable with reduced motion.
- Generator hang/crash.
- Production-only broken create/save/play route.
- Unlicensed/copied asset.
- High-severity dependency finding without mitigation.
- Backup/restore not proven.

## Acceptance criteria

- Required test matrix is green or has explicit accepted exceptions.
- All P0/P1 and release-blocking P2 issues are closed and reverified.
- RLS two-owner/anonymous matrix passes in a production-like Supabase environment.
- Six production E2E journeys pass.
- Accessibility and performance reports cite actual evidence.
- Visual baselines are reviewed, not blindly updated.

## Stop rule

Stop before changing requirements to make tests pass, updating visual baselines without review, or fixing a broad architecture issue inside test code. Escalate release blockers with evidence.

## Copy-ready assignment prompt

> Recommended model: a skeptical senior QA/security engineer. Read the master definition of done, shared contracts, and this packet. Build/run the complete cross-template test matrix, six owner-to-public E2Es, authorization/media/score attacks, WCAG 2.2 AA audit, visual fidelity review, and stress/performance checks. File evidence-backed P0-P3 findings and reverify fixes. Do not weaken tests, update snapshots blindly, or redesign features. Stop release on any listed blocker.

