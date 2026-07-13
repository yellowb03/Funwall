import { describe, expect, it, vi } from "vitest";
import { createSessionEventBuffer } from "@/features/player/session/event-buffer";
import type { SessionEventEnvelope } from "@/domain/session-events";

describe("SessionEventBuffer", () => {
  it("assigns monotonic sequences starting at 1", async () => {
    const flushed: SessionEventEnvelope[][] = [];
    const buffer = createSessionEventBuffer({
      sessionId: "11111111-1111-4111-8111-111111111111",
      getElapsedMs: () => 42,
      flushIntervalMs: 0,
      batchSize: 10,
      flush: async (events) => {
        flushed.push(events);
      },
    });

    buffer.emit({ type: "session.started", elapsedMs: 0 });
    buffer.emit({ type: "game.ready", elapsedMs: 10 });
    expect(buffer.getSequence()).toBe(2);
    await buffer.flush();

    expect(flushed).toHaveLength(1);
    expect(flushed[0]!.map((e) => e.sequence)).toEqual([1, 2]);
    expect(flushed[0]![0]!.sessionId).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    buffer.dispose();
  });

  it("auto-flushes when batch size is reached", async () => {
    const flush = vi.fn(async () => {});
    const buffer = createSessionEventBuffer({
      sessionId: "11111111-1111-4111-8111-111111111111",
      getElapsedMs: () => 0,
      flushIntervalMs: 0,
      batchSize: 2,
      flush,
    });

    buffer.emit({ type: "session.started", elapsedMs: 0 });
    expect(flush).not.toHaveBeenCalled();
    buffer.emit({ type: "game.ready", elapsedMs: 1 });
    // flush is async; wait microtask
    await vi.waitFor(() => expect(flush).toHaveBeenCalledTimes(1));
    buffer.dispose();
  });

  it("re-queues on flush failure for offline retry", async () => {
    let fail = true;
    const received: SessionEventEnvelope[] = [];
    const buffer = createSessionEventBuffer({
      sessionId: "11111111-1111-4111-8111-111111111111",
      getElapsedMs: () => 0,
      flushIntervalMs: 0,
      batchSize: 50,
      flush: async (events) => {
        if (fail) throw new Error("offline");
        received.push(...events);
      },
    });

    buffer.emit({ type: "session.started", elapsedMs: 0 });
    await buffer.flush();
    expect(received).toHaveLength(0);
    expect(buffer.pendingCount()).toBe(1);

    fail = false;
    await buffer.flush();
    expect(received).toHaveLength(1);
    expect(buffer.pendingCount()).toBe(0);
    buffer.dispose();
  });
});
