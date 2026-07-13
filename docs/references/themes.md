# Funwall theme boards

Four complete launch themes. Themes supply **semantic tokens**, not template-specific CSS selectors. Templates must remain usable with baseline tokens alone.

Each theme includes: shell/stage, surfaces, text, borders, primary/secondary/accent, correct/incorrect/warning, wheel palette, tile faces, answer palette, typography keys, decorative intensity, and audio pack key.

---

## Shared semantic token keys

```
theme.shell.background
theme.stage.background
theme.stage.frame
theme.surface
theme.surface.elevated
theme.text
theme.text.muted
theme.border
theme.primary
theme.primary.contrast
theme.secondary
theme.accent
theme.correct
theme.correct.surface
theme.incorrect
theme.incorrect.surface
theme.warning
theme.wheel.segments[]  // 6–12 colors
theme.tile.back
theme.tile.front
theme.tile.matched
theme.answer.default
theme.answer.hover
theme.answer.selected
theme.font.heading
theme.font.body
theme.decoration.intensity  // none | low | medium | high
theme.audio.pack            // classic | gameshow | classroom | quiet
```

---

## 1. Classic

**Intent:** Closest to the clean blue/coral classroom reference. Default for new activities.

| Token | Value |
|---|---|
| shell.background | `#E7F3F9` |
| stage.background | `#DFF1FA` → soft radial to `#E7F3F9` (optional low decoration) |
| stage.frame | `#BECCD1` |
| surface | `#FFFFFF` |
| surface.elevated | `#FFFFFF` |
| text | `#111111` |
| text.muted | `#828282` |
| border | `#BECCD1` |
| primary | `#0DA9FF` |
| primary.contrast | `#FFFFFF` |
| secondary | `#35B7FF` |
| accent | `#FF4B63` |
| correct | `#0F9F6E` |
| correct.surface | `#E6F7F0` |
| incorrect | `#FF4B63` |
| incorrect.surface | `#FFE8EC` |
| warning | `#C47B00` |
| tile.back | `#0DA9FF` |
| tile.front | `#FFFFFF` |
| tile.matched | `#E6F7F0` |
| answer.default | `#FFFFFF` border `#BECCD1` |
| answer.hover | `#E8F6FF` |
| answer.selected | border `#0DA9FF` |
| font.heading | Reddit Sans / Nunito Sans |
| font.body | Open Sans / Source Sans 3 |
| decoration.intensity | low |
| audio.pack | `classic` |

### Wheel palette (Classic)
`#0DA9FF`, `#35B7FF`, `#FFFFFF`, `#CFEEFF`, `#FF4B63`, `#7ED0FF`, `#B8E4FF`, `#FFE0E5`

### Decoration
None or very soft dots; no marquee bulbs. Owner chrome identical to global Classic tokens.

### Games coverage notes
Works for all six templates without extra assets. Image quiz frame is simple white mat.

---

## 2. TV Game Show

**Intent:** Dramatic stage energy for quizzes and wheel; still readable.

| Token | Value |
|---|---|
| shell.background | `#0B1B33` (player shell when theme applied) / owner chrome may remain Classic outside stage |
| stage.background | `#102A4C` |
| stage.frame | `#F2C94C` gold 2 px + optional bulb dots (original circles) |
| surface | `#15345C` |
| surface.elevated | `#1C4170` |
| text | `#F7FBFF` |
| text.muted | `#A8C0D8` |
| border | `#2E5690` |
| primary | `#FFD84D` |
| primary.contrast | `#1A1200` |
| secondary | `#35B7FF` |
| accent | `#FF4B63` |
| correct | `#3DDC97` |
| correct.surface | `#0F3D2C` |
| incorrect | `#FF6B7A` |
| incorrect.surface | `#4A1820` |
| warning | `#FFC857` |
| tile.back | `#1C4170` with gold edge |
| tile.front | `#F7FBFF` text `#0B1B33` |
| tile.matched | `#0F3D2C` |
| answer.default | `#1C4170` |
| answer.hover | `#245089` |
| answer.selected | gold border |
| font.heading | Reddit Sans 700 |
| font.body | Open Sans 600 for answers |
| decoration.intensity | high |
| audio.pack | `gameshow` |

### Wheel palette (TV)
`#FFD84D`, `#FF4B63`, `#35B7FF`, `#9B5DE5`, `#00C2A8`, `#F7FBFF`, `#FF8C42`, `#4CC9F0`

### Decoration
Original marquee dots along frame (CSS circles), soft vignette, optional spotlight gradient. **No copied theme art or logos.**

### Readability caution
Body text on navy must meet AA; prefer `text` white and bold answer labels. High Readability remains available for accessibility needs.

### Games coverage
Especially suits Gameshow quiz, Image quiz, Wheel. Pairs/Wordsearch/True-False remain clear with high-contrast tiles.

---

## 3. Classroom

**Intent:** Warm paper, chalk/marker, restrained school icons.

| Token | Value |
|---|---|
| shell.background | `#F3EDE2` |
| stage.background | `#E7F0E4` (soft board green wash) or `#FFF9F0` |
| stage.frame | `#C4B8A5` |
| surface | `#FFFDF8` |
| surface.elevated | `#FFF9F0` |
| text | `#1F1A14` |
| text.muted | `#6B6258` |
| border | `#D4C8B8` |
| primary | `#2F80C4` (marker blue; still friendly) |
| primary.contrast | `#FFFFFF` |
| secondary | `#E8A838` (pencil yellow) |
| accent | `#E4572E` (marker coral) |
| correct | `#2A9D6E` |
| correct.surface | `#E3F5EC` |
| incorrect | `#D64545` |
| incorrect.surface | `#FDECEC` |
| warning | `#B08900` |
| tile.back | `#2F80C4` |
| tile.front | `#FFFDF8` |
| tile.matched | `#E3F5EC` |
| answer.default | `#FFFDF8` |
| answer.hover | `#F3EDE2` |
| answer.selected | border `#2F80C4` |
| font.heading | Reddit Sans |
| font.body | Open Sans |
| decoration.intensity | medium |
| audio.pack | `classroom` |

### Wheel palette (Classroom)
`#2F80C4`, `#E8A838`, `#E4572E`, `#2A9D6E`, `#FFFDF8`, `#7C6C55`, `#6EC6FF`, `#F2C14E`

### Decorations
Subtle paper grain (CSS noise low opacity), dashed “notebook” rules on empty areas only, original chalk-dot corner marks. No trademarked school brands.

### Games coverage
Warm for True/False and Pairs; Wordsearch board uses paper surface cells.

---

## 4. High Readability

**Intent:** Minimal decoration, maximum contrast, dyslexia-friendly font option.

| Token | Value |
|---|---|
| shell.background | `#FFFFFF` |
| stage.background | `#FFFFFF` |
| stage.frame | `#111111` 2 px |
| surface | `#FFFFFF` |
| surface.elevated | `#F4F4F4` |
| text | `#000000` |
| text.muted | `#333333` (stronger than Classic muted) |
| border | `#111111` |
| primary | `#005FCC` (AA-safer blue) |
| primary.contrast | `#FFFFFF` |
| secondary | `#111111` |
| accent | `#9E0000` (or keep coral only for incorrect icons) |
| correct | `#007A3D` |
| correct.surface | `#D8F5E5` |
| incorrect | `#9E0000` |
| incorrect.surface | `#F8D6D6` |
| warning | `#7A4D00` |
| tile.back | `#005FCC` |
| tile.front | `#FFFFFF` |
| tile.matched | outline 3 px `#007A3D` + pattern (hatch) not color alone |
| answer.default | `#FFFFFF` border 2 px `#111111` |
| answer.hover | `#EEF4FF` |
| answer.selected | border 3 px `#005FCC` |
| font.heading | system-ui / Nunito Sans 700 |
| font.body | Atkinson Hyperlegible or Source Sans 3 at 18 px |
| decoration.intensity | none |
| audio.pack | `quiet` (softer peaks) |

### Wheel palette (High Readability)
High-contrast sequence with patterns optional: `#005FCC`, `#FFFFFF`, `#111111`, `#007A3D`, `#9E0000`, `#FFD000`, `#5C5C5C`, `#00A3A3`  
Adjacent segments must differ in lightness **and** (when possible) pattern/hatch for color-blind users.

### Decorations
None. No gradients, particles, or marquee. Motion defaults toward reduced intensity even when OS reduced-motion is off (optional theme flag `prefersCalm: true`).

### Games coverage
Mandatory verification for all six templates at 390px and 200% zoom. Focus rings 3 px black + primary offset.

---

## 5. Theme application rules

1. **Owner chrome** (dashboard, editor shell, settings) stays Classic-adjacent unless product later adds a global owner theme. Theme selector primarily affects **stage + player chrome**.
2. Changing theme previews immediately; persists only after **Apply to this activity**.
3. Session stores applied theme snapshot so mid-play owner edits do not mutate active attempt presentation mid-result.
4. Audio pack switches with theme but mute still hard-silences all packs.
5. Decorative intensity `none` must never hide required status icons.

---

## 6. Per-template theme checklist

| Template | Classic | TV Game Show | Classroom | High Readability |
|---|---|---|---|---|
| Wheel segments distinct | ✓ | ✓ | ✓ | ✓ + patterns |
| Pairs tile back/front | ✓ | ✓ | ✓ | ✓ + hatch match |
| Gameshow answers + lifelines | ✓ | ✓ feature | ✓ | ✓ high contrast |
| Wordsearch cells | ✓ | ✓ | ✓ paper | ✓ black grid |
| Image quiz frame + buzzer | ✓ | ✓ feature | ✓ | ✓ plain frame |
| True/False card + buttons | ✓ | ✓ | ✓ feature | ✓ static calm |

---

## 7. Token freeze sign-off

| Theme | Owner | Status |
|---|---|---|
| Classic | WS00 + integration lead | Proposed |
| TV Game Show | WS00 + integration lead | Proposed |
| Classroom | WS00 + integration lead | Proposed |
| High Readability | WS00 + QA (WS11) | Proposed |

No Wordwall theme names, asset filenames, or proprietary textures.
