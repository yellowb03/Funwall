import { describe, expect, it, beforeEach } from "vitest";
import {
  TemplateRegistry,
  TemplateRegistryError,
  createProductRegistry,
  resetProductRegistryForTests,
} from "@/features/templates/registry";
import { createWheelRegistration } from "@/features/templates/wheel/registration";
import { createMockGenericRegistration } from "@/features/templates/mock-generic/registration";

describe("template registry", () => {
  beforeEach(() => {
    resetProductRegistryForTests();
  });

  it("registers wheel with frozen unscored capabilities", () => {
    const registry = createProductRegistry();
    const wheel = registry.get("wheel");

    expect(wheel.metadata.key).toBe("wheel");
    expect(wheel.capabilities.isScored).toBe(false);
    expect(wheel.capabilities.hasLeaderboard).toBe(false);
    expect(wheel.contentSupport.family).toBe("list");
    expect(wheel.contentSupport.version).toBe(1);
  });

  it("enforces unique keys", () => {
    const registry = new TemplateRegistry();
    registry.register(createWheelRegistration());
    expect(() => registry.register(createWheelRegistration())).toThrow(
      TemplateRegistryError,
    );
  });

  it("rejects leaderboard without scoring", () => {
    const registry = new TemplateRegistry();
    const bad = createMockGenericRegistration();
    // Force illegal combo
    bad.capabilities.isScored = false;
    bad.capabilities.hasLeaderboard = true;
    expect(() => registry.register(bad)).toThrow(/leaderboard/i);
  });

  it("lazy-loads wheel player adapter module", async () => {
    const registry = createProductRegistry();
    const mod = await registry.loadPlayerAdapter("wheel");
    expect(typeof mod.createPlayerAdapter).toBe("function");
    const player = mod.createPlayerAdapter();
    expect(typeof player.mount).toBe("function");
  });

  it("lazy-loads wheel editor adapter module", async () => {
    const registry = createProductRegistry();
    const mod = await registry.loadEditorAdapter("wheel");
    expect(typeof mod.createEditorAdapter).toBe("function");
  });

  it("lists registered product templates in recommended order slots", () => {
    const registry = createProductRegistry();
    expect(registry.keys()).toEqual([
      "wheel",
      "wordsearch",
      "image-quiz",
      "true-false",
    ]);
    expect(registry.size()).toBe(4);
    expect(registry.get("wordsearch").capabilities.isScored).toBe(true);
    expect(registry.get("image-quiz").capabilities.hasLeaderboard).toBe(true);
    expect(registry.get("true-false").capabilities.isScored).toBe(true);
    // Wheel remains unscored
    expect(registry.get("wheel").capabilities.hasLeaderboard).toBe(false);
  });

  it("refuses unknown template keys outside the six", () => {
    const registry = new TemplateRegistry();
    const fake = createWheelRegistration();
    // @ts-expect-error intentional illegal key for runtime guard
    fake.metadata.key = "bingo";
    expect(() => registry.register(fake)).toThrow(/unknown template key/i);
  });
});
