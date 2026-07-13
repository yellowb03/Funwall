import { describe, expect, it } from "vitest";
import {
  normalizeDegrees,
  rotationAgreesWithWinner,
  segmentAngleDeg,
  segmentIndexAtRotation,
  targetRotationForWinner,
} from "@/features/templates/wheel/geometry";

describe("wheel geometry", () => {
  it("normalizes degrees into [0, 360)", () => {
    expect(normalizeDegrees(0)).toBe(0);
    expect(normalizeDegrees(360)).toBe(0);
    expect(normalizeDegrees(-90)).toBe(270);
    expect(normalizeDegrees(450)).toBe(90);
  });

  it.each([2, 3, 6, 30, 100])(
    "target rotation places winner under pointer for %i segments",
    (n) => {
      for (let winner = 0; winner < Math.min(n, 8); winner += 1) {
        const target = targetRotationForWinner(winner, n, 3, 0);
        expect(segmentIndexAtRotation(target, n)).toBe(winner);
        expect(rotationAgreesWithWinner(target, winner, n)).toBe(true);
      }
    },
  );

  it("works for odd segment counts from non-zero current rotation", () => {
    const n = 3;
    const current = 123.45;
    const target = targetRotationForWinner(1, n, 2, current);
    expect(target).toBeGreaterThanOrEqual(current);
    expect(segmentIndexAtRotation(target, n)).toBe(1);
  });

  it("segment angle is 360/n", () => {
    expect(segmentAngleDeg(6)).toBe(60);
    expect(segmentAngleDeg(8)).toBe(45);
  });

  it("extra turns only add full rotations", () => {
    const a = targetRotationForWinner(0, 6, 0, 0);
    const b = targetRotationForWinner(0, 6, 5, 0);
    expect(b - a).toBe(5 * 360);
    expect(segmentIndexAtRotation(a, 6)).toBe(0);
    expect(segmentIndexAtRotation(b, 6)).toBe(0);
  });
});
