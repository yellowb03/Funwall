# Funwall workstream handoff

## Workstream

- Packet: 10-audio-and-motion
- Branch/worktree: `master` (working tree)
- Source commit: based on `dd513fd` / app tip `eb6f6d3`
- Status: **complete** (merged; optional Safari/headphones ear QA remains)

## Outcome

The public player now has a real premium-leaning sound system: curated CC0 samples (Kenney pizzicato/steel/interface/casino) mapped to every semantic event, with mute **and volume slider** persistence, theme packs, template-scoped preload, concurrency limits, unlock-after-gesture, countdown ticks from the shell timer, and restart/tab-hide cleanup. Shared motion tokens, reduced-motion helpers, and celebration budget ship for templates. Games still only call `audio.emit(event)` — no raw URLs.

## Scope completed

- Semantic audio service (Web Audio buses: master / effects / ambience / voice)
- 20 semantic events × 4 packs (`classic`, `gameshow`, `classroom`, `quiet`)
- 29 curated `.ogg` cues under `public/audio/cues/`
- Mute + **volume HUD slider** + persistence (`localStorage`)
- ThemeKey → pack mapping; **template-scoped preload**
- Dynamic: wheel tick rate, countdown urgency, image-reveal softness, wordsearch trace pitch-by-length, stopAll on restart/tab hide
- Shell-owned **countdown.tick** on countDown timers
- PlayerShell wired to real service (replaces noop)
- Site-wide Button soft press
- Motion tokens, patterns, reduced-motion resolver, celebration budget + CSS variables
- Provenance + THIRD_PARTY_NOTICES + `docs/audio/HUMAN_QA.md`
- Unit tests + browser smoke (Play + Spin + mute; wheel cues network-loaded)

## Files changed

| File/folder | Why |
|---|---|
| `src/services/audio/**` | Engine, packs, prefs, theme map, tests |
| `public/audio/cues/**` | Curated CC0 one-shots |
| `public/audio/licenses/kenney-cc0.txt` | Upstream license |
| `docs/audio/PROVENANCE.md` | Full cue provenance |
| `THIRD_PARTY_NOTICES.md` | Kenney CC0 entry |
| `src/features/player/shell/PlayerShell.tsx` | Real audio + stopAll + pack |
| `src/design-system/motion/**` | Motion system |
| `src/design-system/tokens.css` | Motion CSS vars |
| `src/design-system/index.ts` | Re-export motion |
| `.gitignore` | Ignore `/tmp` scratch packs |
| `PROGRESS.md` | Living log |

## Contract or schema changes

- None to Zod/domain. `SemanticAudioEmitter` unchanged for games.
- Extended runtime surface: `FunwallAudioService` adds volume/pack/preload/stopAll/dispose (optional extras; games keep using base interface).

## Requested integration changes

- **None for package.json** — pure Web Audio, no Howler.
- Optional later: volume slider in HUD; owner profile mute sync; per-template preload list from registry.

## Verification

| Check | Command or method | Result |
|---|---|---|
| Unit/component | `npm test` | **316 passed** |
| Production build | `npm run build` | green (prior WS10 run) |
| Manual/browser | playwright-cli Play→Spin→Mute | **pass** — wheel cues preload (9 files), phase playing, mute toggles |
| Cue HTTP | `/audio/cues/*.ogg` | **200** for core cues |
| Accessibility | mute + volume + reduced-motion | mute hard-silences; volume slider labelled |
| Visual/audio | ear-level classroom matrix | **checklist** in `docs/audio/HUMAN_QA.md` |

## Manual evidence

- Environment: `npm run dev` → `http://localhost:3000/play/demo-wheel`
- Playwright: Play + Spin loaded `ui-press`, `wheel-tick`, `wheel-selected`, feedback/stinger cues; mute → “Unmute”
- Observed result: no PAGEERROR in smoke; human ear matrix still open

## Known limitations and risks

- Full ear QA on headphones / Safari / classroom projector not signed off.
- Matching Pairs / Gameshow not on master — events mapped, light up on merge.
- Scratch `tmp/` gitignored.

## Recommended next action

- Next step: Walk `docs/audio/HUMAN_QA.md` with speakers/headphones; commit WS10.
- Verify by: checklist ticks + one scored game.
- Stop before: Changing game timing to fit cues, or unlicensed samples.

## Ownership claim

- **none** (released)
