import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { PublicActivitySnapshot } from "@/domain/snapshot";
import { ActivityError } from "@/services/db/errors";
import { generatePublicSlug } from "@/services/db/slug";
import type {
  ActivityDetail,
  ActivityRecord,
  ActivityRepository,
  ActivitySummary,
  ActivityVersionRecord,
  AutosaveInput,
  AutosaveResult,
  CreateDraftInput,
  CreateFolderInput,
  FinalizeInput,
  FolderRecord,
  ListActivitiesQuery,
} from "@/services/db/types";

export interface MemoryStoreSnapshot {
  activities: ActivityRecord[];
  versions: ActivityVersionRecord[];
  folders: FolderRecord[];
}

export interface MemoryActivityRepositoryOptions {
  /**
   * When set, persist store to this JSON file so local Node process restarts
   * (and Next dev HMR) can recover data. Directory is created if missing.
   */
  persistPath?: string | null;
  /** Seed data applied once when store is empty. */
  seed?: MemoryStoreSnapshot | null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function deepClone<T>(value: T): T {
  return structuredClone(value);
}

function toSummary(activity: ActivityRecord): ActivitySummary {
  return {
    id: activity.id,
    title: activity.title,
    templateKey: activity.templateKey,
    folderId: activity.folderId,
    lifecycleState: activity.lifecycleState,
    publicSlug: activity.publicSlug,
    revision: activity.revision,
    playCount: activity.playCount,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    deletedAt: activity.deletedAt,
  };
}

/**
 * In-memory activity repository (default when Supabase env is missing).
 * Optional JSON file under `.data/` for local durability across reloads.
 */
export class MemoryActivityRepository implements ActivityRepository {
  private activities = new Map<string, ActivityRecord>();
  private versions = new Map<string, ActivityVersionRecord[]>();
  private folders = new Map<string, FolderRecord>();
  private readonly persistPath: string | null;

  constructor(options: MemoryActivityRepositoryOptions = {}) {
    this.persistPath = options.persistPath ?? null;
    this.loadFromDisk();
    if (this.activities.size === 0 && options.seed) {
      this.applySnapshot(options.seed);
      this.persist();
    }
  }

  reset(): void {
    this.activities.clear();
    this.versions.clear();
    this.folders.clear();
    this.persist();
  }

  /** Replace store contents (tests / seed). */
  applySnapshot(snapshot: MemoryStoreSnapshot): void {
    this.activities.clear();
    this.versions.clear();
    this.folders.clear();
    for (const a of snapshot.activities) {
      this.activities.set(a.id, deepClone(a));
    }
    for (const v of snapshot.versions) {
      const list = this.versions.get(v.activityId) ?? [];
      list.push(deepClone(v));
      this.versions.set(v.activityId, list);
    }
    for (const f of snapshot.folders) {
      this.folders.set(f.id, deepClone(f));
    }
  }

  exportSnapshot(): MemoryStoreSnapshot {
    return {
      activities: [...this.activities.values()].map(deepClone),
      versions: [...this.versions.values()].flat().map(deepClone),
      folders: [...this.folders.values()].map(deepClone),
    };
  }

  private loadFromDisk(): void {
    if (!this.persistPath || !existsSync(this.persistPath)) {
      return;
    }
    try {
      const raw = readFileSync(this.persistPath, "utf8");
      const parsed = JSON.parse(raw) as MemoryStoreSnapshot;
      this.applySnapshot(parsed);
    } catch {
      // Corrupt local file: start empty rather than crash the app.
    }
  }

  private persist(): void {
    if (!this.persistPath) {
      return;
    }
    const dir = path.dirname(this.persistPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(
      this.persistPath,
      JSON.stringify(this.exportSnapshot(), null, 2),
      "utf8",
    );
  }

  private requireOwned(
    ownerId: string,
    activityId: string,
    options?: { includeDeleted?: boolean },
  ): ActivityRecord {
    const activity = this.activities.get(activityId);
    if (!activity) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    // Do not leak existence of another owner's activity.
    if (activity.ownerId !== ownerId) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    if (activity.deletedAt && !options?.includeDeleted) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    return activity;
  }

  private uniqueSlug(): string {
    for (let i = 0; i < 8; i++) {
      const slug = generatePublicSlug();
      const taken = [...this.activities.values()].some(
        (a) => a.publicSlug === slug,
      );
      if (!taken) {
        return slug;
      }
    }
    throw new ActivityError("CONFIG", "Unable to allocate unique public slug");
  }

  private pushVersion(
    activity: ActivityRecord,
    reason: ActivityVersionRecord["reason"],
    authorId: string | null,
  ): ActivityVersionRecord {
    const version: ActivityVersionRecord = {
      id: randomUUID(),
      activityId: activity.id,
      revision: activity.revision,
      content: deepClone(activity.content),
      settings: deepClone(activity.settings),
      themeKey: activity.themeKey,
      authorId,
      reason,
      createdAt: nowIso(),
    };
    const list = this.versions.get(activity.id) ?? [];
    list.push(version);
    this.versions.set(activity.id, list);
    return version;
  }

  async createDraft(input: CreateDraftInput): Promise<ActivityRecord> {
    const createdAt = nowIso();
    const activity: ActivityRecord = {
      id: randomUUID(),
      ownerId: input.ownerId,
      folderId: input.folderId ?? null,
      title: (input.title?.trim() || "Untitled activity").slice(0, 200),
      instruction: input.instruction ?? null,
      templateKey: input.templateKey,
      contentFamily: input.contentFamily,
      contentVersion: input.contentVersion,
      content: deepClone(input.content),
      settings: deepClone(input.settings ?? {}),
      themeKey: input.themeKey ?? "classic",
      lifecycleState: "draft",
      publicSlug: null,
      revision: 0,
      playCount: 0,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    };
    this.activities.set(activity.id, activity);
    this.pushVersion(activity, "autosave", input.ownerId);
    this.persist();
    return deepClone(activity);
  }

  async getOwnerActivity(
    ownerId: string,
    activityId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ActivityDetail | null> {
    try {
      const activity = this.requireOwned(ownerId, activityId, options);
      const versions = this.versions.get(activity.id) ?? [];
      const latest =
        versions.length > 0
          ? deepClone(
              versions.reduce((a, b) => (a.revision >= b.revision ? a : b)),
            )
          : null;
      return { activity: deepClone(activity), latestVersion: latest };
    } catch (error) {
      if (error instanceof ActivityError && error.code === "NOT_FOUND") {
        return null;
      }
      if (error instanceof ActivityError && error.code === "FORBIDDEN") {
        return null;
      }
      throw error;
    }
  }

  async autosave(input: AutosaveInput): Promise<AutosaveResult> {
    const activity = this.requireOwned(input.ownerId, input.activityId);
    if (activity.revision !== input.baseRevision) {
      throw new ActivityError(
        "CONFLICT",
        `Revision conflict: expected base ${input.baseRevision}, server has ${activity.revision}`,
        { serverRevision: activity.revision, baseRevision: input.baseRevision },
      );
    }

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) {
        throw new ActivityError("VALIDATION", "Title cannot be empty");
      }
      activity.title = title.slice(0, 200);
    }
    if (input.instruction !== undefined) {
      activity.instruction = input.instruction;
    }
    if (input.content !== undefined) {
      activity.content = deepClone(input.content);
    }
    if (input.settings !== undefined) {
      activity.settings = deepClone(input.settings);
    }
    if (input.themeKey !== undefined) {
      activity.themeKey = input.themeKey;
    }

    activity.revision += 1;
    activity.updatedAt = nowIso();
    const version = this.pushVersion(activity, "autosave", input.ownerId);
    this.persist();
    return {
      activity: deepClone(activity),
      version: deepClone(version),
    };
  }

  async finalize(input: FinalizeInput): Promise<ActivityRecord> {
    const activity = this.requireOwned(input.ownerId, input.activityId);
    if (activity.revision !== input.baseRevision) {
      throw new ActivityError(
        "CONFLICT",
        `Revision conflict: expected base ${input.baseRevision}, server has ${activity.revision}`,
        { serverRevision: activity.revision, baseRevision: input.baseRevision },
      );
    }

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) {
        throw new ActivityError("VALIDATION", "Title cannot be empty");
      }
      activity.title = title.slice(0, 200);
    }
    if (input.instruction !== undefined) {
      activity.instruction = input.instruction;
    }
    activity.content = deepClone(input.playableContent);
    activity.settings = {
      ...deepClone(input.playableSettings),
      __isScored: input.isScored,
      __hasLeaderboard: input.hasLeaderboard,
      __templateVersion: input.templateVersion,
    };
    if (input.themeKey !== undefined) {
      activity.themeKey = input.themeKey;
    }

    activity.revision += 1;
    activity.updatedAt = nowIso();

    if (input.publish !== false) {
      activity.lifecycleState = "published";
      if (!activity.publicSlug) {
        activity.publicSlug = this.uniqueSlug();
      }
    }

    this.pushVersion(activity, "done", input.ownerId);
    this.persist();
    return deepClone(activity);
  }

  async listOwnerActivities(
    ownerId: string,
    query: ListActivitiesQuery = {},
  ): Promise<ActivitySummary[]> {
    let rows = [...this.activities.values()].filter(
      (a) => a.ownerId === ownerId,
    );

    if (!query.includeDeleted) {
      rows = rows.filter((a) => !a.deletedAt);
    }

    if (query.templateKey) {
      rows = rows.filter((a) => a.templateKey === query.templateKey);
    }

    if (query.folderId !== undefined) {
      rows = rows.filter((a) => a.folderId === query.folderId);
    }

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      rows = rows.filter((a) => {
        if (a.title.toLowerCase().includes(q)) {
          return true;
        }
        try {
          return JSON.stringify(a.content).toLowerCase().includes(q);
        } catch {
          return false;
        }
      });
    }

    const sortBy = query.sortBy ?? "updatedAt";
    const sortDir = query.sortDir ?? "desc";
    const dir = sortDir === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "createdAt":
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
        case "playCount":
          cmp = a.playCount - b.playCount;
          break;
        case "updatedAt":
        default:
          cmp = a.updatedAt.localeCompare(b.updatedAt);
          break;
      }
      return cmp * dir;
    });

    return rows.map(toSummary);
  }

  async duplicate(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const source = this.requireOwned(ownerId, activityId);
    const createdAt = nowIso();
    const titleBase = source.title.endsWith(" copy")
      ? source.title
      : `${source.title} copy`;
    const activity: ActivityRecord = {
      id: randomUUID(),
      ownerId,
      folderId: source.folderId,
      title: titleBase.slice(0, 200),
      instruction: source.instruction,
      templateKey: source.templateKey,
      contentFamily: source.contentFamily,
      contentVersion: source.contentVersion,
      content: deepClone(source.content),
      settings: deepClone(source.settings),
      themeKey: source.themeKey,
      lifecycleState: "draft",
      publicSlug: null,
      revision: 0,
      playCount: 0,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    };
    this.activities.set(activity.id, activity);
    this.pushVersion(activity, "autosave", ownerId);
    this.persist();
    return deepClone(activity);
  }

  async rename(
    ownerId: string,
    activityId: string,
    title: string,
  ): Promise<ActivityRecord> {
    const activity = this.requireOwned(ownerId, activityId);
    const next = title.trim();
    if (!next) {
      throw new ActivityError("VALIDATION", "Title cannot be empty");
    }
    activity.title = next.slice(0, 200);
    activity.updatedAt = nowIso();
    this.persist();
    return deepClone(activity);
  }

  async moveFolder(
    ownerId: string,
    activityId: string,
    folderId: string | null,
  ): Promise<ActivityRecord> {
    const activity = this.requireOwned(ownerId, activityId);
    if (folderId !== null) {
      const folder = this.folders.get(folderId);
      if (!folder || folder.ownerId !== ownerId) {
        throw new ActivityError("VALIDATION", "Folder not found");
      }
    }
    activity.folderId = folderId;
    activity.updatedAt = nowIso();
    this.persist();
    return deepClone(activity);
  }

  async softDelete(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const activity = this.requireOwned(ownerId, activityId);
    activity.deletedAt = nowIso();
    activity.updatedAt = activity.deletedAt;
    this.persist();
    return deepClone(activity);
  }

  async listTrash(ownerId: string): Promise<ActivitySummary[]> {
    return [...this.activities.values()]
      .filter((a) => a.ownerId === ownerId && a.deletedAt)
      .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""))
      .map(toSummary);
  }

  async restore(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const activity = this.requireOwned(ownerId, activityId, {
      includeDeleted: true,
    });
    if (!activity.deletedAt) {
      throw new ActivityError("INVALID_STATE", "Activity is not in trash");
    }
    activity.deletedAt = null;
    activity.updatedAt = nowIso();
    // Intentionally does NOT re-publish or change lifecycle_state
    // (disabled/archived stays disabled after restore).
    this.persist();
    return deepClone(activity);
  }

  async publish(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const activity = this.requireOwned(ownerId, activityId);
    activity.lifecycleState = "published";
    if (!activity.publicSlug) {
      activity.publicSlug = this.uniqueSlug();
    }
    activity.updatedAt = nowIso();
    this.persist();
    return deepClone(activity);
  }

  async disablePublic(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const activity = this.requireOwned(ownerId, activityId);
    activity.lifecycleState = "archived";
    activity.updatedAt = nowIso();
    this.persist();
    return deepClone(activity);
  }

  async regeneratePublicSlug(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const activity = this.requireOwned(ownerId, activityId);
    activity.publicSlug = this.uniqueSlug();
    activity.updatedAt = nowIso();
    this.persist();
    return deepClone(activity);
  }

  async resolvePublicSnapshot(
    publicSlug: string,
  ): Promise<PublicActivitySnapshot | null> {
    if (!publicSlug) {
      return null;
    }
    const activity = [...this.activities.values()].find(
      (a) => a.publicSlug === publicSlug,
    );
    if (!activity) {
      return null;
    }
    if (activity.deletedAt) {
      return null;
    }
    if (activity.lifecycleState !== "published") {
      return null;
    }

    // Registry capabilities are supplied at finalize time into settings meta
    // or derived by service layer. Memory store embeds flags on settings when
    // finalized; fall back to conservative defaults.
    const settings = activity.settings as Record<string, unknown>;
    const isScored =
      typeof settings.__isScored === "boolean" ? settings.__isScored : false;
    const hasLeaderboard =
      typeof settings.__hasLeaderboard === "boolean"
        ? settings.__hasLeaderboard
        : false;
    const templateVersion =
      typeof settings.__templateVersion === "number"
        ? settings.__templateVersion
        : 1;

    const publicSettings = { ...settings };
    delete publicSettings.__isScored;
    delete publicSettings.__hasLeaderboard;
    delete publicSettings.__templateVersion;

    const snapshot: PublicActivitySnapshot = {
      activityId: activity.id,
      publicSlug: activity.publicSlug!,
      revision: activity.revision,
      title: activity.title,
      instruction: activity.instruction ?? undefined,
      templateKey: activity.templateKey,
      templateVersion,
      content: activity.content as PublicActivitySnapshot["content"],
      settings: publicSettings,
      themeKey: activity.themeKey,
      isScored,
      hasLeaderboard,
    };

    return deepClone(snapshot);
  }

  async createFolder(input: CreateFolderInput): Promise<FolderRecord> {
    const name = input.name.trim();
    if (!name) {
      throw new ActivityError("VALIDATION", "Folder name cannot be empty");
    }
    const createdAt = nowIso();
    const folder: FolderRecord = {
      id: randomUUID(),
      ownerId: input.ownerId,
      name: name.slice(0, 120),
      sortOrder: input.sortOrder ?? 0,
      createdAt,
      updatedAt: createdAt,
    };
    this.folders.set(folder.id, folder);
    this.persist();
    return deepClone(folder);
  }

  async listFolders(ownerId: string): Promise<FolderRecord[]> {
    return [...this.folders.values()]
      .filter((f) => f.ownerId === ownerId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map(deepClone);
  }

  async renameFolder(
    ownerId: string,
    folderId: string,
    name: string,
  ): Promise<FolderRecord> {
    const folder = this.folders.get(folderId);
    if (!folder || folder.ownerId !== ownerId) {
      throw new ActivityError("NOT_FOUND", "Folder not found");
    }
    const next = name.trim();
    if (!next) {
      throw new ActivityError("VALIDATION", "Folder name cannot be empty");
    }
    folder.name = next.slice(0, 120);
    folder.updatedAt = nowIso();
    this.persist();
    return deepClone(folder);
  }
}
