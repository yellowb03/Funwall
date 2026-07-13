# Funwall interaction states

Every interactive control must implement the states below. Color is never the only channel for correct/incorrect or selected.

---

## 1. Universal control states

| State | Visual | Motion | Pointer | Keyboard / SR |
|---|---|---|---|---|
| **Rest** | Default token fill/border/text | — | cursor pointer when enabled | tab stop if actionable |
| **Hover** | Border/fill shifts (primary light wash or darken 4–8%) | ≤120 ms color | — | not required for pure hover |
| **Focus visible** | 2 px solid `color.focus.ring` + 2 px offset surface; do not remove outlines | — | — | `:focus-visible` required |
| **Pressed / active** | Darken 8–12%; optional scale 0.98 | 80–120 ms | — | Space/Enter activate |
| **Disabled** | `disabled.fg/bg` or opacity 0.55; no hover | none | `not-allowed` / default | not in tab order (or `aria-disabled` with explanation) |
| **Loading** | Spinner or progress; label may become “Saving…” | spinner 0.8s linear loop | pointer events none on control | `aria-busy="true"` |
| **Selected** | Primary border 2 px + subtle fill; checkbox/radio glyph | 120 ms | — | `aria-pressed` / `aria-selected` / `aria-checked` |
| **Error** | Coral border; error text below; icon | optional 150 ms fade | — | `aria-invalid`, describedby |

### Focus ring rules
- Never `outline: none` without a visible replacement.
- Dark stages (TV theme): focus ring `#FFD84D` or white + thickness 3 px.
- High Readability: 3 px black ring + 2 px primary offset.
- Skip link first in tab order; visible on focus.

---

## 2. Buttons

| Variant | Hover | Focus | Pressed | Disabled | Loading |
|---|---|---|---|---|---|
| Primary | `primary.hover` | ring + offset | `primary.pressed` | disabled tokens | spinner + “Working…” |
| Secondary | border strong | ring | surface sunken | disabled | spinner |
| Destructive | coral hover | ring | solid coral confirm step | disabled | — |
| Icon | pale wash | ring | sunken | muted icon | — |

Minimum hit area 44×44 even if visual height is 40.

---

## 3. Inputs

| State | Treatment |
|---|---|
| Rest | 1 px border |
| Hover | border.strong |
| Focus | primary border / ring; label remains visible |
| Filled | same as rest |
| Error | coral border; helper error text; keep value |
| Disabled | disabled bg; not editable |
| Read-only | surface sunken; still focusable if needed for copy |

---

## 4. Cards (template, activity)

| State | Treatment |
|---|---|
| Rest | hairline border |
| Hover | primary-tinted border or soft shadow |
| Focus | ring around full card |
| Pressed | primary.subtle |
| Menu open | card stays elevated; menu focus trapped |

---

## 5. Correct / incorrect feedback

| Outcome | Color | Icon | Text (optional) | Motion (default) | Reduced motion |
|---|---|---|---|---|---|
| Correct | success + success.subtle | check | “Correct” | 250–450 ms scale/fade | ≤150 ms opacity |
| Incorrect | coral + coral.subtle | cross | “Incorrect” | 300–550 ms; **no aggressive shake** | ≤150 ms opacity |
| Partial / timeout | warning or muted | clock | “Time’s up” | fade | fade |

Audio: semantic `answer.correct` / `answer.incorrect` — never audio-only.

Live region: polite announcement of result without repeating entire question unless needed.

---

## 6. Template-specific states

### Wheel
| State | Interaction |
|---|---|
| Idle | Spin focused/enabled |
| Spinning / decelerating | Input locked; Spin disabled; `aria-busy` |
| Selected | Result panel; Resume / Spin again / Eliminate |
| Eliminate | Segment removed for session only |

Reduced motion: shorter spin (≤1s) or crossfade to predetermined result with text announcement.

### Matching pairs
| State | Interaction |
|---|---|
| Face down | focusable |
| One selected | first tile face up |
| Checking | lock input; third tile ignored |
| Match | success treatment; remain or remove |
| Mismatch | both visible 650–900 ms then flip |

Reduced motion: instant flip (opacity) ≤150 ms; mismatch dwell may shorten to 400 ms but remain perceivable.

### Gameshow quiz
| State | Interaction |
|---|---|
| Answering | answers enabled; timer live |
| Locked | answers disabled; reveal styling |
| Lifeline used | control disabled after use; 50:50 removes two wrong |
| Bonus | distinct overlay; input per bonus rules |

### Wordsearch
| State | Interaction |
|---|---|
| Selecting | path highlight |
| Found | success path + list check |
| Miss | optional life loss; clear path |

Keyboard: start cell + direction + length; announce found word.

### Image quiz
| State | Interaction |
|---|---|
| Revealing | tiles uncover; Buzzer enabled |
| Buzzed | reveal paused within 1 frame; answers open |
| Answering | standard answer states |

### True / False
| State | Interaction |
|---|---|
| Answer window | True/False enabled |
| Resolved | stamp + lock |
| Enter / leave | card motion |

Reduced motion: stationary card + linear progress bar for remaining time.

---

## 7. Player shell states

| Shell state | Input | Overlay |
|---|---|---|
| loading | blocked | skeleton |
| ready | Play only | intro |
| playing | game inputs | HUD |
| paused | Resume / Restart / Exit | dim scrim |
| feedback | locked | brief |
| completed / gameOver | Continue | result teaser |
| review | name submit / play again | full review |
| fatal | Restart / report ID | error |

---

## 8. Autosave status (editor)

| State | Presentation |
|---|---|
| clean | quiet / “Saved” |
| dirty | optional “Editing…” |
| saving | “Saving…” + subtle spinner |
| saved | “Saved” |
| error | “Save failed” + Retry button (focusable) |
| conflict | modal; cannot dismiss without choice |

---

## 9. Media modal states

| State | Notes |
|---|---|
| Open | focus trap; Escape closes if no upload mid-flight |
| Loading results | skeletons; `aria-busy` on grid |
| Rate limited | warning banner; tabs still usable |
| Cropping | keyboard adjustable focal if possible |
| Uploading | progressbar role; prevent accidental close without confirm |

---

## 10. Reduced motion (global)

When `prefers-reduced-motion: reduce` **or** owner/player preference:

| Replace | With |
|---|---|
| Spatial flight, zoom, parallax | Opacity/state change ≤150 ms |
| Card 3D flip | Instant face swap + fade |
| Wheel long spin | Short ease or cut to result + announce |
| Particle / marquee chase | Static decorations |
| True/False card path | Stationary + progress bar |
| Press scale | Color change only |
| Page transitions | None or 100 ms fade |

Timers, scoring, and determinism **do not** change solely due to reduced motion except where documented (mismatch dwell may shorten slightly but resolution order stays).

---

## 11. Loading patterns

| Context | Pattern |
|---|---|
| Route | Full content skeleton matching layout |
| Button | Inline spinner left of label |
| Grid | 6–12 bone rectangles |
| Player assets | Stage progress 0–100%; cancel not required |
| Infinite risk | Wordsearch generation shows progress and fails clearly—never hang |

---

## 12. Disabled vs busy

- **Disabled:** action not available (e.g., Done with empty title policy, lifeline exhausted).
- **Busy:** action temporarily unavailable (spinning, saving, checking pair). Prefer `aria-busy` and keep structure visible.

---

## 13. Verification checklist

- [ ] Every control has focus-visible treatment
- [ ] Correct/incorrect include non-color cue
- [ ] Reduced-motion paths for all six games
- [ ] Locked feedback ignores extra clicks/taps
- [ ] Mute stops audio without breaking animations
- [ ] Contrast holds in TV Game Show dark stage
