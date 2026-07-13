# Funwall design tokens

Status: product-reference baseline for Milestone 0 visual freeze.  
Source: `FUNWALL_MASTER_PLAN.md` §3.3 and §9.2, plus clean-room expansions for success/warning/focus.

These are **parity targets**, not permission to copy branded artwork. Values are original Funwall tokens that intentionally sit in the same experience class as measured classroom-activity UIs.

## 1. Color tokens

| Token | CSS custom property | Value | Intended use |
|---|---|---|---|
| `color.canvas` | `--fw-color-canvas` | `#E7F3F9` | App and player shell background |
| `color.canvas.alt` | `--fw-color-canvas-alt` | `#E7F6FF` | Alternate cool canvas (splash, picker icon wash) |
| `color.surface` | `--fw-color-surface` | `#FFFFFF` | Cards, panels, inputs, modals |
| `color.surface.sunken` | `--fw-color-surface-sunken` | `#F5FAFC` | Nested wells, disabled panel fill |
| `color.tile.pale` | `--fw-color-tile-pale` | `#CFEEFF` | Template card icon pane, soft game tiles |
| `color.border` | `--fw-color-border` | `#BECCD1` | Panels, cards, inputs, hairlines |
| `color.border.strong` | `--fw-color-border-strong` | `#9BB0B8` | Active/hover borders, separators under stress |
| `color.primary` | `--fw-color-primary` | `#0DA9FF` | Primary buttons, active template, focus accents |
| `color.primary.hover` | `--fw-color-primary-hover` | `#0C9BEA` | Primary hover (~8% darker) |
| `color.primary.pressed` | `--fw-color-primary-pressed` | `#0B8CD4` | Primary pressed |
| `color.primary.light` | `--fw-color-primary-light` | `#35B7FF` | Soft primary fills, progress active step |
| `color.primary.subtle` | `--fw-color-primary-subtle` | `#E8F6FF` | Selected row wash, focus-within background |
| `color.link` | `--fw-color-link` | `#1C94D6` | Inline links, restrained text actions |
| `color.link.hover` | `--fw-color-link-hover` | `#167BB3` | Link hover |
| `color.coral` | `--fw-color-coral` | `#FF4B63` | Incorrect state, playful accent, icon details |
| `color.coral.hover` | `--fw-color-coral-hover` | `#E84359` | Destructive hover |
| `color.coral.subtle` | `--fw-color-coral-subtle` | `#FFE8EC` | Incorrect answer wash |
| `color.ink` | `--fw-color-ink` | `#111111` | Titles and primary text |
| `color.ink.secondary` | `--fw-color-ink-secondary` | `#3A3A3A` | Dense secondary body when muted is too light |
| `color.muted` | `--fw-color-muted` | `#828282` | Metadata, helper text, placeholders |
| `color.muted.strong` | `--fw-color-muted-strong` | `#5C5C5C` | Muted text needing AA on pale surfaces |
| `color.success` | `--fw-color-success` | `#0F9F6E` | Correct state (AA on white); never sole channel |
| `color.success.subtle` | `--fw-color-success-subtle` | `#E6F7F0` | Correct answer wash |
| `color.warning` | `--fw-color-warning` | `#C47B00` | Imbalance warnings, soft limits |
| `color.warning.subtle` | `--fw-color-warning-subtle` | `#FFF6E5` | Warning banner background |
| `color.focus.ring` | `--fw-color-focus-ring` | `#0DA9FF` | Keyboard focus ring |
| `color.focus.ring.offset` | `--fw-color-focus-ring-offset` | `#FFFFFF` | Focus ring offset on colored surfaces |
| `color.overlay` | `--fw-color-overlay` | `rgba(17, 17, 17, 0.45)` | Modal scrim |
| `color.disabled.fg` | `--fw-color-disabled-fg` | `#A0A0A0` | Disabled control text/icons |
| `color.disabled.bg` | `--fw-color-disabled-bg` | `#F0F3F5` | Disabled control fill |
| `color.danger.text` | `--fw-color-danger-text` | `#B42318` | Destructive confirm labels (AA) |

### Contrast notes (target WCAG 2.2 AA)

| Pair | Approx contrast | Pass body text? |
|---|---:|---|
| ink `#111111` on surface `#FFFFFF` | ~18.9:1 | Yes |
| muted `#828282` on surface `#FFFFFF` | ~3.7:1 | Large text / UI only; use `muted.strong` for small body |
| primary `#0DA9FF` on white (button fill) | Use white button label `#FFFFFF` | Yes for large UI |
| white text on primary `#0DA9FF` | ~2.9:1 | Large UI controls OK; prefer bold 16px+ labels |
| success `#0F9F6E` on white | ~3.5:1 | Large/icon + text label; not sole cue |
| coral `#FF4B63` on white | ~3.5:1 | Accent/icon; pair with label |
| ink on canvas `#E7F3F9` | ~17.5:1 | Yes |

Implementers must verify with an automated checker at desktop, tablet, and phone; do not ship if body text falls below 4.5:1.

## 2. Typography tokens (summary)

Full scale lives in [`typography.md`](typography.md).

| Token | Family stack | Weight default |
|---|---|---|
| `font.heading` | `"Reddit Sans", "Nunito Sans", "Segoe UI", system-ui, sans-serif` | 700 |
| `font.body` | `"Open Sans", "Source Sans 3", "Segoe UI", system-ui, sans-serif` | 400 |
| `font.mono` | `"IBM Plex Mono", ui-monospace, monospace` | 400 |

Free/open equivalents (Nunito Sans, Source Sans 3, IBM Plex Mono) are first-class substitutes when Reddit Sans or Open Sans are unavailable.

## 3. Radius tokens

| Token | Value | Use |
|---|---|---|
| `radius.xs` | `3px` | Dense chips, tiny badges |
| `radius.sm` | `5px` | Inputs, small buttons |
| `radius.md` | `8px` | Cards, panels, primary buttons |
| `radius.lg` | `12px` | Modals, stage frame |
| `radius.xl` | `16px` | Game stage chrome (themed) |
| `radius.full` | `9999px` | Avatars/progress dots only—avoid pill-everything |

Default for owner UI controls and cards: **5–8 px**. Avoid glossy or over-rounded marketing aesthetics.

## 4. Border tokens

| Token | Value | Use |
|---|---|---|
| `border.width.hairline` | `1px` | Default panels, cards, inputs |
| `border.width.strong` | `2px` | Focus-adjacent, selected cards, answer selected |
| `border.style.default` | `solid` | Everywhere unless decorative theme art |

## 5. Shadow tokens

| Token | Value | Use |
|---|---|---|
| `shadow.none` | `none` | Default for most cards |
| `shadow.soft` | `0 1px 2px rgba(17, 17, 17, 0.06)` | Optional elevated card on dense lists |
| `shadow.modal` | `0 8px 24px rgba(17, 17, 17, 0.12)` | Modal, dropdown menus |
| `shadow.focus` | `0 0 0 3px rgba(13, 169, 255, 0.35)` | Optional focus glow with ring |

Owner UI stays flat. Game themes may add stage-only glow; shell chrome does not adopt floating-dashboard shadows.

## 6. Spacing tokens

Base unit: **4 px**.

| Token | Value |
|---|---|
| `space.0` | `0` |
| `space.1` | `4px` |
| `space.2` | `8px` |
| `space.3` | `12px` |
| `space.4` | `16px` |
| `space.5` | `20px` |
| `space.6` | `24px` |
| `space.8` | `32px` |
| `space.10` | `40px` |
| `space.12` | `48px` |
| `space.16` | `64px` |

Common layout rhythm: page padding `24px` desktop / `16px` phone; card padding `16px`; form row gap `12px`; section gap `32px`.

## 7. Size / touch tokens

| Token | Value | Use |
|---|---|---|
| `size.touch.min` | `44px` | Minimum interactive target (WCAG) |
| `size.control.h.sm` | `32px` | Dense secondary controls (must still expand hit area) |
| `size.control.h.md` | `40px` | Default buttons/inputs |
| `size.control.h.lg` | `48px` | Primary Done / Play |
| `size.icon.sm` | `16px` | Inline icons |
| `size.icon.md` | `24px` | Toolbar icons |
| `size.icon.lg` | `40px` | Empty-state glyphs |
| `size.template.iconPane` | `96px` min height | Template card illustration pane height target |

## 8. Z-index scale

| Token | Value | Layer |
|---|---:|---|
| `z.base` | `0` | Content |
| `z.sticky` | `10` | Sticky editor Done bar, progress strip |
| `z.dropdown` | `20` | Menus |
| `z.overlay` | `30` | Stage overlays |
| `z.modal` | `40` | Media modal, confirm dialogs |
| `z.toast` | `50` | Toasts / live save banners |
| `z.skip` | `60` | Skip link |

## 9. Motion duration tokens

| Token | Value | Use |
|---|---|---|
| `motion.instant` | `80ms` | Press feedback |
| `motion.fast` | `120ms` | Hover color, small toggles |
| `motion.ui` | `180ms` | Panel/row transitions |
| `motion.feedback` | `350ms` | Correct/incorrect feedback window |
| `motion.flip` | `420ms` | Card flip total |
| `motion.page` | `250ms` | Route-level soft transitions |
| `motion.wheel` | `4000–7000ms` | Wheel spin (settings-driven) |
| `motion.reduced` | `≤150ms` | All spatial motion under reduced-motion |

Easing defaults: `ease-out` for enter, `ease-in` for exit, `cubic-bezier(0.2, 0.8, 0.2, 1)` for shared UI.

## 10. Opacity tokens

| Token | Value | Use |
|---|---|---|
| `opacity.disabled` | `0.55` | Whole control when using opacity path |
| `opacity.placeholder` | `0.72` | Placeholder text relative to muted |
| `opacity.busy` | `0.7` | Loading content freeze |

## 11. Semantic mapping for implementers

| Role | Token |
|---|---|
| Page background | `color.canvas` |
| Content card | `color.surface` + `border.width.hairline` + `color.border` + `radius.md` |
| Primary CTA | `color.primary` fill, white label, `radius.md`, `size.control.h.lg` |
| Destructive CTA | outline coral or text `color.danger.text`; confirm dialogs use solid coral only after confirmation step |
| Focus | `2px` solid `color.focus.ring` + `2px` offset on `color.focus.ring.offset` |
| Correct | `color.success` + icon + optional label “Correct” |
| Incorrect | `color.coral` + icon + optional label “Incorrect” |

## 12. What is out of token scope

- Game-stage decorative gradients (theme-owned)
- Original sound assets (Workstream 10)
- Third-party provider brand colors in attribution text
- Wordwall brand colors used as named product branding

## 13. Freeze checklist

- [ ] Integration lead approves hex table
- [ ] High Readability theme contrast verified at AA
- [ ] Primary button white label verified at usable UI size
- [ ] No Wordwall brand names embedded in token identifiers
