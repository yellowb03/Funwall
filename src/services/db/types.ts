import type { ContentPackV1 } from "@/domain/content";
import type { PublicActivitySnapshot } from "@/domain/snapshot";
import type { TemplateKey } from "@/domain/template-keys";

/** draft → published → archived (disabled public link without soft-delete). */
export type LifecycleState = "draft" | "published" | "archived";

export type VersionReason = "autosave" | "done" | "conversion" | "restore";

export type ActivitySortField =
  | "updatedAt"
  | "createdAt"
  | "title"
  | "playCount";

export type SortDirection = "asc" | "desc";

/**
 * Owner-facing activity row (includes owner id; never send to public player).
 */
export interface ActivityRecord {
  id: string;
  ownerId: string;
  folderId: string | null;
  title: string;
  instruction: string | null;
  templateKey: TemplateKey;
  contentFamily: string;
  contentVersion: number;
  content: ContentPackV1 | Record<string, unknown>;
  settings: Record<string, unknown>;
  themeKey: string;
  lifecycleState: LifecycleState;
  publicSlug: string | null;
  revision: number;
  playCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ActivityVersionRecord {
  id: string;
  activityId: string;
  revision: number;
  content: ContentPackV1 | Record<string, unknown>;
  settings: Record<string, unknown>;
  themeKey: string;
  authorId: string | null;
  reason: VersionReason;
  createdAt: string;
}

export interface FolderRecord {
  id: string;
  ownerId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Dashboard card / list row. */
export interface ActivitySummary {
  id: string;
  title: string;
  templateKey: TemplateKey;
  folderId: string | null;
  lifecycleState: LifecycleState;
  publicSlug: string | null;
  revision: number;
  playCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ActivityDetail {
  activity: ActivityRecord;
  latestVersion: ActivityVersionRecord | null;
}

export interface CreateDraftInput {
  ownerId: string;
  templateKey: TemplateKey;
  title?: string;
  instruction?: string | null;
  content: ContentPackV1 | Record<string, unknown>;
  settings?: Record<string, unknown>;
  themeKey?: string;
  contentFamily: string;
  contentVersion: number;
  folderId?: string | null;
}

export interface AutosaveInput {
  ownerId: string;
  activityId: string;
  /** Client's last known revision (CAS base). */
  baseRevision: number;
  title?: string;
  instruction?: string | null;
  content?: ContentPackV1 | Record<string, unknown>;
  settings?: Record<string, unknown>;
  themeKey?: string;
}

export interface AutosaveResult {
  activity: ActivityRecord;
  version: ActivityVersionRecord;
}

export interface FinalizeInput {
  ownerId: string;
  activityId: string;
  baseRevision: number;
  /** When true, also publish and ensure public slug (Done flow). */
  publish?: boolean;
  title?: string;
  instruction?: string | null;
  content?: ContentPackV1 | Record<string, unknown>;
  settings?: Record<string, unknown>;
  themeKey?: string;
  /** Pre-validated playable content (service layer validates first). */
  playableContent: ContentPackV1 | Record<string, unknown>;
  playableSettings: Record<string, unknown>;
  isScored: boolean;
  hasLeaderboard: boolean;
  templateVersion: number;
}

export interface ListActivitiesQuery {
  search?: string;
  templateKey?: TemplateKey;
  folderId?: string | null;
  sortBy?: ActivitySortField;
  sortDir?: SortDirection;
  includeDeleted?: boolean;
}

export interface CreateFolderInput {
  ownerId: string;
  name: string;
  sortOrder?: number;
}

/**
 * Persistence port for activities. All UI/server actions go through this.
 * Implementations: MemoryActivityRepository, SupabaseActivityRepository.
 */
export interface ActivityRepository {
  createDraft(input: CreateDraftInput): Promise<ActivityRecord>;

  getOwnerActivity(
    ownerId: string,
    activityId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ActivityDetail | null>;

  autosave(input: AutosaveInput): Promise<AutosaveResult>;

  /**
   * Compare-and-swap finalize (Done). Caller must supply validated playable
   * content/settings. Increments revision, writes version reason `done`,
   * optionally publishes and ensures public slug.
   */
  finalize(input: FinalizeInput): Promise<ActivityRecord>;

  listOwnerActivities(
    ownerId: string,
    query?: ListActivitiesQuery,
  ): Promise<ActivitySummary[]>;

  duplicate(ownerId: string, activityId: string): Promise<ActivityRecord>;

  rename(
    ownerId: string,
    activityId: string,
    title: string,
  ): Promise<ActivityRecord>;

  moveFolder(
    ownerId: string,
    activityId: string,
    folderId: string | null,
  ): Promise<ActivityRecord>;

  softDelete(ownerId: string, activityId: string): Promise<ActivityRecord>;

  listTrash(ownerId: string): Promise<ActivitySummary[]>;

  restore(ownerId: string, activityId: string): Promise<ActivityRecord>;

  /** Publish (or re-publish). Ensures public slug exists. */
  publish(ownerId: string, activityId: string): Promise<ActivityRecord>;

  /**
   * Disable public play without soft-delete (lifecycle → archived).
   * Public slug is retained so restore/re-publish can re-enable.
   */
  disablePublic(ownerId: string, activityId: string): Promise<ActivityRecord>;

  regeneratePublicSlug(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord>;

  /**
   * Public boundary: sanitized snapshot only when published, not deleted,
   * and slug matches. Never returns owner id or draft content.
   */
  resolvePublicSnapshot(
    publicSlug: string,
  ): Promise<PublicActivitySnapshot | null>;

  createFolder(input: CreateFolderInput): Promise<FolderRecord>;

  listFolders(ownerId: string): Promise<FolderRecord[]>;

  renameFolder(
    ownerId: string,
    folderId: string,
    name: string,
  ): Promise<FolderRecord>;

  /** Test/local helper: wipe all data for this repository instance. */
  reset?(): Promise<void> | void;
}
