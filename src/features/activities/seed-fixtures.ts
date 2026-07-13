import { randomUUID } from "node:crypto";
import { buildListContent } from "@/test/fixtures/builders";
import { defaultWheelSettings } from "@/features/templates/wheel/registration";
import type { MemoryStoreSnapshot } from "@/services/db/memory-activity-repository";
import { generatePublicSlug } from "@/services/db/slug";
import { DEV_OWNER_ID } from "@/features/auth/constants";

/**
 * Idempotent memory-repo seed fixtures for local/dev list.v1 wheel content.
 * Matches `buildListContent` classroom supplies fixture.
 */
export function buildMemorySeedFixtures(
  ownerId: string = DEV_OWNER_ID,
): MemoryStoreSnapshot {
  const now = new Date().toISOString();
  const draftId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
  const publishedId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
  const listContent = buildListContent();
  const settings = {
    ...defaultWheelSettings(),
    __isScored: false,
    __hasLeaderboard: false,
    __templateVersion: 1,
  };
  const publishedSlug = generatePublicSlug();

  const draft = {
    id: draftId,
    ownerId,
    folderId: null,
    title: "Classroom supplies (draft)",
    instruction: listContent.instruction ?? null,
    templateKey: "wheel" as const,
    contentFamily: "list",
    contentVersion: 1,
    content: { family: "list" as const, version: 1 as const, items: [] },
    settings: defaultWheelSettings() as unknown as Record<string, unknown>,
    themeKey: "classic",
    lifecycleState: "draft" as const,
    publicSlug: null,
    revision: 0,
    playCount: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const published = {
    id: publishedId,
    ownerId,
    folderId: null,
    title: "Classroom supplies",
    instruction: listContent.instruction ?? null,
    templateKey: "wheel" as const,
    contentFamily: "list",
    contentVersion: 1,
    content: listContent,
    settings: settings as unknown as Record<string, unknown>,
    themeKey: "classic",
    lifecycleState: "published" as const,
    publicSlug: publishedSlug,
    revision: 1,
    playCount: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  return {
    activities: [draft, published],
    versions: [
      {
        id: randomUUID(),
        activityId: draftId,
        revision: 0,
        content: draft.content,
        settings: draft.settings,
        themeKey: "classic",
        authorId: ownerId,
        reason: "autosave",
        createdAt: now,
      },
      {
        id: randomUUID(),
        activityId: publishedId,
        revision: 1,
        content: listContent,
        settings: settings as unknown as Record<string, unknown>,
        themeKey: "classic",
        authorId: ownerId,
        reason: "done",
        createdAt: now,
      },
    ],
    folders: [],
  };
}
