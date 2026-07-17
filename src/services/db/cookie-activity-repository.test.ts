import { describe, expect, it } from "vitest";
import {
  CookieActivityRepository,
  decodeStoreChunks,
  encodeStoreChunks,
  slimSnapshot,
} from "@/services/db/cookie-activity-repository";
import type { MemoryStoreSnapshot } from "@/services/db/memory-activity-repository";
import { DEV_OWNER_ID } from "@/features/auth/constants";
import { buildListContent } from "@/test/fixtures/builders";

function sampleSnapshot(): MemoryStoreSnapshot {
  const content = buildListContent();
  const now = new Date().toISOString();
  return {
    activities: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        ownerId: DEV_OWNER_ID,
        folderId: null,
        title: "Wheel demo",
        instruction: null,
        templateKey: "wheel",
        contentFamily: "list",
        contentVersion: 1,
        content,
        settings: {},
        themeKey: "classic",
        lifecycleState: "draft",
        publicSlug: null,
        revision: 2,
        playCount: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ],
    versions: [
      {
        id: "v1",
        activityId: "11111111-1111-4111-8111-111111111111",
        revision: 1,
        content,
        settings: {},
        themeKey: "classic",
        authorId: DEV_OWNER_ID,
        reason: "autosave",
        createdAt: now,
      },
      {
        id: "v2",
        activityId: "11111111-1111-4111-8111-111111111111",
        revision: 2,
        content,
        settings: {},
        themeKey: "classic",
        authorId: DEV_OWNER_ID,
        reason: "autosave",
        createdAt: now,
      },
    ],
    folders: [],
  };
}

describe("cookie activity store encoding", () => {
  it("round-trips a slimmed snapshot through deflate chunks", () => {
    const snapshot = sampleSnapshot();
    const chunks = encodeStoreChunks(snapshot);
    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(3000);
    }
    const decoded = decodeStoreChunks(chunks);
    expect(decoded).not.toBeNull();
    expect(decoded!.activities).toHaveLength(1);
    expect(decoded!.activities[0]!.title).toBe("Wheel demo");
    // slim keeps only latest version
    expect(decoded!.versions).toHaveLength(1);
    expect(decoded!.versions[0]!.revision).toBe(2);
  });

  it("slimSnapshot caps and keeps latest versions only", () => {
    const snapshot = sampleSnapshot();
    const slim = slimSnapshot(snapshot);
    expect(slim.versions).toHaveLength(1);
    expect(slim.versions[0]!.revision).toBe(2);
  });

  it("returns null for corrupt chunks", () => {
    expect(decodeStoreChunks(["%%%not-valid%%%"])).toBeNull();
  });
});

describe("CookieActivityRepository (seeded, no cookie flush)", () => {
  it("lists and loads owner activities from a snapshot", async () => {
    const repo = CookieActivityRepository.fromSnapshot(sampleSnapshot());
    const listed = await repo.listOwnerActivities(DEV_OWNER_ID);
    expect(listed).toHaveLength(1);
    expect(listed[0]!.title).toBe("Wheel demo");

    const detail = await repo.getOwnerActivity(
      DEV_OWNER_ID,
      "11111111-1111-4111-8111-111111111111",
    );
    expect(detail?.activity.revision).toBe(2);
  });
});
