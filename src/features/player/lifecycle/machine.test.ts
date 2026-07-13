import { describe, expect, it } from "vitest";
import {
  createLifecycleMachine,
  IllegalLifecycleTransitionError,
  LIFECYCLE_TRANSITIONS,
  canAcceptGameplayInput,
  isTerminalLifecycle,
  type PlayerLifecycleState,
} from "@/features/player/lifecycle/machine";

const HAPPY_PATH: PlayerLifecycleState[] = [
  "loading",
  "ready",
  "playing",
  "paused",
  "playing",
  "feedback",
  "playing",
  "completed",
  "review",
];

describe("player lifecycle machine", () => {
  it("walks the happy path loading → review", () => {
    const m = createLifecycleMachine({ strict: true });
    expect(m.state).toBe("loading");

    for (let i = 1; i < HAPPY_PATH.length; i += 1) {
      m.transition(HAPPY_PATH[i]!);
      expect(m.state).toBe(HAPPY_PATH[i]);
    }
  });

  it("allows gameOver path to review", () => {
    const m = createLifecycleMachine({ initial: "playing", strict: true });
    m.transition("gameOver");
    m.transition("review");
    expect(m.state).toBe("review");
  });

  it("throws on illegal transitions in strict/dev mode", () => {
    const m = createLifecycleMachine({ strict: true });
    expect(() => m.transition("playing")).toThrow(IllegalLifecycleTransitionError);
    expect(() => m.transition("playing")).toThrow(/loading -> playing/);
  });

  it("does not leave review via normal transitions", () => {
    const m = createLifecycleMachine({ initial: "review", strict: true });
    expect(m.canTransition("playing")).toBe(false);
    expect(() => m.transition("playing")).toThrow(IllegalLifecycleTransitionError);
  });

  it("safe mode keeps state and marks fatal on illegal transition", () => {
    const illegal: Array<[PlayerLifecycleState, PlayerLifecycleState]> = [];
    const m = createLifecycleMachine({
      strict: false,
      onIllegal: (from, to) => illegal.push([from, to]),
    });
    const next = m.transition("completed");
    expect(next).toBe("loading");
    expect(m.state).toBe("loading");
    expect(illegal).toEqual([["loading", "completed"]]);
    // Further transitions blocked after fatal
    expect(m.canTransition("ready")).toBe(false);
  });

  it("reset restarts the machine for a new attempt", () => {
    const m = createLifecycleMachine({ initial: "review", strict: true });
    m.reset("loading");
    expect(m.state).toBe("loading");
    m.transition("ready");
    expect(m.state).toBe("ready");
  });

  it("documents the full transition table", () => {
    expect(LIFECYCLE_TRANSITIONS.loading).toEqual(["ready"]);
    expect(LIFECYCLE_TRANSITIONS.ready).toEqual(["playing"]);
    expect(LIFECYCLE_TRANSITIONS.playing).toEqual([
      "paused",
      "feedback",
      "completed",
      "gameOver",
    ]);
    expect(LIFECYCLE_TRANSITIONS.paused).toEqual([
      "playing",
      "completed",
      "gameOver",
    ]);
    expect(LIFECYCLE_TRANSITIONS.feedback).toEqual([
      "playing",
      "completed",
      "gameOver",
    ]);
    expect(LIFECYCLE_TRANSITIONS.completed).toEqual(["review"]);
    expect(LIFECYCLE_TRANSITIONS.gameOver).toEqual(["review"]);
    expect(LIFECYCLE_TRANSITIONS.review).toEqual([]);
  });

  it("helpers for terminal and input gates", () => {
    expect(isTerminalLifecycle("review")).toBe(true);
    expect(isTerminalLifecycle("playing")).toBe(false);
    expect(canAcceptGameplayInput("playing")).toBe(true);
    expect(canAcceptGameplayInput("feedback")).toBe(false);
  });
});
