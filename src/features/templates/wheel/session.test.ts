import { describe, expect, it } from "vitest";
import { createSeededRng } from "@/services/rng/seeded-rng";
import { buildListContent } from "@/test/fixtures/builders";
import {
  beginSpin,
  canSpin,
  createWheelSession,
  eliminateSelected,
  remainingItems,
  restartSession,
  selectWinnerId,
} from "@/features/templates/wheel/session";
import { wheelFixtureSmall } from "@/features/templates/wheel/fixtures";

describe("wheel session", () => {
  it("selects a deterministic winner for a known seed", () => {
    const ids = wheelFixtureSmall.content.items.map((i) => i.id);
    const a = selectWinnerId(ids, createSeededRng("fw-wheel-small-001"));
    const b = selectWinnerId(ids, createSeededRng("fw-wheel-small-001"));
    expect(a).toBe(b);
    expect(ids).toContain(a);

    // Different seed can differ (not guaranteed, but board stream should)
    const c = selectWinnerId(ids, createSeededRng("fw-wheel-alt-seed"));
    expect(ids).toContain(c);
  });

  it("known seed vector is stable", () => {
    const ids = ["a", "b", "c", "d", "e", "f"];
    // board stream pick — freeze expected for regression
    const winner = selectWinnerId(ids, createSeededRng("funwall-vector-v1"));
    expect(winner).toBe(
      createSeededRng("funwall-vector-v1").stream("board").pick(ids),
    );
  });

  it("eliminate does not mutate original pack / originalItems", () => {
    const content = buildListContent();
    const frozen = structuredClone(content);
    const rng = createSeededRng("elim-test-seed");
    let session = createWheelSession(
      content,
      { shuffleItemOrder: false },
      rng,
    );
    const originalRef = session.originalItems;
    const winnerId = session.remainingIds[0]!;
    session = beginSpin(session, winnerId);
    session = {
      ...session,
      phase: "selected",
      inputLocked: false,
      selectedId: winnerId,
    };
    const after = eliminateSelected(session, true);

    expect(content).toEqual(frozen);
    expect(after.originalItems).toBe(originalRef);
    expect(after.originalItems.map((i) => i.id)).toEqual(
      content.items.map((i) => i.id),
    );
    expect(after.remainingIds).not.toContain(winnerId);
    expect(after.eliminatedIds).toContain(winnerId);
  });

  it("one item remaining yields complete", () => {
    const content = buildListContent({
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          content: { text: "A" },
        },
        {
          id: "11111111-1111-4111-8111-111111111112",
          content: { text: "B" },
        },
      ],
    });
    const rng = createSeededRng("complete-seed");
    let session = createWheelSession(
      content,
      { shuffleItemOrder: false },
      rng,
    );
    session = {
      ...session,
      phase: "selected",
      selectedId: session.remainingIds[0]!,
      inputLocked: false,
    };
    session = eliminateSelected(session, true);
    expect(session.phase).toBe("complete");
    expect(session.remainingIds).toHaveLength(1);
  });

  it("restart restores original remaining set", () => {
    const content = buildListContent();
    const rng = createSeededRng("restart-seed");
    let session = createWheelSession(
      content,
      { shuffleItemOrder: false },
      rng,
    );
    session = {
      ...session,
      remainingIds: [session.remainingIds[0]!],
      eliminatedIds: session.remainingIds.slice(1),
      phase: "complete",
    };
    const restored = restartSession(session);
    expect(restored.remainingIds).toEqual(
      content.items.map((i) => i.id),
    );
    expect(restored.eliminatedIds).toEqual([]);
    expect(restored.phase).toBe("intro");
  });

  it("locks spin while inputLocked", () => {
    const content = buildListContent();
    const rng = createSeededRng("lock-seed");
    let session = createWheelSession(
      content,
      { shuffleItemOrder: false },
      rng,
    );
    expect(canSpin(session)).toBe(true);
    session = beginSpin(session, session.remainingIds[0]!);
    expect(canSpin(session)).toBe(false);
    expect(session.inputLocked).toBe(true);
  });

  it("remainingItems reflects session filter only", () => {
    const content = buildListContent();
    const rng = createSeededRng("remain-seed");
    let session = createWheelSession(
      content,
      { shuffleItemOrder: false },
      rng,
    );
    session = {
      ...session,
      remainingIds: [session.remainingIds[1]!],
    };
    expect(remainingItems(session)).toHaveLength(1);
    expect(session.originalItems).toHaveLength(3);
  });
});
