import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildListContent } from "@/test/fixtures/builders";
import { DEV_OWNER_ID } from "@/features/auth/constants";
import {
  createActivityService,
  type ActivityService,
} from "@/features/activities/activity-service";
import { MemoryActivityRepository } from "@/services/db/memory-activity-repository";
import { ActivityError } from "@/services/db/errors";
import {
  generatePublicSlug,
  isSlugEntropySufficient,
  estimateSlugEntropyBits,
  PUBLIC_SLUG_MIN_BITS,
} from "@/services/db/slug";
import { resetProductRegistryForTests } from "@/features/templates/registry";

const OWNER_A = DEV_OWNER_ID;
const OWNER_B = "00000000-0000-4000-8000-0000000000b2";

describe("slug entropy", () => {
  it("generates URL-safe slugs with at least 128 bits of entropy", () => {
    const slug = generatePublicSlug();
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(isSlugEntropySufficient(slug)).toBe(true);
    expect(estimateSlugEntropyBits(slug)).toBeGreaterThanOrEqual(
      PUBLIC_SLUG_MIN_BITS,
    );
  });

  it("rejects under-sized byte length", () => {
    expect(() => generatePublicSlug(8)).toThrow(/128/);
  });
});

describe("ActivityService + MemoryActivityRepository", () => {
  let repo: MemoryActivityRepository;
  let service: ActivityService;

  beforeEach(() => {
    resetProductRegistryForTests();
    repo = new MemoryActivityRepository({ persistPath: null });
    service = createActivityService(repo);
  });

  afterEach(() => {
    repo.reset();
    resetProductRegistryForTests();
  });

  it("creates a draft with empty list content for wheel", async () => {
    const draft = await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
      title: "My wheel",
    });
    expect(draft.lifecycleState).toBe("draft");
    expect(draft.publicSlug).toBeNull();
    expect(draft.revision).toBe(0);
    expect(draft.content).toMatchObject({ family: "list", version: 1, items: [] });
  });

  it("rejects unregistered templates", async () => {
    await expect(
      service.createDraft({
        ownerId: OWNER_A,
        templateKey: "matching-pairs",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("autosaves with compare-and-swap and conflicts on stale base", async () => {
    const draft = await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
    });

    const first = await service.autosave({
      ownerId: OWNER_A,
      activityId: draft.id,
      baseRevision: 0,
      content: buildListContent(),
      title: "Rev 1",
    });
    expect(first.activity.revision).toBe(1);
    expect(first.activity.title).toBe("Rev 1");

    const second = await service.autosave({
      ownerId: OWNER_A,
      activityId: draft.id,
      baseRevision: 1,
      title: "Rev 2",
    });
    expect(second.activity.revision).toBe(2);

    await expect(
      service.autosave({
        ownerId: OWNER_A,
        activityId: draft.id,
        baseRevision: 1,
        title: "stale",
      }),
    ).rejects.toBeInstanceOf(ActivityError);

    try {
      await service.autosave({
        ownerId: OWNER_A,
        activityId: draft.id,
        baseRevision: 0,
        title: "stale again",
      });
      expect.fail("expected conflict");
    } catch (error) {
      expect(error).toBeInstanceOf(ActivityError);
      expect((error as ActivityError).code).toBe("CONFLICT");
    }

    const detail = await service.getOwnerActivity(OWNER_A, draft.id);
    expect(detail?.activity.revision).toBe(2);
    expect(detail?.activity.title).toBe("Rev 2");
  });

  it("finalize validates playable content and publishes with public slug", async () => {
    const draft = await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
      title: "Publish me",
    });

    await expect(
      service.finalize({
        ownerId: OWNER_A,
        activityId: draft.id,
        baseRevision: 0,
        content: { family: "list", version: 1, items: [] },
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    const published = await service.finalize({
      ownerId: OWNER_A,
      activityId: draft.id,
      baseRevision: 0,
      content: buildListContent(),
    });

    expect(published.lifecycleState).toBe("published");
    expect(published.publicSlug).toBeTruthy();
    expect(isSlugEntropySufficient(published.publicSlug!)).toBe(true);
    expect(published.revision).toBe(1);

    const snapshot = await service.resolvePublicSnapshot(
      published.publicSlug!,
    );
    expect(snapshot).not.toBeNull();
    expect(snapshot!.title).toBe("Publish me");
    expect(snapshot!.templateKey).toBe("wheel");
    expect(snapshot!.isScored).toBe(false);
    expect(snapshot!.hasLeaderboard).toBe(false);
    expect(snapshot).not.toHaveProperty("ownerId");
  });

  it("duplicate isolates content and uses a new id/slug", async () => {
    const draft = await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
      title: "Original",
    });
    await service.autosave({
      ownerId: OWNER_A,
      activityId: draft.id,
      baseRevision: 0,
      content: buildListContent(),
    });
    const published = await service.finalize({
      ownerId: OWNER_A,
      activityId: draft.id,
      baseRevision: 1,
      content: buildListContent(),
    });

    const copy = await service.duplicate(OWNER_A, published.id);
    expect(copy.id).not.toBe(published.id);
    expect(copy.title).toBe("Original copy");
    expect(copy.publicSlug).toBeNull();
    expect(copy.lifecycleState).toBe("draft");
    expect(copy.revision).toBe(0);

    await service.autosave({
      ownerId: OWNER_A,
      activityId: copy.id,
      baseRevision: 0,
      title: "Copy renamed",
      content: buildListContent({
        items: [
          {
            id: "11111111-1111-4111-8111-111111111199",
            content: { text: "Only on copy" },
          },
          {
            id: "11111111-1111-4111-8111-111111111198",
            content: { text: "Also copy" },
          },
        ],
      }),
    });

    const source = await service.getOwnerActivity(OWNER_A, published.id);
    expect(source?.activity.title).toBe("Original");
    expect(source?.activity.publicSlug).toBe(published.publicSlug);
    expect(
      (source?.activity.content as { items: { content: { text: string } }[] })
        .items[0]?.content.text,
    ).toBe("Pencil");
  });

  it("soft-delete hides public snapshot; restore keeps disabled state", async () => {
    const draft = await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
      title: "Delete me",
    });
    const published = await service.finalize({
      ownerId: OWNER_A,
      activityId: draft.id,
      baseRevision: 0,
      content: buildListContent(),
    });
    const slug = published.publicSlug!;
    expect(await service.resolvePublicSnapshot(slug)).not.toBeNull();

    await service.softDelete(OWNER_A, published.id);
    expect(await service.resolvePublicSnapshot(slug)).toBeNull();
    expect(
      (await service.listOwnerActivities(OWNER_A)).map((a) => a.id),
    ).not.toContain(published.id);
    expect(
      (await service.listTrash(OWNER_A)).map((a) => a.id),
    ).toContain(published.id);

    // Disable then soft-delete then restore must not re-publish
    const d2 = await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
      title: "Disable restore",
    });
    const p2 = await service.finalize({
      ownerId: OWNER_A,
      activityId: d2.id,
      baseRevision: 0,
      content: buildListContent(),
    });
    await service.disablePublic(OWNER_A, p2.id);
    expect(await service.resolvePublicSnapshot(p2.publicSlug!)).toBeNull();
    await service.softDelete(OWNER_A, p2.id);
    const restored = await service.restore(OWNER_A, p2.id);
    expect(restored.lifecycleState).toBe("archived");
    expect(await service.resolvePublicSnapshot(p2.publicSlug!)).toBeNull();
  });

  it("owner B cannot read owner A activities (service authz)", async () => {
    const draft = await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
    });
    const other = await service.getOwnerActivity(OWNER_B, draft.id);
    expect(other).toBeNull();

    await expect(
      service.autosave({
        ownerId: OWNER_B,
        activityId: draft.id,
        baseRevision: 0,
        title: "hack",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(service.softDelete(OWNER_B, draft.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("list search filters by title", async () => {
    await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
      title: "Alpha wheel",
    });
    await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
      title: "Beta quiz",
    });
    const found = await service.listOwnerActivities(OWNER_A, {
      search: "alpha",
    });
    expect(found).toHaveLength(1);
    expect(found[0]!.title).toBe("Alpha wheel");
  });

  it("regenerate public slug invalidates the old link", async () => {
    const draft = await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
    });
    const published = await service.finalize({
      ownerId: OWNER_A,
      activityId: draft.id,
      baseRevision: 0,
      content: buildListContent(),
    });
    const oldSlug = published.publicSlug!;
    const next = await service.regeneratePublicSlug(OWNER_A, published.id);
    expect(next.publicSlug).not.toBe(oldSlug);
    expect(await service.resolvePublicSnapshot(oldSlug)).toBeNull();
    expect(await service.resolvePublicSnapshot(next.publicSlug!)).not.toBeNull();
  });

  it("public resolve returns null for drafts without publish", async () => {
    const draft = await service.createDraft({
      ownerId: OWNER_A,
      templateKey: "wheel",
    });
    // Force a slug-like path without publish (simulate leak)
    const row = (await service.getOwnerActivity(OWNER_A, draft.id))!.activity;
    expect(row.publicSlug).toBeNull();
    expect(await service.resolvePublicSnapshot("does-not-exist")).toBeNull();
  });
});
