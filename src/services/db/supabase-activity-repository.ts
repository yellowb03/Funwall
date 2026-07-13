import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicActivitySnapshot } from "@/domain/snapshot";
import type { TemplateKey } from "@/domain/template-keys";
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
  LifecycleState,
  ListActivitiesQuery,
} from "@/services/db/types";

/**
 * Row shapes matching supabase/migrations initial schema.
 * Column names are snake_case as stored in Postgres.
 */
interface ActivityRow {
  id: string;
  owner_id: string;
  folder_id: string | null;
  title: string;
  instruction: string | null;
  template_key: string;
  content_family: string;
  content_version: number;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  theme_key: string;
  lifecycle_state: LifecycleState;
  public_slug: string | null;
  revision: number;
  play_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface VersionRow {
  id: string;
  activity_id: string;
  revision: number;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  theme_key: string;
  author_id: string | null;
  reason: ActivityVersionRecord["reason"];
  created_at: string;
}

interface FolderRow {
  id: string;
  owner_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapActivity(row: ActivityRow): ActivityRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    folderId: row.folder_id,
    title: row.title,
    instruction: row.instruction,
    templateKey: row.template_key as TemplateKey,
    contentFamily: row.content_family,
    contentVersion: row.content_version,
    content: row.content,
    settings: row.settings ?? {},
    themeKey: row.theme_key,
    lifecycleState: row.lifecycle_state,
    publicSlug: row.public_slug,
    revision: row.revision,
    playCount: row.play_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapVersion(row: VersionRow): ActivityVersionRecord {
  return {
    id: row.id,
    activityId: row.activity_id,
    revision: row.revision,
    content: row.content,
    settings: row.settings ?? {},
    themeKey: row.theme_key,
    authorId: row.author_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

function mapFolder(row: FolderRow): FolderRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

function mapPgError(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new ActivityError("CONFLICT", error.message);
  }
  throw new ActivityError("CONFIG", error.message, error);
}

/**
 * Supabase-backed repository. Requires a client with the correct role:
 * - User-scoped (anon + session) for owner CRUD under RLS
 * - Service role only for trusted public snapshot RPC if needed
 */
export class SupabaseActivityRepository implements ActivityRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async fetchOwnedRow(
    ownerId: string,
    activityId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ActivityRow> {
    let query = this.client
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .eq("owner_id", ownerId);

    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    return data as ActivityRow;
  }

  private async insertVersion(
    activity: ActivityRecord,
    reason: ActivityVersionRecord["reason"],
    authorId: string | null,
  ): Promise<ActivityVersionRecord> {
    const { data, error } = await this.client
      .from("activity_versions")
      .insert({
        activity_id: activity.id,
        revision: activity.revision,
        content: activity.content,
        settings: activity.settings,
        theme_key: activity.themeKey,
        author_id: authorId,
        reason,
      })
      .select("*")
      .single();

    if (error) {
      mapPgError(error);
    }
    return mapVersion(data as VersionRow);
  }

  async createDraft(input: CreateDraftInput): Promise<ActivityRecord> {
    const { data, error } = await this.client
      .from("activities")
      .insert({
        owner_id: input.ownerId,
        folder_id: input.folderId ?? null,
        title: (input.title?.trim() || "Untitled activity").slice(0, 200),
        instruction: input.instruction ?? null,
        template_key: input.templateKey,
        content_family: input.contentFamily,
        content_version: input.contentVersion,
        content: input.content,
        settings: input.settings ?? {},
        theme_key: input.themeKey ?? "classic",
        lifecycle_state: "draft",
        public_slug: null,
        revision: 0,
      })
      .select("*")
      .single();

    if (error) {
      mapPgError(error);
    }

    const activity = mapActivity(data as ActivityRow);
    await this.insertVersion(activity, "autosave", input.ownerId);
    return activity;
  }

  async getOwnerActivity(
    ownerId: string,
    activityId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ActivityDetail | null> {
    try {
      const row = await this.fetchOwnedRow(ownerId, activityId, options);
      const activity = mapActivity(row);
      const { data: versionRows } = await this.client
        .from("activity_versions")
        .select("*")
        .eq("activity_id", activityId)
        .order("revision", { ascending: false })
        .limit(1);

      const latestVersion =
        versionRows && versionRows.length > 0
          ? mapVersion(versionRows[0] as VersionRow)
          : null;

      return { activity, latestVersion };
    } catch (error) {
      if (error instanceof ActivityError && error.code === "NOT_FOUND") {
        return null;
      }
      throw error;
    }
  }

  async autosave(input: AutosaveInput): Promise<AutosaveResult> {
    const current = await this.fetchOwnedRow(input.ownerId, input.activityId);
    if (current.revision !== input.baseRevision) {
      throw new ActivityError(
        "CONFLICT",
        `Revision conflict: expected base ${input.baseRevision}, server has ${current.revision}`,
        {
          serverRevision: current.revision,
          baseRevision: input.baseRevision,
        },
      );
    }

    const nextRevision = current.revision + 1;
    const patch: Record<string, unknown> = {
      revision: nextRevision,
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) {
        throw new ActivityError("VALIDATION", "Title cannot be empty");
      }
      patch.title = title.slice(0, 200);
    }
    if (input.instruction !== undefined) {
      patch.instruction = input.instruction;
    }
    if (input.content !== undefined) {
      patch.content = input.content;
    }
    if (input.settings !== undefined) {
      patch.settings = input.settings;
    }
    if (input.themeKey !== undefined) {
      patch.theme_key = input.themeKey;
    }

    // CAS: only update if revision still matches base
    const { data, error } = await this.client
      .from("activities")
      .update(patch)
      .eq("id", input.activityId)
      .eq("owner_id", input.ownerId)
      .eq("revision", input.baseRevision)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();

    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError(
        "CONFLICT",
        "Revision conflict: concurrent update detected",
      );
    }

    const activity = mapActivity(data as ActivityRow);
    const version = await this.insertVersion(
      activity,
      "autosave",
      input.ownerId,
    );
    return { activity, version };
  }

  async finalize(input: FinalizeInput): Promise<ActivityRecord> {
    const current = await this.fetchOwnedRow(input.ownerId, input.activityId);
    if (current.revision !== input.baseRevision) {
      throw new ActivityError(
        "CONFLICT",
        `Revision conflict: expected base ${input.baseRevision}, server has ${current.revision}`,
        {
          serverRevision: current.revision,
          baseRevision: input.baseRevision,
        },
      );
    }

    const nextRevision = current.revision + 1;
    const settings = {
      ...input.playableSettings,
      __isScored: input.isScored,
      __hasLeaderboard: input.hasLeaderboard,
      __templateVersion: input.templateVersion,
    };

    let publicSlug = current.public_slug;
    let lifecycle: LifecycleState = current.lifecycle_state;
    if (input.publish !== false) {
      lifecycle = "published";
      if (!publicSlug) {
        publicSlug = generatePublicSlug();
      }
    }

    const patch: Record<string, unknown> = {
      revision: nextRevision,
      content: input.playableContent,
      settings,
      lifecycle_state: lifecycle,
      public_slug: publicSlug,
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) {
        throw new ActivityError("VALIDATION", "Title cannot be empty");
      }
      patch.title = title.slice(0, 200);
    }
    if (input.instruction !== undefined) {
      patch.instruction = input.instruction;
    }
    if (input.themeKey !== undefined) {
      patch.theme_key = input.themeKey;
    }

    const { data, error } = await this.client
      .from("activities")
      .update(patch)
      .eq("id", input.activityId)
      .eq("owner_id", input.ownerId)
      .eq("revision", input.baseRevision)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();

    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError(
        "CONFLICT",
        "Revision conflict: concurrent update detected",
      );
    }

    const activity = mapActivity(data as ActivityRow);
    await this.insertVersion(activity, "done", input.ownerId);
    return activity;
  }

  async listOwnerActivities(
    ownerId: string,
    query: ListActivitiesQuery = {},
  ): Promise<ActivitySummary[]> {
    let q = this.client.from("activities").select("*").eq("owner_id", ownerId);

    if (!query.includeDeleted) {
      q = q.is("deleted_at", null);
    }
    if (query.templateKey) {
      q = q.eq("template_key", query.templateKey);
    }
    if (query.folderId !== undefined) {
      if (query.folderId === null) {
        q = q.is("folder_id", null);
      } else {
        q = q.eq("folder_id", query.folderId);
      }
    }
    if (query.search?.trim()) {
      q = q.ilike("title", `%${query.search.trim()}%`);
    }

    const sortBy = query.sortBy ?? "updatedAt";
    const ascending = (query.sortDir ?? "desc") === "asc";
    const columnMap: Record<string, string> = {
      updatedAt: "updated_at",
      createdAt: "created_at",
      title: "title",
      playCount: "play_count",
    };
    q = q.order(columnMap[sortBy] ?? "updated_at", { ascending });

    const { data, error } = await q;
    if (error) {
      mapPgError(error);
    }
    return ((data ?? []) as ActivityRow[]).map((row) =>
      toSummary(mapActivity(row)),
    );
  }

  async duplicate(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const source = mapActivity(
      await this.fetchOwnedRow(ownerId, activityId),
    );
    const titleBase = source.title.endsWith(" copy")
      ? source.title
      : `${source.title} copy`;

    return this.createDraft({
      ownerId,
      templateKey: source.templateKey,
      title: titleBase.slice(0, 200),
      instruction: source.instruction,
      content: structuredClone(source.content),
      settings: structuredClone(source.settings),
      themeKey: source.themeKey,
      contentFamily: source.contentFamily,
      contentVersion: source.contentVersion,
      folderId: source.folderId,
    });
  }

  async rename(
    ownerId: string,
    activityId: string,
    title: string,
  ): Promise<ActivityRecord> {
    const next = title.trim();
    if (!next) {
      throw new ActivityError("VALIDATION", "Title cannot be empty");
    }
    const { data, error } = await this.client
      .from("activities")
      .update({ title: next.slice(0, 200), updated_at: new Date().toISOString() })
      .eq("id", activityId)
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();

    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    return mapActivity(data as ActivityRow);
  }

  async moveFolder(
    ownerId: string,
    activityId: string,
    folderId: string | null,
  ): Promise<ActivityRecord> {
    const { data, error } = await this.client
      .from("activities")
      .update({ folder_id: folderId, updated_at: new Date().toISOString() })
      .eq("id", activityId)
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();

    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    return mapActivity(data as ActivityRow);
  }

  async softDelete(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const deletedAt = new Date().toISOString();
    const { data, error } = await this.client
      .from("activities")
      .update({ deleted_at: deletedAt, updated_at: deletedAt })
      .eq("id", activityId)
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();

    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    return mapActivity(data as ActivityRow);
  }

  async listTrash(ownerId: string): Promise<ActivitySummary[]> {
    const { data, error } = await this.client
      .from("activities")
      .select("*")
      .eq("owner_id", ownerId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      mapPgError(error);
    }
    return ((data ?? []) as ActivityRow[]).map((row) =>
      toSummary(mapActivity(row)),
    );
  }

  async restore(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const { data, error } = await this.client
      .from("activities")
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq("id", activityId)
      .eq("owner_id", ownerId)
      .not("deleted_at", "is", null)
      .select("*")
      .maybeSingle();

    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError("NOT_FOUND", "Activity not found in trash");
    }
    return mapActivity(data as ActivityRow);
  }

  async publish(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const current = await this.fetchOwnedRow(ownerId, activityId);
    const publicSlug = current.public_slug ?? generatePublicSlug();
    const { data, error } = await this.client
      .from("activities")
      .update({
        lifecycle_state: "published",
        public_slug: publicSlug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activityId)
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();

    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    return mapActivity(data as ActivityRow);
  }

  async disablePublic(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const { data, error } = await this.client
      .from("activities")
      .update({
        lifecycle_state: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", activityId)
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();

    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    return mapActivity(data as ActivityRow);
  }

  async regeneratePublicSlug(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const slug = generatePublicSlug();
    const { data, error } = await this.client
      .from("activities")
      .update({
        public_slug: slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activityId)
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();

    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError("NOT_FOUND", "Activity not found");
    }
    return mapActivity(data as ActivityRow);
  }

  async resolvePublicSnapshot(
    publicSlug: string,
  ): Promise<PublicActivitySnapshot | null> {
    // Prefer security-definer RPC that never exposes owner_id.
    const { data, error } = await this.client.rpc(
      "resolve_public_activity_snapshot",
      { p_public_slug: publicSlug },
    );

    if (error) {
      // Fallback: direct select is blocked by RLS after WS01 migration;
      // surface as null for public consumers.
      if (error.message?.includes("resolve_public_activity_snapshot")) {
        return null;
      }
      return null;
    }

    if (!data) {
      return null;
    }

    // RPC returns jsonb object or table row depending on migration.
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return null;
    }

    return row as PublicActivitySnapshot;
  }

  async createFolder(input: CreateFolderInput): Promise<FolderRecord> {
    const name = input.name.trim();
    if (!name) {
      throw new ActivityError("VALIDATION", "Folder name cannot be empty");
    }
    const { data, error } = await this.client
      .from("folders")
      .insert({
        owner_id: input.ownerId,
        name: name.slice(0, 120),
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      mapPgError(error);
    }
    return mapFolder(data as FolderRow);
  }

  async listFolders(ownerId: string): Promise<FolderRecord[]> {
    const { data, error } = await this.client
      .from("folders")
      .select("*")
      .eq("owner_id", ownerId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      mapPgError(error);
    }
    return ((data ?? []) as FolderRow[]).map(mapFolder);
  }

  async renameFolder(
    ownerId: string,
    folderId: string,
    name: string,
  ): Promise<FolderRecord> {
    const next = name.trim();
    if (!next) {
      throw new ActivityError("VALIDATION", "Folder name cannot be empty");
    }
    const { data, error } = await this.client
      .from("folders")
      .update({ name: next.slice(0, 120), updated_at: new Date().toISOString() })
      .eq("id", folderId)
      .eq("owner_id", ownerId)
      .select("*")
      .maybeSingle();

    if (error) {
      mapPgError(error);
    }
    if (!data) {
      throw new ActivityError("NOT_FOUND", "Folder not found");
    }
    return mapFolder(data as FolderRow);
  }
}
