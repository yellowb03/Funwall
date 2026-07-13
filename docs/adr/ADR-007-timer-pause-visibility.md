# ADR-007: Timer, pause, and visibility

## Status

Accepted — 2026-07-14

## Context

Shared timer behavior must be consistent across templates. Tab throttling must not create unfair or divergent game logic unless the shell intentionally pauses.

## Decision

1. **Clock:** monotonic source (`performance.now`) for elapsed calculations.
2. **Modes:** `none | countUp | countDown` via `createTimer` (`src/services/timer/clock.ts`).
3. **Pause:** shell-owned; templates subscribe, they do not create unmanaged intervals.
4. **Visibility:** browser tab hide does **not** auto-freeze elapsed time. The shell may intentionally pause (and emit `game.paused`) based on product rules (e.g. explicit pause or future classroom policy). Default: time continues unless paused.
5. **Timeout:** countDown timeout is idempotent (fires once).
6. **Display:** reduced tick rate (e.g. 250ms) is allowed; UI may show whole seconds.

## Consequences

- Workstream 03 wires visibility → optional pause policy without templates reimplementing timers.
- Reduced-motion does not alter timer math.
