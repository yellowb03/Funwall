# Workstream 13: integration lead and architecture owner

Recommended model: the strongest available senior full-stack coding/architecture model with repo-wide context and browser verification.

## Mission

Own the system boundaries and delivery outcome across all agents. Freeze contracts, sequence work, maintain the central registry/config/dependency graph, review handoffs, integrate in safe order, resolve collisions, run full verification after every merge, and prevent a set of individually attractive games from becoming an incoherent product.

This is a continuous role, not a final cleanup pass.

## Starts when

Immediately.

## Owned scope

- Shared contracts and architecture decision records.
- Root package/lock/config/environment example.
- Central template registry and route assembly.
- Shared domain schema/version/conversion interfaces.
- Global design tokens after product-reference signoff.
- Migration ordering and cross-workstream seed assembly.
- Integration branch/log and release gate.
- Narrow merge-conflict fixes and explicitly assigned gaps.

The lead should not absorb a full activity packet unless an agent is unavailable and the work is formally reassigned.

## Phase 1: orient and freeze

### A. Repository baseline

- Confirm workspace/branch/git state.
- Read master plan and every shared document.
- Create `docs/adr/` and an integration status document.
- Record toolchain, commands, environments, and current dirty changes.

### B. Architecture decisions to record before broad implementation

1. Compatible package versions and lockfile policy.
2. Next.js/Supabase environment strategy.
3. Code-level content-family schema location and versioning.
4. Template registration/lazy loading API.
5. Activity revision/autosave conflict protocol.
6. Public snapshot/session/result validation boundary.
7. Seeded RNG algorithm/serialization.
8. Timer/pause/visibility rule.
9. Media provider storage/hotlink/attribution strategy.
10. Third-party component/license approval process.

### C. Contract harnesses

- Code-level schemas and fixture builders.
- Fake editor adapter.
- Fake player adapter.
- Registry contract tests.
- Migration/compatibility tests.
- One canonical fixture per content family from Workstream 00.

Exit: downstream agents can compile/test against stable contracts without editing shared files.

## Phase 2: manage Milestone 1

Coordinate Foundation, Editor/Media, Player Shell, and Wheel.

- Approve their exact file ownership.
- Add dependencies centrally when justified.
- Merge in order: foundation -> editor -> player -> wheel.
- After each merge run static/unit/build; after Wheel run the real E2E.
- Do not unlock five activity agents until the deployed saved-wheel vertical slice passes.

Vertical-slice gate:

1. Owner signs in.
2. Picks Wheel.
3. Creates valid content and adds an image.
4. Autosave survives reload.
5. Done creates activity page.
6. Public link plays without owner auth.
7. Spin/eliminate/restart work.
8. No leaderboard appears.
9. Delete disables public link; restore follows policy.
10. Preview deployment passes the same journey.

## Phase 3: parallel activity integration

### Merge order recommendation

1. Matching Pairs.
2. Gameshow Quiz and approved quiz primitives.
3. True/False.
4. Image Quiz after quiz/media interfaces are merged.
5. Wordsearch after generator property tests pass.

For each template:

- Review changed files for ownership violations first.
- Verify no central registry/config edits slipped in.
- Run packet tests on branch.
- Merge registration centrally.
- Run full suite.
- Run its creation/public-play/result E2E.
- Inspect target visual states in browser.
- Update integration log and unlock dependents.

## Phase 4: sensory, QA, and release

- Merge audio/motion only after semantic event review.
- Ensure every cue has provenance.
- Route QA findings to owning workstream; avoid a giant unreviewed fix branch.
- Reject blind visual snapshot updates.
- Coordinate deployment agent's production gates.
- Mark release ready only when master definition of done and QA release blockers are satisfied.

## Central registry responsibilities

- Register exactly six templates.
- Enforce unique keys and lazy loaders.
- Validate capability flags.
- Ensure every content/settings version has a migration path.
- Build compatibility matrix and conversion-preview routing.
- Prove Wheel cannot accidentally receive leaderboard UI.
- Prove invalid public snapshots fail before player import.
- Keep registry free of template internals.

## Dependency policy

Before adding a runtime dependency, record:

- Problem it solves.
- Native/smaller alternatives considered.
- License and version.
- Bundle/runtime impact.
- Server/client boundary.
- Security/maintenance signal.
- Adapter/replacement plan.

No unlicensed clone is a dependency or code source. Maintain `THIRD_PARTY_NOTICES.md` from the first approved reuse.

## Review checklist for every handoff

- Outcome matches packet, no scope creep.
- Only owned files changed or overlap pre-approved.
- Contract changes explicitly listed.
- No copied/unlicensed assets/code.
- Tests include unhappy paths/races, not only screenshots.
- Real browser/manual evidence exists.
- Accessibility/reduced motion included.
- Cleanup for timers/listeners/audio/resources.
- Determinism/replay preserved.
- One next action and stop rule supplied.

## Integration status document

Maintain a repo-local table with:

- Workstream/owner/branch/status.
- Contract version consumed.
- Last rebased integration commit.
- Tests last run/result.
- Open contract requests.
- Merge commit.
- Downstream unlocks.
- Known risk/owner.

## Acceptance criteria

- Shared contracts are singular; no duplicated schema/registry/timer/audio implementations.
- Milestone 1 passes before broad game parallelism.
- Every merged template passes its packet suite plus full integration suite.
- Central package/config/migrations remain coherent.
- Public bundle lazy-loads only selected template.
- All third-party use is licensed/documented.
- Master definition of done is proven on production.
- Final handoff identifies exact release, migrations, monitoring, rollback, and next optional milestone.

## Stop rule

Do not declare completion because branches merged or the build is green. Stop only when production journeys and release gates pass. Conversely, do not silently broaden the product beyond the six-template contract; record future ideas separately.

## Copy-ready assignment prompt

> Recommended model: the strongest senior full-stack architecture/coding model available. You are Funwall's integration lead. Read `FUNWALL_MASTER_PLAN.md`, all shared contracts, and this packet. Freeze ADR-backed schemas/registry/autosave/public-session/RNG/timer/media contracts, assign file ownership, and maintain the integration board. Complete the deployed saved-Wheel vertical slice before unlocking parallel activities. Merge each packet in dependency order, run full tests and real browser E2Es after every integration, centralize dependencies/registry/migrations, enforce licenses, route QA fixes, and gate production on the master definition of done. Do not declare success on a green build alone or expand beyond six templates.

