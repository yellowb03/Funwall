# Funwall component geometry

All measurements are design targets at 1×. Implement with tokens from [`design-tokens.md`](design-tokens.md). Touch targets remain ≥ 44×44 px even when visual control is shorter.

---

## 1. Page shell

| Property | Desktop (1440) | Tablet (1024) | Phone (390) |
|---|---|---|---|
| Canvas | full viewport `color.canvas` | same | same |
| Content max width | 1120–1200 px | fluid | fluid |
| Page padding X | 24–32 px | 20 px | 16 px |
| Page padding Y | 24 px | 20 px | 16 px |
| Header height | 56–64 px | 56 px | 52 px |

---

## 2. Progress strip (create flow)

```
[ Pick a template ]  >  [ Enter content ]  >  [ Play ]
```

| Property | Value |
|---|---|
| Height | 48 px |
| Background | `color.surface` or transparent on canvas |
| Active step | `color.primary` text + weight 700; optional underline 2 px |
| Inactive step | `color.muted` |
| Completed step | `color.ink` or primary |
| Separator | `>` or chevron 16 px, muted |
| Position | Top of create/edit routes; sticky optional |
| Phone | Horizontal scroll if needed; do not wrap to three lines |

---

## 3. Template cards (picker)

Split icon/copy layout echoing the product reference grammar—**original art only**.

| Property | Value |
|---|---|
| Desktop columns | 3 |
| Tablet columns | 2 |
| Phone columns | 1 |
| Gap | 16–20 px |
| Card radius | `radius.md` (8 px) |
| Border | 1 px `color.border` |
| Shadow | none or `shadow.soft` |
| Min height | ~140 px |
| Icon pane width | 36–40% of card (~120–140 px) |
| Icon pane background | `color.tile.pale` / `#CFEEFF` |
| Icon pane alignment | left (LTR) |
| Copy pane | white; padding 16 px |
| Title | `text.h3`, ink |
| Description | `text.helper`/`text.meta`, muted; max 3 lines |
| Hover | border `color.primary.light` or soft primary wash |
| Focus | focus ring on whole card |
| Active/pressed | primary.subtle fill on copy pane |
| Hit area | entire card is one control |

### Compact empty-state cards (dashboard)

Same split grammar at ~50–60% scale; icon pane min-height 64 px; description optional/hidden on phone.

---

## 4. Activity dashboard cards

| Property | Value |
|---|---|
| Aspect | ~4:3 or fixed height 200–220 px including meta |
| Thumbnail area | top 55%; template-colored illustration wash |
| Body padding | 12–16 px |
| Title | 2-line clamp |
| Meta row | template label · updated · plays; `text.meta` |
| Overflow menu | 40×40 hit; top-right of card |
| Folder chip | radius sm; pale fill |

---

## 5. Buttons

| Variant | Height | Padding X | Radius | Fill | Label |
|---|---|---|---|---|---|
| Primary | 48 px (lg) / 40 px (md) | 20–24 px | 8 px | `color.primary` | white, `text.ui` 700 |
| Secondary | 40 px | 16–20 px | 8 px | surface | ink; border 1 px border |
| Tertiary / link | 40 px min hit | 8–12 px | 5 px | transparent | `color.link` |
| Destructive | 40 px | 16–20 px | 8 px | surface or coral on confirm | coral / white on solid |
| Icon-only | visual 32–40; hit 44 | — | 8 px | transparent | — |
| Play (stage) | 56–64 px | 32 px | 8–12 px | primary | white, larger |

Do not use full-pill radius for primary editor actions.

Pressed: darken fill 8–12%, scale optional 0.98 (disabled under reduced-motion).  
Disabled: `color.disabled.*`, no pointer, no hover lift.

---

## 6. Inputs and text areas

| Property | Value |
|---|---|
| Height (single line) | 40 px |
| Padding | 10 px 12 px |
| Radius | 5 px |
| Border | 1 px `color.border` |
| Focus border | 2 px `color.primary` or 1 px + focus ring |
| Background | `color.surface` |
| Error border | `color.coral` |
| Text area min height | 80 px |
| Label gap | 6–8 px above control |
| Helper/error gap | 4–6 px below |

Dense editor rows: inputs may be 36–40 px visual height with expanded label hit areas.

---

## 7. Editor panel and rows

| Property | Value |
|---|---|
| Panel max width | 720–800 px |
| Panel padding | 24 px desktop / 16 px phone |
| Panel border | 1 px border, radius 8 px, white surface |
| Title field | full width |
| Row gap | 12 px |
| Row padding | 12 px |
| Row border | optional bottom hairline or card-in-card 1 px |
| Drag handle | 40×40 hit left |
| Row actions | 40×40 each; right-aligned |
| Add control | full-width dashed or secondary button below list |
| Done bar | sticky bottom; padding 12–16 px; primary right-aligned |

### Correct-answer control (quiz)

Radio or segmented control ≥ 44 px; selected uses primary border + check icon.

### True/False truth toggle

Segmented control: True | False; selected fill success-subtle or primary-subtle with clear text.

---

## 8. Media modal

| Property | Value |
|---|---|
| Desktop width | min(720 px, 92vw) |
| Desktop height | min(80vh, 720 px) |
| Phone | 100vw × ~92vh sheet, radius top 12 px |
| Scrim | `color.overlay` |
| Tab bar height | 48 px |
| Search field | full width under tabs |
| Thumbnail grid | 4 col desktop, 3 tablet, 2 phone; gap 8 px |
| Thumbnail cell | square; radius 5 px |
| Crop stage | image max 100% width; tools bar 48 px |
| Footer actions | Cancel secondary + Use image primary |

---

## 9. Owner stage and side panel

| Property | Value |
|---|---|
| Stage aspect | 16:9 |
| Stage max width | ~100% of left column (~66% page) |
| Stage radius | 12 px |
| Stage frame | 1–2 px border or themed frame |
| Side panel width | 280–320 px |
| Side panel gap | 16–24 px |
| Below-stage action row | wrap; gap 8–12 px |
| Settings rows | label left, control right; min height 44 px; separator hairline |

Phone: stage full width; side panel → drawer height ~50–70vh.

---

## 10. Player HUD

| Element | Geometry |
|---|---|
| HUD bar | height 48–56 px; overlay top of stage or just above |
| Cluster gap | 12–16 px |
| Score/lives/timer chips | min-height 36 px; padding 8×12; radius 8 px |
| Icon + value | icon 20–24 px; tabular figures |
| Control cluster (mute/fullscreen) | 44×44 each, top-right |
| Progress (question x of n) | thin bar 4 px under HUD or text meta |

Wheel: no score chip; optional spin counter / items remaining.

---

## 11. Tiles (Matching pairs)

| Property | Value |
|---|---|
| Min tile size | 72 px desktop; 64 px phone (scale grid before shrinking further) |
| Gap | 8–12 px |
| Radius | 8 px |
| Back face | theme `tile.back`; optional number badge 20 px corner |
| Front face | surface or theme front; content padded 8 px |
| Matched | success outline 2 px or removed (gap reserved or collapse per settings) |
| Focus | ring outside tile |

Grid: auto-fit; paginate or scale stage for 30 pairs stress.

---

## 12. Answer buttons (quiz / image quiz)

| Property | Value |
|---|---|
| Min height | 48 px (56 px with images) |
| Width | 100% of answer column |
| Gap | 10–12 px |
| Radius | 8 px |
| Border | 2 px transparent or border token |
| Selected (pre-lock) | primary border |
| Correct reveal | success border + success-subtle fill + icon |
| Incorrect reveal | coral border + coral-subtle fill + icon |
| Disabled (50:50 removed) | opacity disabled; not focusable |
| Layout together | 2×2 when 4 answers; stack when 2; wrap when 6 |
| Layout separate (image quiz) | answers below or beside reveal per setting |

---

## 13. True / False targets

| Property | Value |
|---|---|
| Button size | min 120×56 px each; prefer equal width |
| Gap | 16 px |
| Position | fixed bottom third of stage (not on moving card) |
| Statement card | max-width 560 px; padding 20–24 px; radius 12 px |
| Reduced motion | card centered static; progress bar 4–6 px below |

---

## 14. Wheel stage

| Property | Value |
|---|---|
| Wheel diameter | min(stage short side − HUD, 520 px) |
| Pointer | top-center; 24–32 px |
| Spin CTA | primary large below or center overlay when idle |
| Result panel | after select; full item text/image; actions row |
| Segment labels | auto-size down; ellipsis; full content in result |

---

## 15. Wordsearch grid

| Property | Value |
|---|---|
| Cell size | 28–40 px depending on grid; min 28 px phone with pan/zoom if needed |
| Cell gap | 2–4 px |
| Cell radius | 4 px |
| Letter | centered, weight 600–700 |
| Selection line | primary stroke 3–4 px or cell highlight path |
| Found path | success wash |
| Word list | side panel desktop; collapsible bottom phone |

Cells are real buttons/gridcells, not one canvas bitmap.

---

## 16. Image quiz reveal

| Property | Value |
|---|---|
| Image frame | 16:9 or content-fit within stage |
| Logical grid default | 12×8 landscape |
| Tile lines | optional 1 px semi-transparent |
| Buzzer | large primary ≥ 64×64; bottom-center; Space key |
| Answer region | below or side per layout setting |

---

## 17. Modals and dialogs (confirm)

| Property | Value |
|---|---|
| Width | 400–480 px |
| Padding | 24 px |
| Title | `text.h2` |
| Body | `text.body` muted ink secondary |
| Actions | right-aligned; secondary left of primary; destructive as primary only on delete confirm |
| Focus | initial focus on least-destructive or primary per dialog type; Escape closes when safe |

---

## 18. Settings rows

| Property | Value |
|---|---|
| Row min height | 48 px |
| Label column | 40–50% |
| Control column | switches, selects, steppers right-aligned |
| Group title | `text.h3` + 16 px top margin |
| Apply bar | sticky in panel; Apply primary + Revert tertiary |

---

## 19. Result and leaderboard

| Property | Value |
|---|---|
| Score block | centered; score numeral `text.score` |
| Metric chips | horizontal wrap; gap 8 px |
| Review list | rows min 56 px; correct/incorrect icons 20 px |
| Leaderboard row | rank 32 px, name flex, score, time |
| Name field | 40 px input + Submit primary |

---

## 20. Template thumbnail concepts (original)

Illustrative grammar: flat, friendly, rounded geometry; limited **blue / coral / white** palette; pale-blue icon pane. **Do not trace Wordwall art.**

### 1. Spin the wheel
Top-down simplified wheel with 6–8 pie segments alternating primary-light and white, one coral accent segment, a short triangular pointer at top, soft center hub circle. No logos. Optional tiny star tick marks as original decoration.

### 2. Matching pairs
Four rounded rectangles as cards: two face-down (primary fill with simple “?” or geometric back pattern), two face-up showing a simple apple icon and the word “Apple” as a related pair. Coral corner notches optional. Suggests match without brand mascots.

### 3. Gameshow quiz
Stylized podium mic silhouette (simple geometric) above four rounded answer bars labeled A–D in miniature; marquee dots (original circles) along a shallow arc. Navy-optional accents only inside icon art if needed; pane background stays pale blue.

### 4. Wordsearch
Miniature 5×5 letter grid with two letters along a diagonal highlighted in primary; remaining letters muted gray. Clean sans letters only—no decorative mascots.

### 5. Image quiz
Rounded rectangle “photo” with a simple mountain/sun landscape glyph, overlaid by a 3×2 tile grid where two tiles are lifted/missing to suggest reveal. Small buzzer circle below in coral or primary.

### 6. True or false
Single rounded statement card with two large circular buttons beneath: check (success green/teal) and cross (coral). Minimal motion lines optional (two arcs) to suggest card travel—original, not copied.

---

## 21. Icon geometry rules

- Stroke weight ~1.5–2 px at 24 px icons
- Corner roundness consistent with radius sm
- Fill icons for template thumbs; outline for toolbars
- Coral used sparingly for emphasis details only
- No trademarked shapes, wordmarks, or third-party game IP
