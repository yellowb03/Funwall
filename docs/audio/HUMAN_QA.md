# Audio human sensory QA checklist (WS10)

Run with `npm run dev` → `/play/demo-wheel` and one scored template (wordsearch / image-quiz / true-false).

## Pass criteria

| Check | How | Pass if |
|---|---|---|
| Unlock | Click **Play** | No autoplay error toast; soft UI click after gesture |
| Wheel ticks | Spin demo wheel | Dry ticks follow speed; no clipping/noise wall |
| Wheel select | Wait for stop | Short pizzicato/fanfare, not harsh |
| Volume | HUD slider 20% / 50% / 100% | Peaks stay classroom-safe; slider persists after reload |
| Mute mid-play | Mute during spin | Immediate silence of new cues; unmute restores |
| Restart | Restart while spin/stinger | No lingering loops |
| Tab hide | Switch tabs mid-game | Loops/stingers stop |
| Correct/incorrect | Scored game answers | Bright vs soft non-punitive; never confusing |
| Image reveal | Image Quiz | Sparse plinks, not a rain of noise |
| Wordsearch drag | Drag a long line | Soft pitch rise only — no “correct” timbre before resolve |
| Reduced motion | OS reduce-motion on | Game still playable; no required audio-only info |
| Headphones | Safe level | No ear fatigue on rapid ticks |

## Browser matrix (minimum)

- [x] Chrome (desktop) — automated playwright-cli smoke 2026-07-14 (`/play/demo-wheel` Play→Spin→Mute; 9 wheel cues loaded)
- [ ] Safari or iOS Safari (unlock path) — **needs human**
- [ ] Firefox or Edge — **needs human**

## Automated smoke already covered

| Check | Result (2026-07-14) |
|---|---|
| Cue HTTP 200 | `ui-press`, `wheel-tick`, `answer-correct`, `game-complete` |
| Play unlock path | phase → `playing`; no PAGEERROR |
| Template preload | wheel pack files requested after Play |
| Mute toggle | HUD shows Unmute after mute |
| Volume HUD | default `72` |
| Unit tests | 317 passed |
| Production build | green |

## Remaining human-only

- Ear-level mix at 25% / 50% / 100% system volume
- Headphones fatigue check
- Safari gesture unlock
- Classroom projector if available

## Notes

Record mix issues (too loud cue name + pack) in the session PROGRESS entry. Do not retune by changing game timers.
