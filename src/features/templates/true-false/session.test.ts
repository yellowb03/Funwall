import { describe, expect, it } from "vitest";
import { createSeededRng } from "@/services/rng/seeded-rng";
import { buildStatementsContent } from "@/test/fixtures/builders";
import {
  advanceAfterItem,
  beginAnswerWindow,
  beginItemEnter,
  canStartRepeatPass,
  captureAnswer,
  createTrueFalseSession,
  enterFeedback,
  leaveFeedback,
  markSessionTimeUp,
  tryResolve,
  type TrueFalseSessionState,
} from "@/features/templates/true-false/session";
import {
  defaultTrueFalseSettings,
  type TrueFalseSettings,
} from "@/features/templates/true-false/settings";
import { trueFalseFixtureMin } from "@/features/templates/true-false/fixtures";

function settings(partial?: Partial<TrueFalseSettings>): TrueFalseSettings {
  return { ...defaultTrueFalseSettings(), ...partial };
}

function openWindow(
  state: TrueFalseSessionState,
  now = 1000,
): TrueFalseSessionState {
  let s = beginItemEnter(state);
  s = beginAnswerWindow(s, now);
  return s;
}

describe("true-false session", () => {
  it("double resolve once — second answer ignored", () => {
    const content = trueFalseFixtureMin.content;
    const rng = createSeededRng("double-resolve");
    let s = createTrueFalseSession(content, settings(), rng);
    s = openWindow(s, 1000);

    s = captureAnswer(s, true, 1100);
    s = tryResolve(s, 1100);
    expect(s.resolved).toBe(true);
    expect(s.phase).toBe("answered");
    expect(s.attempts).toHaveLength(1);
    const firstAttempt = s.attempts[0]!;

    const afterSecond = captureAnswer(s, false, 1150);
    expect(afterSecond.attempts).toHaveLength(1);
    expect(afterSecond.attempts[0]).toEqual(firstAttempt);
    expect(afterSecond.lastAnswer).toBe(true);

    const afterTryAgain = tryResolve(afterSecond, 1200);
    expect(afterTryAgain.attempts).toHaveLength(1);
    expect(afterTryAgain.resolved).toBe(true);
  });

  it("answer at deadline wins when inputAt <= deadline", () => {
    const content = trueFalseFixtureMin.content;
    const rng = createSeededRng("boundary-answer");
    let s = createTrueFalseSession(
      content,
      settings({ speed: 5 }),
      rng,
    );
    // window 3500 → deadline 1000+3500=4500
    s = openWindow(s, 1000);
    expect(s.deadlineAt).toBe(4500);

    s = captureAnswer(s, true, 4500);
    s = tryResolve(s, 4500);
    expect(s.phase).toBe("answered");
    expect(s.lastResolve).not.toBe("expired");
  });

  it("expiry wins when now >= deadline without in-time answer", () => {
    const content = trueFalseFixtureMin.content;
    const rng = createSeededRng("boundary-expire");
    let s = createTrueFalseSession(
      content,
      settings({ speed: 5 }),
      rng,
    );
    s = openWindow(s, 1000);
    s = tryResolve(s, 4500);
    expect(s.phase).toBe("expired");
    expect(s.unansweredCount).toBe(1);
    expect(s.attempts).toHaveLength(1);
    expect(s.attempts[0]!.playerAnswer).toBeNull();
  });

  it("late answer after deadline loses to expiry", () => {
    const content = trueFalseFixtureMin.content;
    const rng = createSeededRng("late-answer");
    let s = createTrueFalseSession(
      content,
      settings({ speed: 5 }),
      rng,
    );
    s = openWindow(s, 1000);
    // Capture after deadline
    s = captureAnswer(s, true, 4600);
    s = tryResolve(s, 4600);
    expect(s.phase).toBe("expired");
    expect(s.lastResolve).toBe("expired");
  });

  it("repeat never starts before first-pass completion", () => {
    const content = trueFalseFixtureMin.content;
    const rng = createSeededRng("repeat-gate");
    const cfg = settings({
      repeatUntilTime: true,
      timerMode: "countDown",
      timerSeconds: 60,
    });
    let s = createTrueFalseSession(content, cfg, rng);
    expect(s.firstPassComplete).toBe(false);
    expect(canStartRepeatPass(s, cfg)).toBe(false);

    // Resolve first item only
    s = openWindow(s, 1000);
    s = captureAnswer(s, true, 1100);
    s = tryResolve(s, 1100);
    s = enterFeedback(s);
    s = leaveFeedback(s);
    s = advanceAfterItem(s, cfg, rng);
    expect(s.firstPassComplete).toBe(false);
    expect(canStartRepeatPass(s, cfg)).toBe(false);
    expect(s.phase).toBe("itemEntering");
    expect(s.passIndex).toBe(0);
  });

  it("repeat reshuffles only after full first pass", () => {
    const content = trueFalseFixtureMin.content;
    const rng = createSeededRng("repeat-full");
    const cfg = settings({
      repeatUntilTime: true,
      timerMode: "countDown",
      timerSeconds: 60,
      speed: 10,
    });
    let s = createTrueFalseSession(content, cfg, rng);

    // Pass item 0
    s = openWindow(s, 1000);
    s = captureAnswer(s, true, 1050);
    s = tryResolve(s, 1050);
    s = enterFeedback(s);
    s = leaveFeedback(s);
    s = advanceAfterItem(s, cfg, rng);
    expect(s.queueIndex).toBe(1);

    // Pass item 1 → end of first pass → repeat
    s = beginAnswerWindow(s, 2000);
    s = captureAnswer(s, false, 2050);
    s = tryResolve(s, 2050);
    s = enterFeedback(s);
    s = leaveFeedback(s);
    s = advanceAfterItem(s, cfg, rng);

    expect(s.firstPassComplete).toBe(true);
    expect(s.passIndex).toBe(1);
    expect(s.phase).toBe("itemEntering");
    expect(s.queueIndex).toBe(0);
    expect(canStartRepeatPass(s, cfg)).toBe(true);
  });

  it("game over after life loss post-feedback, not mid-resolve", () => {
    const content = trueFalseFixtureMin.content;
    const rng = createSeededRng("lives-go");
    const cfg = settings({ lives: 1, speed: 10 });
    let s = createTrueFalseSession(content, cfg, rng);
    expect(s.livesRemaining).toBe(1);

    s = openWindow(s, 1000);
    // First statement isTrue=true; answer false → incorrect → life 0
    s = captureAnswer(s, false, 1050);
    s = tryResolve(s, 1050);
    expect(s.livesRemaining).toBe(0);
    expect(s.phase).toBe("answered");
    expect(s.lastResolve).toBe("incorrect");

    // Still not game over until after feedback
    s = enterFeedback(s);
    expect(s.phase).toBe("feedback");
    s = leaveFeedback(s);
    expect(s.phase).toBe("itemLeaving");
    s = advanceAfterItem(s, cfg, rng);
    expect(s.phase).toBe("gameOver");
  });

  it("expiry costs a life when finite", () => {
    const content = trueFalseFixtureMin.content;
    const rng = createSeededRng("expire-life");
    const cfg = settings({ lives: 2, speed: 10 });
    let s = createTrueFalseSession(content, cfg, rng);
    s = openWindow(s, 1000);
    s = tryResolve(s, 1000 + s.windowMs);
    expect(s.phase).toBe("expired");
    expect(s.livesRemaining).toBe(1);
  });

  it("session time-up prevents new items after current resolves", () => {
    const content = trueFalseFixtureMin.content;
    const rng = createSeededRng("time-up");
    const cfg = settings({
      timerMode: "countDown",
      timerSeconds: 30,
      speed: 10,
    });
    let s = createTrueFalseSession(content, cfg, rng);
    s = openWindow(s, 1000);
    s = markSessionTimeUp(s);
    s = captureAnswer(s, true, 1100);
    s = tryResolve(s, 1100);
    s = enterFeedback(s);
    s = leaveFeedback(s);
    s = advanceAfterItem(s, cfg, rng);
    expect(s.phase).toBe("completed");
  });

  it("shuffle uses seeded contentOrder stream", () => {
    const content = buildStatementsContent();
    const a = createTrueFalseSession(
      content,
      settings({ shuffle: true }),
      createSeededRng("shuffle-seed-a"),
    );
    const b = createTrueFalseSession(
      content,
      settings({ shuffle: true }),
      createSeededRng("shuffle-seed-a"),
    );
    expect(a.statements.map((x) => x.id)).toEqual(
      b.statements.map((x) => x.id),
    );
  });

  it("scoring awards points only for correct answers", () => {
    const content = trueFalseFixtureMin.content;
    const rng = createSeededRng("score");
    let s = createTrueFalseSession(content, settings({ speed: 5 }), rng);
    s = openWindow(s, 1000);
    // Correct (truth true)
    s = captureAnswer(s, true, 1100);
    s = tryResolve(s, 1100);
    expect(s.correctCount).toBe(1);
    expect(s.score).toBeGreaterThanOrEqual(100);
    expect(s.score).toBeLessThanOrEqual(150);
  });
});
