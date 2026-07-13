# Funwall design references

Original, clean-room visual and interaction references for Funwall. Match the recognizable experience class of a bright classroom activity product without using Wordwall logos, proprietary illustrations, theme images, or audio.

## Contents

| Document | Purpose |
|---|---|
| [`design-tokens.md`](design-tokens.md) | Formal color, radius, border, shadow, spacing, and touch tokens |
| [`component-geometry.md`](component-geometry.md) | Layout geometry for cards, controls, HUD, tiles, modals |
| [`themes.md`](themes.md) | Classic, TV Game Show, Classroom, High Readability theme boards |
| [`typography.md`](typography.md) | Type scale, weights, line heights, truncation rules |
| [`interaction-states.md`](interaction-states.md) | Focus, hover, pressed, disabled, loading, correct/incorrect, reduced motion |

## Template thumbnail concepts

Six original thumbnail concepts (text descriptions for implementers / illustrators) are documented in [`component-geometry.md`](component-geometry.md#template-thumbnail-concepts). Do not trace Wordwall art.

## Usage rules

1. Prefer semantic theme tokens over hard-coded hex in game stages.
2. Owner chrome (dashboard, editor shell, settings) stays Classic-adjacent: pale canvas, white panels, thin borders, restrained shadows.
3. Game stages may use dramatic theme palettes; shell chrome does not.
4. Success and error must never rely on color alone—pair with icons, labels, or patterns.
5. All interactive components must have keyboard focus treatment defined in [`interaction-states.md`](interaction-states.md).

## Review viewports

- 1440 × 900 desktop owner UI
- 1024 × 768 tablet landscape
- 390 × 844 phone

## Related product docs

- [`docs/product/screen-inventory.md`](../product/screen-inventory.md)
- [`docs/product/copy-deck.md`](../product/copy-deck.md)
- [`docs/product/parity-checklist.md`](../product/parity-checklist.md)
