import { describe, expect, it } from "vitest";
import { createCelebrationBudget } from "@/design-system/motion/celebration-budget";

describe("createCelebrationBudget", () => {
  it("limits concurrent celebrations and enforces interval", () => {
    let t = 0;
    const budget = createCelebrationBudget({
      maxConcurrent: 2,
      minIntervalMs: 100,
      now: () => t,
    });

    expect(budget.tryAcquire()).toBe(true);
    expect(budget.activeCount()).toBe(1);

    // Too soon
    t = 50;
    expect(budget.tryAcquire()).toBe(false);

    t = 150;
    expect(budget.tryAcquire()).toBe(true);
    expect(budget.activeCount()).toBe(2);

    t = 300;
    expect(budget.tryAcquire()).toBe(false); // at max concurrent

    budget.release();
    expect(budget.activeCount()).toBe(1);
    t = 450;
    expect(budget.tryAcquire()).toBe(true);

    budget.reset();
    expect(budget.activeCount()).toBe(0);
    expect(budget.tryAcquire()).toBe(true);
  });
});
