# Wheel renderer decision spike (Workstream 04)

Time-boxed comparison: custom semantic SVG vs MIT `CrazyTim/spin-wheel`.

## Options

| Criterion | Custom semantic SVG | MIT spin-wheel |
|---|---|---|
| Bundle size | ~zero extra deps | ~library + wrappers |
| Deterministic target control | Exact: winner first, angle derived | Depends on API; risk of post-animation snap |
| Tick callbacks | Derived from boundary crossings | May need polling/hacks |
| Accessibility | Full React control (button, aria-live) | Canvas-oriented; more glue |
| Reduced motion | First-class alternate path | Extra override layer |
| Cleanup | React unmount | Manual dispose |
| License process | None | THIRD_PARTY_NOTICES + integration-lead |

## Decision

**Use custom semantic SVG.**

Reasons:
1. Lifecycle matches the product state machine (`intro → idle → spinning → decelerating → selected → idle | complete`).
2. Winner is selected via seeded RNG **before** animation; target rotation is pure math with documented tolerance.
3. No dependency approval needed for Milestone 1.
4. Tick events (`wheel.tick`) rate-limited from real boundary crossings.

## Third-party obligations

None for the wheel renderer.

If a future integration lead wants the MIT library for gesture polish, re-evaluate only after vertical-slice E2E is green.
