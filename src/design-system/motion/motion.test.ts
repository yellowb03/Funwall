import { describe, expect, it } from "vitest";
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_PATTERNS,
  MOTION_PATTERN_IDS,
  WHEEL_SPIN_DURATION_MS,
  cssDuration,
  prefersReducedMotion,
  resolveMotionPattern,
  type MotionPatternId,
} from "@/design-system/motion";

const EXPECTED_PATTERN_IDS: MotionPatternId[] = [
  "press",
  "panel",
  "feedback",
  "overlay",
  "cardFlip",
  "tileReveal",
  "result",
  "celebration",
];

describe("motion tokens", () => {
  it("exposes expected duration values (ms)", () => {
    expect(MOTION_DURATIONS.instant).toBe(80);
    expect(MOTION_DURATIONS.fast).toBe(120);
    expect(MOTION_DURATIONS.ui).toBe(180);
    expect(MOTION_DURATIONS.feedback).toBe(350);
    expect(MOTION_DURATIONS.flip).toBe(420);
    expect(MOTION_DURATIONS.page).toBe(250);
    expect(MOTION_DURATIONS.reduced).toBe(150);
  });

  it("documents wheel spin as a settings-driven range", () => {
    expect(WHEEL_SPIN_DURATION_MS.min).toBe(4000);
    expect(WHEEL_SPIN_DURATION_MS.max).toBe(7000);
  });

  it("exposes easing strings", () => {
    expect(MOTION_EASINGS.easeOut).toBe("ease-out");
    expect(MOTION_EASINGS.easeIn).toBe("ease-in");
    expect(MOTION_EASINGS.shared).toBe("cubic-bezier(0.2, 0.8, 0.2, 1)");
    expect(MOTION_EASINGS.springy).toBe("cubic-bezier(0.34, 1.4, 0.64, 1)");
  });

  it("cssDuration formats milliseconds", () => {
    expect(cssDuration(80)).toBe("80ms");
    expect(cssDuration(0)).toBe("0ms");
    expect(cssDuration(MOTION_DURATIONS.feedback)).toBe("350ms");
  });
});

describe("MOTION_PATTERNS", () => {
  it("includes every named pattern", () => {
    for (const id of EXPECTED_PATTERN_IDS) {
      expect(MOTION_PATTERNS[id]).toBeDefined();
      expect(MOTION_PATTERNS[id].id).toBe(id);
    }
    expect(MOTION_PATTERN_IDS.sort()).toEqual([...EXPECTED_PATTERN_IDS].sort());
  });

  it("uses celebration springy easing only for celebration", () => {
    expect(MOTION_PATTERNS.celebration.easing).toBe(MOTION_EASINGS.springy);
    for (const id of EXPECTED_PATTERN_IDS) {
      if (id === "celebration") continue;
      expect(MOTION_PATTERNS[id].easing).not.toBe(MOTION_EASINGS.springy);
    }
  });

  it("marks spatial patterns that involve scale or y", () => {
    expect(MOTION_PATTERNS.press.spatial).toBe(true);
    expect(MOTION_PATTERNS.cardFlip.spatial).toBe(true);
    expect(MOTION_PATTERNS.overlay.spatial).toBe(false);
  });
});

describe("resolveMotionPattern", () => {
  it("returns the same pattern when reducedMotion is false", () => {
    const pattern = MOTION_PATTERNS.cardFlip;
    expect(resolveMotionPattern(pattern, false)).toBe(pattern);
  });

  it("clamps duration and clears spatial scale/y when reduced", () => {
    const resolved = resolveMotionPattern(MOTION_PATTERNS.celebration, true);

    expect(resolved.durationMs).toBeLessThanOrEqual(MOTION_DURATIONS.reduced);
    expect(resolved.spatial).toBe(false);
    expect(resolved.easing).toBe(MOTION_EASINGS.easeOut);

    if (resolved.enter) {
      expect(resolved.enter.scale).toBeUndefined();
      expect(resolved.enter.y).toBeUndefined();
      expect(resolved.enter.opacity).toBeDefined();
    }
    if (resolved.exit) {
      expect(resolved.exit.scale).toBeUndefined();
      expect(resolved.exit.y).toBeUndefined();
    }
  });

  it("clamps non-spatial patterns without inventing transforms", () => {
    const resolved = resolveMotionPattern(MOTION_PATTERNS.overlay, true);
    expect(resolved.durationMs).toBeLessThanOrEqual(MOTION_DURATIONS.reduced);
    expect(resolved.spatial).toBe(false);
    expect(resolved.enter).toEqual(MOTION_PATTERNS.overlay.enter);
  });

  it("drops enter/exit when only spatial channels remain", () => {
    const press = resolveMotionPattern(MOTION_PATTERNS.press, true);
    // press enter is scale-only → opacity-only strips it
    expect(press.enter).toBeUndefined();
    expect(press.exit).toBeUndefined();
    expect(press.durationMs).toBe(MOTION_DURATIONS.instant);
  });
});

describe("prefersReducedMotion", () => {
  it("is a function and returns a boolean (false under jsdom SSR-like default)", () => {
    expect(typeof prefersReducedMotion).toBe("function");
    expect(typeof prefersReducedMotion()).toBe("boolean");
  });
});
