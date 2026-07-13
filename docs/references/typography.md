# Funwall typography

## 1. Font stacks

| Role | Preferred | Free equivalents | Fallback |
|---|---|---|---|
| Heading | Reddit Sans | Nunito Sans | `"Segoe UI", system-ui, sans-serif` |
| Body / UI | Open Sans | Source Sans 3 | `"Segoe UI", system-ui, sans-serif` |
| Dense data / IDs (rare) | IBM Plex Mono | — | `ui-monospace, monospace` |
| High Readability body option | Atkinson Hyperlegible or OpenDyslexic (licensed/self-hosted) | Source Sans 3 at larger size | system-ui |

CSS variables:

```css
--fw-font-heading: "Reddit Sans", "Nunito Sans", "Segoe UI", system-ui, sans-serif;
--fw-font-body: "Open Sans", "Source Sans 3", "Segoe UI", system-ui, sans-serif;
--fw-font-mono: "IBM Plex Mono", ui-monospace, monospace;
```

Do not load proprietary fonts that require commercial licenses beyond what the project has cleared. Prefer variable fonts when available for weight efficiency.

## 2. Type scale

Base: **16px** root. Use rem in implementation; px listed for design review.

| Token | Size | Line height | Weight | Letter-spacing | Use |
|---|---:|---:|---:|---|---|
| `text.display` | 32px / 2rem | 40px / 1.25 | 700 | -0.01em | Rare marketing-free empty-state titles |
| `text.h1` | 28px / 1.75rem | 36px / 1.29 | 700 | -0.01em | Page titles (My Activities, Activity name) |
| `text.h2` | 22px / 1.375rem | 28px / 1.27 | 700 | 0 | Section titles, modal titles |
| `text.h3` | 18px / 1.125rem | 24px / 1.33 | 700 | 0 | Card titles, template names |
| `text.body.lg` | 18px / 1.125rem | 28px / 1.55 | 400 | 0 | Player prompts, statement cards |
| `text.body` | 16px / 1rem | 24px / 1.5 | 400 | 0 | Default body, form labels companion |
| `text.body.strong` | 16px | 24px | 600–700 | 0 | Emphasized body, table primary cell |
| `text.ui` | 15px / 0.9375rem | 22px / 1.47 | 600 | 0 | Buttons, menu items |
| `text.ui.sm` | 14px / 0.875rem | 20px / 1.43 | 600 | 0 | Secondary buttons, chips |
| `text.meta` | 13px / 0.8125rem | 18px / 1.38 | 400 | 0.01em | Updated dates, template labels, attribution |
| `text.helper` | 13px | 18px | 400 | 0 | Field helper, limits (“2–100 items”) |
| `text.caption` | 12px / 0.75rem | 16px / 1.33 | 400 | 0.02em | Badges, legal microcopy |
| `text.score` | 28–40px | 1.1 | 700 | -0.02em | Result score numeral |

### High Readability theme overrides

| Token | Size | Line height |
|---|---:|---:|
| `text.body` | 18px | 28px |
| `text.body.lg` | 20px | 32px |
| `text.ui` | 16px | 24px |
| `text.meta` | 14px | 20px |

Minimum body size on phone remains 16px; do not shrink below for density.

## 3. Weight usage

| Weight | When |
|---:|---|
| 400 | Body, descriptions, helpers |
| 600 | Buttons, nav items, field labels |
| 700 | Headings, score, template card titles |

Avoid 300 light weights (poor classroom projection). Avoid 800/900 unless theme-specific display.

## 4. Label and field rules

- Field labels: `text.ui.sm` or `text.ui`, weight 600, ink color, permanently visible (not placeholder-only).
- Placeholders: `text.body`, `color.muted`; never the only instruction for required fields.
- Errors: `text.helper` or `text.ui.sm`, `color.danger.text` or coral with icon; associate via `aria-describedby`.
- Helper limits: `text.helper`, `color.muted.strong`.

## 5. Truncation and overflow

| Context | Rule |
|---|---|
| Activity card title | 2 lines max, ellipsis |
| Template card description | 3 lines max, ellipsis |
| Dashboard meta | single line, ellipsis |
| Player prompt | wrap fully; scroll stage if needed; no ellipsis on questions |
| Wheel segment labels | abbreviate beyond ~12 chars at high item counts; full text in result panel |
| Wordsearch display words | preserve user casing; wrap in list, not in grid cells |
| True/False statements | wrap; max ~280 chars recommended; stress fixtures test longer |

## 6. Alignment

- Owner UI: left-aligned text in LTR; forms left-aligned.
- Player answers: center text in answer buttons when short; left-align when multi-line or image+text.
- Score screens: center primary result block.

## 7. Language and Unicode

- Treat content as Unicode; do not assume ASCII.
- Do not hard-code English word boundaries into layout.
- Interface localization is not required at launch, but all chrome strings live in the copy deck, not inside game logic.
- Preserve diacritics in display; grid normalization is a content/settings concern (Wordsearch).

## 8. Accessibility

- Body text contrast ≥ 4.5:1 on its background.
- Large text (≥18px regular or ≥14px bold) ≥ 3:1.
- Do not convey state by weight or color alone.
- Support browser zoom to 200% without loss of field labels or primary actions.
- Line length in editor content columns: prefer 45–90 characters.

## 9. Pairing with components

| Component | Typography token |
|---|---|
| Progress strip steps | `text.ui.sm` / 600 |
| Primary Done / Play | `text.ui` / 700 |
| Template card title | `text.h3` |
| Template card description | `text.meta` or `text.helper` |
| Autosave status | `text.meta` |
| Modal title | `text.h2` |
| HUD score/lives/timer | `text.ui` / 700 with tabular nums if available |
| Result headline | `text.h1` or `text.display` |
