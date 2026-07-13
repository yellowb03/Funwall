# Funwall shared implementation contracts

Status: planning baseline. The integration lead converts these into code-level types and an ADR before activity agents merge implementation.

These contracts prevent each template from inventing a different editor, timer, result format, or media model.

## 1. Stability levels

- **Frozen:** agents may implement against it; changes require an ADR and integration-lead approval.
- **Provisional:** shape is agreed, names/details may change before Milestone 1 exits.
- **Template-owned:** activity agent may define it inside its folder as long as it does not leak globally.

## 2. Frozen product contracts

1. Six template keys: `wheel`, `matching-pairs`, `gameshow-quiz`, `wordsearch`, `image-quiz`, `true-false`.
2. One saved activity has one selected template, one versioned content pack, one settings object, and one theme key.
3. Owner routes require authentication; public play uses an unguessable slug and no player account.
4. Autosave accepts incomplete drafts; Done requires a playable content pack.
5. Game-affecting randomness is seeded.
6. Wheel is unscored and has no leaderboard.
7. No template imports another template's internal code.
8. Games emit semantic audio events; they do not play files directly.
9. A public player receives a sanitized immutable activity snapshot for that session.
10. Every scored game can reconstruct its result from snapshot + seed + ordered actions.

## 3. Content families

Each pack has `family`, `version`, stable item IDs, and template-specific payload. Rich content is bounded: text, optional image reference, optional audio reference, and accessibility metadata. It never contains arbitrary HTML.

| Family | Version | Native template | Minimum playable content |
|---|---:|---|---|
| `list` | 1 | Wheel | 2 non-empty items |
| `pairs` | 1 | Matching pairs | 2 complete pairs |
| `quiz` | 1 | Gameshow quiz | 1 question, 2-6 answers, exactly one correct |
| `wordsearch` | 1 | Wordsearch | 2 unique normalized words that fit policy |
| `imageQuiz` | 1 | Image quiz | 1 question, reveal image, 2-6 answers, exactly one correct |
| `statements` | 1 | True/False | 2 statements with explicit boolean values |

All schemas reject unknown version numbers until a migration exists.

## 4. Rich-content contract

Logical fields:

- `text`: plain Unicode text, bounded by the containing template.
- `imageAssetId`: owner media reference, never an arbitrary client URL.
- `imageAlt`: required when an image is present.
- `imageFit`: `contain` or `cover`.
- `focalPoint`: normalized x/y in the 0-1 range.
- `audioAssetId`: optional owner media reference.
- `audioLabel` or transcript: required when audio is present.

At least one meaningful content channel must exist when a field is required.

## 5. Template registration contract

The central registry consumes a template-owned registration that provides:

- Stable key, display name, description, and original thumbnail.
- Accepted content family/version.
- Draft schema and playable schema.
- Settings schema/version/defaults/migration.
- Editor adapter and player adapter loaded lazily.
- Result-review adapter for scored games.
- Compatibility/conversion descriptors.
- `isScored` and `hasLeaderboard` capabilities.
- Owner/player feature flags such as images, audio, fullscreen.

Activity agents export a registration factory from their folder. They do not edit the central registry.

## 6. Player input contract

Each player receives:

- Sanitized activity snapshot.
- Validated template-specific content.
- Validated template-specific settings.
- Resolved theme tokens.
- Seeded RNG interface.
- Clock/timer interface.
- Semantic audio emitter.
- Session event emitter.
- Lifecycle callbacks: ready, pause-safe state, complete, game over, fatal error.
- Shared commands/state: muted, fullscreen, reduced motion, restart requested.

The player does not query the database directly.

## 7. Player lifecycle

Shared states:

`loading -> ready -> playing -> paused -> feedback -> playing -> completed | gameOver -> review`

Template-owned sub-states live inside `playing` and `feedback`. The shell must be able to pause timers and reject input during loading, transitions, feedback locks, completion, and game over.

## 8. Session event envelope

Every event includes:

- Session ID.
- Monotonic client sequence number.
- Event type.
- Activity revision and template version through session context, not repeated unboundedly.
- Monotonic elapsed time from session start.
- Relevant stable item/question/pair ID.
- Bounded validated metadata.

Common events:

- `session.started`
- `game.ready`
- `game.paused`
- `game.resumed`
- `item.presented`
- `answer.submitted`
- `answer.resolved`
- `lifeline.used`
- `bonus.resolved`
- `game.completed`
- `game.over`
- `session.abandoned`

Template-specific events use the template prefix and remain reconstructable. Do not log animation frames, raw keystrokes, entire content packs, or secrets.

## 9. Result contract

Common result fields:

- Session ID and template key/version.
- Activity ID/revision.
- Seed.
- Status: completed, game over, abandoned, invalid.
- Score or null for Wheel.
- Correct, incorrect, unanswered counts where applicable.
- Accuracy or null.
- Duration.
- Template detail object with a version.
- Completion timestamp.

Server-side validation recalculates or sanity-checks the result from the event log. Leaderboard accepts only completed, valid, scored sessions.

## 10. Timer contract

- Clock uses a monotonic time source for elapsed calculations.
- Modes: none, count up, count down.
- Browser tab visibility does not freeze real elapsed time unless the shell intentionally pauses and records a pause event.
- Timeout resolution is idempotent.
- Template code subscribes to time values/events; it must not create unmanaged intervals.
- Reduced update frequency is allowed when the display only needs whole seconds.

## 11. Seeded RNG contract

- One seed per play session.
- Derivable named streams are preferred: `contentOrder`, `board`, `bonus`, `visual`.
- Game-affecting selections never use `Math.random` directly.
- Stored seed representation is stable across server and browser implementations.
- Tests include known seed/output vectors.

## 12. Semantic audio contract

Games emit named events with small optional parameters such as intensity or rate. Baseline names:

- `ui.press`
- `countdown.tick`
- `answer.correct`
- `answer.incorrect`
- `game.complete`
- `game.over`
- `wheel.tick`
- `wheel.selected`
- `pairs.flip`
- `pairs.match`
- `pairs.miss`
- `gameshow.lifeline`
- `gameshow.bonusStart`
- `gameshow.bonusReward`
- `wordsearch.trace`
- `wordsearch.found`
- `imageQuiz.reveal`
- `imageQuiz.buzzer`
- `trueFalse.enter`
- `trueFalse.resolve`

The audio service maps semantic events to theme packs, enforces mute/volume/concurrency, and handles browser unlock.

## 13. Editor adapter contract

Each template editor adapter receives:

- Current typed draft.
- Stable row mutation helpers: add, update, reorder, duplicate, delete.
- Shared RichContentField.
- Shared media modal opener with a precise target descriptor.
- Validation results.
- Dirty-state callback.
- Template limits and helper copy.

It returns editor fields only. It does not render title, progress strip, autosave status, Done, global dialogs, or owner navigation.

## 14. Autosave contract

- Client draft has a base revision.
- Server save is compare-and-swap on revision or equivalent optimistic concurrency.
- Success returns the authoritative next revision and update timestamp.
- Conflict never overwrites the newer server version silently.
- Local recovery stays until the latest dirty revision is acknowledged.
- Done flushes current draft, runs playable validation, marks the version finalized, and navigates only after acknowledgment.

## 15. Media adapter contract

Provider-neutral search result fields:

- Provider and provider asset ID.
- Thumbnail URL.
- Candidate use URL/derivatives.
- Width/height.
- Title/alt candidate.
- Creator name and URL.
- Source page URL.
- License and license URL.
- Attribution text.
- Provider-specific selection/download callback token when required.

Provider adapters never leak API credentials. A media asset is inserted into content only after the server records the legal/source metadata and returns an owner-scoped asset ID.

## 16. Settings contract

- Every template settings object has a `version`.
- Defaults are pure data and deterministic.
- Draft settings may be incomplete; applied settings must validate.
- Owner may apply to one activity, save as personal default, revert to personal default, or revert to template default.
- Player session stores the applied settings snapshot so later owner changes do not mutate an active result.

## 17. Theme contract

Themes provide semantic tokens, not template-specific CSS selectors:

- Shell/stage background and frame.
- Surface, text, muted text, border.
- Primary, secondary, accent.
- Correct, incorrect, warning.
- Wheel palette.
- Card/tile back and front.
- Answer-button palette.
- Typography keys.
- Decorative asset set/intensity.
- Audio pack key.

Templates must remain usable if only baseline semantic tokens exist.

## 18. Error contract

Errors are classified as:

- Validation: owner can fix content/settings.
- Recoverable network/provider: retry or alternate path.
- Missing/corrupt media: show fallback and owner repair action.
- Authorization/not found: generic public response; detailed owner response only after auth.
- Fatal player invariant: stop session as invalid, show restart, record bounded diagnostic ID.

Do not display stack traces, provider secrets, SQL, or raw payloads.

## 19. Contract change procedure

1. Write a short ADR with problem, options, decision, migrations, and affected workstreams.
2. Integration lead reviews with every downstream owner.
3. Update this file and code-level types in one integration commit.
4. Add compatibility tests/migrations.
5. Notify active agents before they rebase.

