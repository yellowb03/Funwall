import { describe, expect, it } from "vitest";
import {
  compareLeaderboard,
  createMemoryPublicPlayPort,
} from "@/features/player/session/memory-public-play-port";
import {
  buildScoredQuizSnapshot,
  buildWheelSnapshot,
} from "@/features/player/fixtures";
import type { ResultContract } from "@/domain/result";
import type { LeaderboardEntry } from "@/features/player/session/types";

describe("MemoryPublicPlayPort", () => {
  it("resolves injected snapshot and returns null for unknown slug", async () => {
    const wheel = buildWheelSnapshot();
    const port = createMemoryPublicPlayPort({
      snapshots: { [wheel.publicSlug]: wheel },
    });
    await expect(port.resolveSnapshot(wheel.publicSlug)).resolves.toMatchObject({
      title: wheel.title,
      isScored: false,
    });
    await expect(port.resolveSnapshot("no-such-slug-xx")).resolves.toBeNull();
  });

  it("stores seed on the session at start", async () => {
    const wheel = buildWheelSnapshot();
    const port = createMemoryPublicPlayPort({
      snapshots: { [wheel.publicSlug]: wheel },
    });
    const session = await port.startSession({
      publicSlug: wheel.publicSlug,
      seed: "fixed-seed-for-test-001",
    });
    expect(session.seed).toBe("fixed-seed-for-test-001");
    expect(session.status).toBe("active");
    expect(session.activityId).toBe(wheel.activityId);

    const again = await port.getSession?.(session.id);
    expect(again?.seed).toBe("fixed-seed-for-test-001");
  });

  it("generates a unique seed when none provided", async () => {
    const wheel = buildWheelSnapshot();
    const port = createMemoryPublicPlayPort({
      snapshots: { [wheel.publicSlug]: wheel },
    });
    const a = await port.startSession({ publicSlug: wheel.publicSlug });
    const b = await port.startSession({ publicSlug: wheel.publicSlug });
    expect(a.seed).toBeTruthy();
    expect(b.seed).toBeTruthy();
    expect(a.seed).not.toBe(b.seed);
  });

  it("appends events with monotonic sequences and completes with matching seed", async () => {
    const wheel = buildWheelSnapshot();
    const port = createMemoryPublicPlayPort({
      snapshots: { [wheel.publicSlug]: wheel },
    });
    const session = await port.startSession({
      publicSlug: wheel.publicSlug,
      seed: "seed-events-1",
    });

    await port.appendEvents(session.id, [
      {
        sessionId: session.id,
        sequence: 1,
        type: "session.started",
        elapsedMs: 0,
      },
      {
        sessionId: session.id,
        sequence: 2,
        type: "game.completed",
        elapsedMs: 1200,
      },
    ]);

    const result: ResultContract = {
      sessionId: session.id,
      templateKey: "wheel",
      templateVersion: 1,
      activityId: wheel.activityId,
      activityRevision: 1,
      seed: "seed-events-1",
      status: "completed",
      score: null,
      durationMs: 1200,
      templateDetail: { version: 1 },
      completedAt: new Date().toISOString(),
    };

    await port.completeSession(session.id, result);
    await expect(port.getResult?.(session.id)).resolves.toMatchObject({
      seed: "seed-events-1",
      score: null,
    });

    // Idempotent double complete
    await port.completeSession(session.id, { ...result, durationMs: 9999 });
    await expect(port.getResult?.(session.id)).resolves.toMatchObject({
      durationMs: 1200,
    });
  });

  it("submitLeaderboard is a no-op for unscored wheel", async () => {
    const wheel = buildWheelSnapshot();
    const port = createMemoryPublicPlayPort({
      snapshots: { [wheel.publicSlug]: wheel },
    });
    const session = await port.startSession({
      publicSlug: wheel.publicSlug,
      seed: "wheel-lb",
    });
    const result: ResultContract = {
      sessionId: session.id,
      templateKey: "wheel",
      templateVersion: 1,
      activityId: wheel.activityId,
      activityRevision: 1,
      seed: "wheel-lb",
      status: "completed",
      score: null,
      durationMs: 500,
      templateDetail: { version: 1 },
      completedAt: new Date().toISOString(),
    };
    await port.completeSession(session.id, result);
    await port.submitLeaderboard(session.id, "Alex");
    await expect(port.getLeaderboard?.(wheel.publicSlug)).resolves.toEqual([]);
  });

  it("accepts leaderboard for scored templates and sorts ties", async () => {
    const quiz = buildScoredQuizSnapshot();
    const port = createMemoryPublicPlayPort({
      snapshots: { [quiz.publicSlug]: quiz },
    });

    async function play(seed: string, score: number, durationMs: number, at: string) {
      const session = await port.startSession({
        publicSlug: quiz.publicSlug,
        seed,
      });
      const result: ResultContract = {
        sessionId: session.id,
        templateKey: "gameshow-quiz",
        templateVersion: 1,
        activityId: quiz.activityId,
        activityRevision: 1,
        seed,
        status: "completed",
        score,
        durationMs,
        templateDetail: { version: 1 },
        completedAt: at,
      };
      await port.completeSession(session.id, result);
      await port.submitLeaderboard(session.id, seed);
      return session.id;
    }

    await play("p1", 50, 3000, "2026-01-01T00:00:02.000Z");
    await play("p2", 80, 5000, "2026-01-01T00:00:01.000Z");
    await play("p3", 80, 2000, "2026-01-01T00:00:03.000Z");

    const board = await port.getLeaderboard?.(quiz.publicSlug);
    expect(board?.map((e) => e.displayName)).toEqual(["p3", "p2", "p1"]);
  });
});

describe("compareLeaderboard", () => {
  it("sorts score desc, duration asc, completedAt asc", () => {
    const entries: LeaderboardEntry[] = [
      {
        sessionId: "a",
        displayName: "A",
        score: 10,
        durationMs: 100,
        completedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        sessionId: "b",
        displayName: "B",
        score: 20,
        durationMs: 500,
        completedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        sessionId: "c",
        displayName: "C",
        score: 20,
        durationMs: 100,
        completedAt: "2026-01-03T00:00:00.000Z",
      },
    ];
    const sorted = [...entries].sort(compareLeaderboard);
    expect(sorted.map((e) => e.displayName)).toEqual(["C", "B", "A"]);
  });
});
