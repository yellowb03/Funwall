# Funwall multi-agent execution map

This folder turns the master plan into compartmentalized work packets. It is designed for Codex, Claude Code, or another capable coding agent working alone, in parallel branches, or in isolated worktrees.

Read first:

1. [`../FUNWALL_MASTER_PLAN.md`](../FUNWALL_MASTER_PLAN.md)
2. [`shared/CONTRACTS.md`](shared/CONTRACTS.md)
3. The assigned workstream's `TASK.md`
4. [`shared/HANDOFF_TEMPLATE.md`](shared/HANDOFF_TEMPLATE.md) before handing work back

## 1. Non-negotiable coordination rules

1. One workstream owns one bounded folder set.
2. One branch or worktree per active agent.
3. Shared contracts are frozen before activity agents start.
4. Agents do not edit another workstream's owned files without the integration lead assigning the overlap.
5. Only the integration lead merges changes to the template registry, shared schemas, app-wide routes, package manifest, lockfile, root configuration, and final database migration ordering.
6. Every workstream returns tests, evidence, and a handoff; `build passes` without a real workflow check is insufficient.
7. No agent copies source or assets from an unlicensed Wordwall clone.
8. No agent expands the six-template scope.
9. If a contract is missing, the agent writes a proposed change and stops at the boundary rather than inventing a private incompatible version.
10. A workstream is not complete while required verification remains red or unperformed.

## 2. Workstream index

| ID | Packet | Primary responsibility | Starts after |
|---|---|---|---|
| 00 | [`00-product-and-reference/TASK.md`](00-product-and-reference/TASK.md) | Product fidelity, original visual reference, fixture content, acceptance language | Immediately |
| 01 | [`01-foundation-and-data/TASK.md`](01-foundation-and-data/TASK.md) | App shell, auth, database, storage, dashboard, schemas, RLS | Contracts reviewed |
| 02 | [`02-editor-and-media/TASK.md`](02-editor-and-media/TASK.md) | Shared editor, autosave, image search/upload/library | Foundation interfaces frozen |
| 03 | [`03-player-shell/TASK.md`](03-player-shell/TASK.md) | Shared player lifecycle, HUD, sessions, results plumbing | Foundation interfaces frozen |
| 04 | [`04-spin-wheel/TASK.md`](04-spin-wheel/TASK.md) | Wheel editor adapter and player | Shared editor/player mocks ready |
| 05 | [`05-matching-pairs/TASK.md`](05-matching-pairs/TASK.md) | Matching pairs editor adapter and player | Shared editor/player mocks ready |
| 06 | [`06-gameshow-quiz/TASK.md`](06-gameshow-quiz/TASK.md) | Quiz primitives, Gameshow editor/player, lifelines/bonus | Shared editor/player mocks ready |
| 07 | [`07-wordsearch/TASK.md`](07-wordsearch/TASK.md) | Generator, editor adapter, wordsearch player | Shared editor/player mocks ready |
| 08 | [`08-image-quiz/TASK.md`](08-image-quiz/TASK.md) | Image reveal quiz editor/player | Quiz contract + media interfaces ready |
| 09 | [`09-true-false/TASK.md`](09-true-false/TASK.md) | Statement editor/player | Shared editor/player mocks ready |
| 10 | [`10-audio-and-motion/TASK.md`](10-audio-and-motion/TASK.md) | Semantic audio service, original cues, motion/reduced motion | Player events frozen |
| 11 | [`11-quality-security-accessibility/TASK.md`](11-quality-security-accessibility/TASK.md) | Independent QA, security, RLS, accessibility, performance | Continuous; final audit after integration |
| 12 | [`12-deployment-and-release/TASK.md`](12-deployment-and-release/TASK.md) | Environments, CI, deployment, monitoring, backup, release | Foundation preview first; final after QA |
| 13 | [`13-integration-lead/TASK.md`](13-integration-lead/TASK.md) | Contracts, sequencing, registry, dependency arbitration, merges, release gate | Immediately and continuously |

## 3. Recommended workflow: five active agents

This is the safest useful parallel plan.

### Wave 0: one short alignment pass

- Agent A: Integration lead (13).
- Agent B: Product and reference (00).
- Other agents wait or inspect only.

Exit condition: shared contracts, fixture activities, tokens, and file ownership are committed.

### Wave 1: vertical-slice foundation

- Agent A: Integration lead.
- Agent B: Foundation and data (01).
- Agent C: Editor and media (02), initially against agreed mocks.
- Agent D: Player shell (03), initially against agreed mocks.
- Agent E: Spin wheel (04), initially as a pure template package.

Merge order: 01 -> 02 -> 03 -> 04 -> integration fixes.

Exit condition: deployed create/save/reload/public-play wheel flow passes E2E.

### Wave 2: game expansion

- Agent A: Integration lead.
- Agent B: Matching pairs (05).
- Agent C: Gameshow quiz (06).
- Agent D: Wordsearch (07).
- Agent E: True/false (09).

Image Quiz waits until Gameshow's quiz-family contract and media adapter are merged. When one agent finishes, assign Image Quiz (08).

Exit condition: all six template packages pass isolated tests and integrate one at a time.

### Wave 3: sensory and hardening

- Agent A: Integration lead.
- Agent B: Audio and motion (10).
- Agent C: Quality/security/accessibility (11).
- Agent D: Deployment and release (12).
- Agent E: Fixes the highest-priority issues assigned by the integration lead; it does not self-select broad refactors.

Exit condition: production definition of done passes.

## 4. Three-agent workflow

Use this if concurrency is limited.

| Wave | Agent 1 | Agent 2 | Agent 3 |
|---|---|---|---|
| 0 | Integration lead + product reference | Foundation/data | Inspect contracts only |
| 1 | Integration | Editor/media | Player shell + wheel |
| 2 | Matching pairs | Gameshow + Image Quiz | Wordsearch + True/False |
| 3 | Integration fixes | Audio/motion | QA/security/deployment |

The combined packets in Wave 2 remain sequential within each agent. Do not develop Gameshow and Image Quiz simultaneously inside one working tree.

## 5. Maximum-parallel workflow

Do not use this before Milestone 1. After the vertical slice, up to eight bounded agents can work safely:

- One integration lead.
- Five independent activity agents: Pairs, Gameshow, Wordsearch, True/False, Image Quiz.
- One audio/motion agent.
- One QA agent.

The editor/media and player-shell owners become reviewers/contract maintainers rather than continuing large feature changes during this wave.

## 6. Solo workflow

Run packets in this order:

`13 -> 00 -> 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 08 -> 09 -> 07 -> 10 -> 11 -> 12 -> 13 final gate`

Wordsearch is placed after the quiz templates in the solo order because it needs the most algorithm-specific testing and should not delay proving the general activity architecture.

## 7. Planned file ownership

The application does not exist yet, so these are target boundaries. The integration lead records any approved adjustment in an architecture decision record.

| Workstream | May own | Must not merge directly |
|---|---|---|
| 00 Product/reference | `docs/product/**`, `docs/references/**`, original design reference assets | Application logic |
| 01 Foundation/data | `src/features/activities/**`, `src/services/db/**`, `supabase/**`, auth/dashboard routes | Template internals; final registry |
| 02 Editor/media | `src/features/editor/**`, `src/features/media/**`, media endpoints | Template players; shared schemas without approval |
| 03 Player shell | `src/features/player/**`, `src/features/results/**`, session endpoints | Template internals; audio cue implementation |
| 04-09 Activity agents | Only their `src/features/templates/<template>/**` folder and colocated tests/stories | Root registry, package files, another template |
| 10 Audio/motion | `src/services/audio/**`, shared motion tokens, original audio assets | Game scoring/state logic |
| 11 QA/security | Test suites, audit reports, narrowly approved fixes | Product changes disguised as QA |
| 12 Deployment | CI/deployment/monitoring/runbook files | Domain logic |
| 13 Integration | Shared contracts, registry, package/lock, root config, route assembly, merge fixes | Large template implementation unless reassigned |

## 8. Shared-file lock list

Only the integration lead edits these while multiple agents are active:

- `package.json` and lockfile.
- Root TypeScript, lint, test, build, and framework configuration.
- Environment example file.
- Central template registry.
- Shared domain schemas and version migrations.
- Root layout/navigation and route assembly.
- Migration ordering and seed entrypoint.
- Global design tokens.
- Third-party notices.

An activity agent that needs a dependency writes it in its handoff under **Requested integration changes** and continues using an adapter/mock when possible.

## 9. Branch, commit, and merge convention

- Branch prefix: `codex/`.
- Branch examples: `codex/funwall-wheel`, `codex/funwall-editor-media`.
- One logical change per commit.
- Commit message form: `<workstream>: <outcome>`.
- Rebase or merge the current integration branch before final verification.
- Do not force-push a branch another agent is consuming.
- Do not bypass red tests to make a merge easier.
- Integration lead merges in dependency order, runs the full suite after each template, and records the source commit in the integration log.

## 10. Agent start protocol

Before editing, every agent must:

1. Confirm it is in the correct repository/worktree and branch.
2. Read the master plan, shared contracts, and its task packet.
3. Inspect the current code and existing tests instead of trusting the plan's target paths blindly.
4. Report existing dirty files; preserve unrelated user changes.
5. State its owned paths and dependencies in its first progress update.
6. Run the smallest existing verification command to establish a baseline.
7. If a required contract is unavailable, work behind a local adapter or stop with a precise contract request.

## 11. Integration protocol for a completed packet

1. Agent completes the handoff template.
2. Integration lead reviews scope and changed files before reading implementation details.
3. Required packet tests run on the agent branch.
4. Integration lead merges/cherry-picks into the integration branch.
5. Full domain + component suite runs.
6. The workstream's E2E journey runs.
7. Visual snapshots are reviewed when UI changed.
8. Integration lead updates the dependency board and unlocks downstream work.
9. Only then is the workstream marked complete.

## 12. Conflict protocol

When two agents need the same shared file:

1. Stop editing that shared file.
2. Each agent states the minimum contract change it needs.
3. Integration lead chooses one interface and updates the shared contract.
4. Agents rebase and adapt their owned folders.
5. Do not solve the conflict with duplicated registries, copied schemas, or template-specific global state.

## 13. What a good agent handoff contains

- Outcome, not a diary.
- Exact changed files.
- Contract/API changes.
- Test commands and results.
- Manual verification with device/viewport.
- Screenshots or trace paths when visual behavior changed.
- Known limitations and risks.
- Requested integration changes.
- One recommended next action.
- Explicit stop rule: what the next agent must not do yet.

Use [`shared/HANDOFF_TEMPLATE.md`](shared/HANDOFF_TEMPLATE.md).

