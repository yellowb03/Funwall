# Funwall launch audio — provenance

**Workstream:** 10  
**Policy:** Clean-room. No Wordwall assets, melodies, or recordings.  
**License filter:** Only CC0 / public-domain samples redistributed in-repo.

## Decision summary

| Choice | Decision |
|---|---|
| Playback engine | **Web Audio API** (no Howler dependency for v1) |
| Asset format | **Ogg Vorbis** (`.ogg`) short one-shots |
| Sprite | **No giant sprite** — independent files for preload/error isolation |
| Packs | `classic` · `gameshow` · `classroom` · `quiet` |
| Default volume | **0.72** master (classroom-safe) |
| Source library | **Kenney** CC0 packs (curated subset) |

## Source packs (upstream)

All Kenney assets: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).  
Author: Kenney Vleugels ([kenney.nl](https://kenney.nl)).

| Pack | URL | Role in Funwall |
|---|---|---|
| Interface Sounds | https://kenney.nl/assets/interface-sounds | UI click, ticks, errors, confirmations, glass plinks, buzzer |
| UI Audio | https://kenney.nl/assets/ui-audio | Soft alternate clicks (classroom/quiet) |
| Digital Audio | https://kenney.nl/assets/digital-audio | Lifeline / activation sweeps |
| Casino Audio | https://kenney.nl/assets/casino-audio | Card slides (pairs/true-false), dice shake (bonus suspense) |
| RPG Audio | https://kenney.nl/assets/rpg-audio | Soft book flip alternate |
| Music Jingles | https://kenney.nl/assets/music-jingles | Pizzicato / steel / hit stingers (correct, complete, wheel selected, rewards) |

Upstream license text is copied to `public/audio/licenses/kenney-cc0.txt`.

## Cue inventory

Files live in `public/audio/cues/`. Mapping is owned by `src/services/audio/cue-packs.ts`.

| Semantic event | Classic file | Character | Target duration (spec) |
|---|---|---|---|
| `ui.press` | `ui-press.ogg` | Soft plastic click | 40–80 ms |
| `countdown.tick` | `countdown-tick.ogg` (+ urgent alt) | Neutral / urgent tick | 40–100 ms |
| `answer.correct` | `answer-correct.ogg` (pizzicato) | Bright rising sparkle | 220–400 ms |
| `answer.incorrect` | `answer-incorrect.ogg` | Soft non-punitive error | 250–450 ms |
| `game.complete` | `game-complete.ogg` (pizzicato) | Celebratory sting | 900–1800 ms |
| `game.over` | `game-over.ogg` | Gentle descend | 500–900 ms |
| `wheel.tick` | `wheel-tick.ogg` | Dry high tick | 20–40 ms |
| `wheel.selected` | `wheel-selected.ogg` | Short fanfare | 400–700 ms |
| `pairs.flip` | `pairs-flip.ogg` | Card slide | 90–160 ms |
| `pairs.match` | `pairs-match.ogg` | Confirmation sparkle | 250–450 ms |
| `pairs.miss` | `pairs-miss.ogg` | Soft drop thunk | 180–320 ms |
| `gameshow.lifeline` | `gameshow-lifeline.ogg` | Activation sweep | 250–500 ms |
| `gameshow.bonusStart` | `gameshow-bonus-start.ogg` | Suspense dice shake | 700–1500 ms layered |
| `gameshow.bonusReward` | `gameshow-bonus-reward.ogg` | Steel reward sting | 700–1500 ms |
| `wordsearch.trace` | `wordsearch-trace.ogg` | Quiet switch | continuous soft |
| `wordsearch.found` | `wordsearch-found.ogg` | Bright resolve | 250–500 ms |
| `imageQuiz.reveal` | `image-reveal.ogg` | Very quiet glass plink | 20–60 ms |
| `imageQuiz.buzzer` | `image-buzzer.ogg` | Tactile bong | 120–250 ms |
| `trueFalse.enter` | `truefalse-enter.ogg` | Airy card slide | 120–300 ms |
| `trueFalse.resolve` | `truefalse-resolve.ogg` | Soft select | with feedback |

### Theme variants (file swaps / gain)

| Pack | Differences |
|---|---|
| **gameshow** | Steel jingles for correct/complete; hit sting for wheel selected; slightly hotter gains |
| **classroom** | Soft UI click, pluck correct, soft complete, book-flip pairs, lower peaks (~0.82×) |
| **quiet** | Classroom base × ~0.72, softest ticks/reveals/traces |

## Dynamic behaviour (engine)

| Behaviour | Implementation |
|---|---|
| Wheel tick rate | `params.rate` + intensity scale gain/rate; class concurrency max 8; min interval ~18 ms |
| Countdown urgency | `intensity ≥ 0.85` → `countdown-urgent.ogg` (classic/gameshow) without double volume |
| Image reveal sparsity | Pack `minIntervalMs: 70` + low gain; games also throttle client-side |
| Bonus stop on restart | `stopAll()` from PlayerShell `disposeRuntime` |
| Mute | Master gain → 0 + stop active voices immediately; persisted `funwall.audio.muted` |
| Unlock | First Play gesture → `AudioContext.resume` + silent buffer (iOS) |
| Preload | Current pack files only after Play / mount |

## Mix notes (human QA targets)

- Laptop speakers at 25% / 50% / 100% system volume without clipping on rapid wheel ticks.
- Headphones: no harsh peaks on steel/pizzicato stingers; incorrect remains soft.
- Classroom projector: default 0.72 master + pack gains leave headroom.
- Mute before and during play silences all **new** cues immediately.
- Audio never conveys information unavailable visually.

## What we deliberately avoided

- Wordwall or unlicensed clone rips.
- 8-bit NES jingles as default (too “codey”); pizzicato/steel chosen for premium classroom feel.
- Mixkit redistribution (license restricts rehosting without significant transformation).
- Howler dependency for v1 (Web Audio is enough; Howler remains optional later).

## Replacement plan

To remove Kenney samples: replace files under `public/audio/cues/` with original recordings of similar envelope, keep semantic event names and `cue-packs.ts` keys stable.
