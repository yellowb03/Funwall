import type { ContentPackV1 } from "@/domain/content";
import type { PublicActivitySnapshot } from "@/domain/snapshot";
import type { TemplateKey } from "@/domain/template-keys";
import { isTemplateKey } from "@/domain/template-keys";
import { getProductRegistry } from "@/features/templates/registry";
import {
  contentFamilyForTemplate,
  emptyContentForTemplate,
} from "@/features/activities/empty-content";
import { ActivityError } from "@/services/db/errors";
import type {
  ActivityDetail,
  ActivityRecord,
  ActivityRepository,
  ActivitySummary,
  AutosaveResult,
  FolderRecord,
  ListActivitiesQuery,
} from "@/services/db/types";

export interface CreateActivityOptions {
  ownerId: string;
  templateKey: string;
  title?: string;
  instruction?: string | null;
  folderId?: string | null;
}

export interface AutosaveActivityOptions {
  ownerId: string;
  activityId: string;
  baseRevision: number;
  title?: string;
  instruction?: string | null;
  content?: ContentPackV1 | Record<string, unknown>;
  settings?: Record<string, unknown>;
  themeKey?: string;
}

export interface FinalizeActivityOptions {
  ownerId: string;
  activityId: string;
  baseRevision: number;
  title?: string;
  instruction?: string | null;
  content?: ContentPackV1 | Record<string, unknown>;
  settings?: Record<string, unknown>;
  themeKey?: string;
  /** Default true — Done publishes and ensures public slug. */
  publish?: boolean;
}

/**
 * Domain service over ActivityRepository + product template registry.
 * Validates template registration and playable content on finalize.
 * Does not embed template-specific game logic.
 */
export class ActivityService {
  constructor(private readonly repo: ActivityRepository) {}

  async createDraft(options: CreateActivityOptions): Promise<ActivityRecord> {
    if (!isTemplateKey(options.templateKey)) {
      throw new ActivityError(
        "VALIDATION",
        `Unknown template key "${options.templateKey}"`,
      );
    }
    const templateKey = options.templateKey as TemplateKey;
    const registry = getProductRegistry();
    if (!registry.has(templateKey)) {
      throw new ActivityError(
        "VALIDATION",
        `Template "${templateKey}" is not registered yet`,
      );
    }

    const registration = registry.get(templateKey);
    const content = emptyContentForTemplate(templateKey);
    const { family, version } = contentFamilyForTemplate(templateKey);
    const settings = registration.settings.defaults() as Record<
      string,
      unknown
    >;

    return this.repo.createDraft({
      ownerId: options.ownerId,
      templateKey,
      title: options.title,
      instruction: options.instruction,
      content,
      settings,
      themeKey: "classic",
      contentFamily: family,
      contentVersion: version,
      folderId: options.folderId,
    });
  }

  async getOwnerActivity(
    ownerId: string,
    activityId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ActivityDetail | null> {
    return this.repo.getOwnerActivity(ownerId, activityId, options);
  }

  async autosave(options: AutosaveActivityOptions): Promise<AutosaveResult> {
    const activity = await this.requireActivity(
      options.ownerId,
      options.activityId,
    );
    const registry = getProductRegistry();
    if (options.content !== undefined && registry.has(activity.templateKey)) {
      const parsed = registry
        .get(activity.templateKey)
        .draftSchema.safeParse(options.content);
      if (!parsed.success) {
        throw new ActivityError(
          "VALIDATION",
          "Content draft failed schema validation",
          parsed.error,
        );
      }
    }

    return this.repo.autosave({
      ownerId: options.ownerId,
      activityId: options.activityId,
      baseRevision: options.baseRevision,
      title: options.title,
      instruction: options.instruction,
      content: options.content,
      settings: options.settings,
      themeKey: options.themeKey,
    });
  }

  async finalize(options: FinalizeActivityOptions): Promise<ActivityRecord> {
    const detail = await this.requireActivity(
      options.ownerId,
      options.activityId,
    );
    const registry = getProductRegistry();
    if (!registry.has(detail.templateKey)) {
      throw new ActivityError(
        "VALIDATION",
        `Template "${detail.templateKey}" is not registered`,
      );
    }
    const registration = registry.get(detail.templateKey);

    const contentCandidate =
      options.content !== undefined ? options.content : detail.content;
    const settingsCandidate =
      options.settings !== undefined ? options.settings : detail.settings;

    const playable = registration.playableSchema.safeParse(contentCandidate);
    if (!playable.success) {
      throw new ActivityError(
        "VALIDATION",
        "Content is not playable yet. Fix validation errors before Done.",
        playable.error,
      );
    }

    const settingsParsed =
      registration.settings.schema.safeParse(settingsCandidate);
    if (!settingsParsed.success) {
      throw new ActivityError(
        "VALIDATION",
        "Settings are invalid for this template",
        settingsParsed.error,
      );
    }

    return this.repo.finalize({
      ownerId: options.ownerId,
      activityId: options.activityId,
      baseRevision: options.baseRevision,
      publish: options.publish,
      title: options.title,
      instruction: options.instruction,
      themeKey: options.themeKey,
      playableContent: playable.data as ContentPackV1 | Record<string, unknown>,
      playableSettings: settingsParsed.data as Record<string, unknown>,
      isScored: registration.capabilities.isScored,
      hasLeaderboard: registration.capabilities.hasLeaderboard,
      templateVersion: registration.templateVersion,
    });
  }

  async listOwnerActivities(
    ownerId: string,
    query?: ListActivitiesQuery,
  ): Promise<ActivitySummary[]> {
    return this.repo.listOwnerActivities(ownerId, query);
  }

  async duplicate(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    return this.repo.duplicate(ownerId, activityId);
  }

  async rename(
    ownerId: string,
    activityId: string,
    title: string,
  ): Promise<ActivityRecord> {
    return this.repo.rename(ownerId, activityId, title);
  }

  async moveFolder(
    ownerId: string,
    activityId: string,
    folderId: string | null,
  ): Promise<ActivityRecord> {
    return this.repo.moveFolder(ownerId, activityId, folderId);
  }

  async softDelete(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    return this.repo.softDelete(ownerId, activityId);
  }

  async listTrash(ownerId: string): Promise<ActivitySummary[]> {
    return this.repo.listTrash(ownerId);
  }

  async restore(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    return this.repo.restore(ownerId, activityId);
  }

  async publish(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    return this.repo.publish(ownerId, activityId);
  }

  async disablePublic(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    return this.repo.disablePublic(ownerId, activityId);
  }

  async regeneratePublicSlug(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    return this.repo.regeneratePublicSlug(ownerId, activityId);
  }

  /**
   * Public resolve boundary — no owner session required.
   * Returns sanitized snapshot or null (generic not-found for public).
   */
  async resolvePublicSnapshot(
    publicSlug: string,
  ): Promise<PublicActivitySnapshot | null> {
    return this.repo.resolvePublicSnapshot(publicSlug);
  }

  async createFolder(
    ownerId: string,
    name: string,
  ): Promise<FolderRecord> {
    return this.repo.createFolder({ ownerId, name });
  }

  async listFolders(ownerId: string): Promise<FolderRecord[]> {
    return this.repo.listFolders(ownerId);
  }

  async renameFolder(
    ownerId: string,
    folderId: string,
    name: string,
  ): Promise<FolderRecord> {
    return this.repo.renameFolder(ownerId, folderId, name);
  }

  private async requireActivity(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const detail = await this.repo.getOwnerActivity(ownerId, activityId);
    if (!detail) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    return detail.activity;
  }
}

export function createActivityService(
  repo: ActivityRepository,
): ActivityService {
  return new ActivityService(repo);
}
