import { describe, expect, it } from "vitest";
import {
  defaultWheelSettings,
  migrateWheelSettings,
  spinDurationMs,
  wheelSettingsSchema,
} from "@/features/templates/wheel/settings";

describe("wheel settings", () => {
  it("defaults are pure and deterministic", () => {
    expect(defaultWheelSettings()).toEqual(defaultWheelSettings());
    expect(defaultWheelSettings()).toEqual({
      version: 1,
      timerMode: "none",
      spinPower: "medium",
      shuffleItemOrder: false,
      allowEliminate: true,
      imageDisplayPolicy: "auto",
    });
  });

  it("validates complete settings", () => {
    const result = wheelSettingsSchema.safeParse(defaultWheelSettings());
    expect(result.success).toBe(true);
  });

  it("spin duration is within 4–7s", () => {
    expect(spinDurationMs("low")).toBe(4000);
    expect(spinDurationMs("medium")).toBe(5500);
    expect(spinDurationMs("high")).toBe(7000);
  });

  it("migrates provisional product-fixture keys", () => {
    const migrated = migrateWheelSettings(0, {
      version: 1,
      timer: "countUp",
      spinPower: "high",
      shuffleItems: true,
      allowEliminate: false,
    });
    expect(migrated.timerMode).toBe("countUp");
    expect(migrated.spinPower).toBe("high");
    expect(migrated.shuffleItemOrder).toBe(true);
    expect(migrated.allowEliminate).toBe(false);
    expect(migrated.imageDisplayPolicy).toBe("auto");
  });

  it("migrates invalid raw to defaults", () => {
    expect(migrateWheelSettings(0, null)).toEqual(defaultWheelSettings());
    expect(migrateWheelSettings(0, "nope")).toEqual(defaultWheelSettings());
  });

  it("passes through valid v1", () => {
    const raw = {
      version: 1,
      timerMode: "countDown",
      timerSeconds: 60,
      spinPower: "low",
      shuffleItemOrder: true,
      allowEliminate: true,
      imageDisplayPolicy: "resultOnly",
    };
    expect(migrateWheelSettings(1, raw)).toMatchObject(raw);
  });
});
