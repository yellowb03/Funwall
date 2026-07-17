import { deflateSync, inflateSync } from "node:zlib";
import { cookies } from "next/headers";
import {
  MemoryActivityRepository,
  type MemoryStoreSnapshot,
} from "@/services/db/memory-activity-repository";
import { ActivityError } from "@/services/db/errors";
import type {
  ActivityDetail,
  ActivityRecord,
  ActivityRepository,
  ActivitySummary,
  AutosaveInput,
  AutosaveResult,
  CreateDraftInput,
  CreateFolderInput,
  FinalizeInput,
  FolderRecord,
  ListActivitiesQuery,
} from "@/services/db/types";
import type { PublicActivitySnapshot } from "@/domain/snapshot";

/**
 * Cookie names for the durable local-owner store used on Vercel when Supabase
 * is not configured. Chunked + deflated so multi-activity shelves fit under
 * typical per-cookie size limits.
 */
export const COOKIE_STORE_COUNT = "fw_astore_n";
export const COOKIE_STORE_PREFIX = "fw_astore_";

const MAX_CHUNK_CHARS = 3000;
const MAX_ACTIVITIES = 30;
const MAX_FOLDERS = 20;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE_SECONDS,
};

/** Keep only latest version per activity and cap row counts for cookie budget. */
export function slimSnapshot(snapshot: MemoryStoreSnapshot): MemoryStoreSnapshot {
  const activities = [...snapshot.activities]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_ACTIVITIES);
  const keep = new Set(activities.map((a) => a.id));

  const latestVersion = new Map<
    string,
    MemoryStoreSnapshot["versions"][number]
  >();
  for (const version of snapshot.versions) {
    if (!keep.has(version.activityId)) continue;
    const current = latestVersion.get(version.activityId);
    if (!current || version.revision >= current.revision) {
      latestVersion.set(version.activityId, version);
    }
  }

  return {
    activities,
    versions: [...latestVersion.values()],
    folders: snapshot.folders.slice(0, MAX_FOLDERS),
  };
}

export function encodeStoreChunks(snapshot: MemoryStoreSnapshot): string[] {
  const slim = slimSnapshot(snapshot);
  const json = JSON.stringify(slim);
  const compressed = deflateSync(Buffer.from(json, "utf8")).toString(
    "base64url",
  );
  if (!compressed) return [];
  const chunks: string[] = [];
  for (let i = 0; i < compressed.length; i += MAX_CHUNK_CHARS) {
    chunks.push(compressed.slice(i, i + MAX_CHUNK_CHARS));
  }
  return chunks;
}

export function decodeStoreChunks(chunks: string[]): MemoryStoreSnapshot | null {
  if (chunks.length === 0) return null;
  try {
    const compressed = chunks.join("");
    const json = inflateSync(Buffer.from(compressed, "base64url")).toString(
      "utf8",
    );
    const parsed = JSON.parse(json) as MemoryStoreSnapshot;
    if (!parsed || !Array.isArray(parsed.activities)) return null;
    return {
      activities: parsed.activities ?? [],
      versions: parsed.versions ?? [],
      folders: parsed.folders ?? [],
    };
  } catch {
    return null;
  }
}

async function readSnapshotFromCookies(): Promise<MemoryStoreSnapshot | null> {
  const jar = await cookies();
  const rawCount = jar.get(COOKIE_STORE_COUNT)?.value;
  const count = rawCount ? Number.parseInt(rawCount, 10) : 0;
  if (!Number.isFinite(count) || count < 1) return null;

  const chunks: string[] = [];
  for (let i = 0; i < count; i++) {
    const part = jar.get(`${COOKIE_STORE_PREFIX}${i}`)?.value;
    if (!part) return null;
    chunks.push(part);
  }
  return decodeStoreChunks(chunks);
}

async function writeSnapshotToCookies(
  snapshot: MemoryStoreSnapshot,
): Promise<void> {
  const jar = await cookies();
  const chunks = encodeStoreChunks(snapshot);
  const previous = Number.parseInt(
    jar.get(COOKIE_STORE_COUNT)?.value ?? "0",
    10,
  );

  try {
    for (let i = 0; i < chunks.length; i++) {
      jar.set(`${COOKIE_STORE_PREFIX}${i}`, chunks[i]!, cookieOptions);
    }
    jar.set(COOKIE_STORE_COUNT, String(chunks.length), cookieOptions);
    if (Number.isFinite(previous)) {
      for (let i = chunks.length; i < previous; i++) {
        jar.set(`${COOKIE_STORE_PREFIX}${i}`, "", {
          ...cookieOptions,
          maxAge: 0,
        });
      }
    }
  } catch (error) {
    throw new ActivityError(
      "CONFIG",
      "Could not save activity to browser storage. Try again, or configure Supabase for durable cloud storage.",
      error,
    );
  }
}

/**
 * Activity repository that serializes the full local store into httpOnly
 * cookies. Intended for Vercel (and other serverless hosts) when Supabase
 * env is missing — in-memory/file stores do not survive across instances.
 *
 * Same-browser only. Multi-device public play requires Supabase.
 */
export class CookieActivityRepository implements ActivityRepository {
  private readonly inner: MemoryActivityRepository;

  private constructor(snapshot: MemoryStoreSnapshot | null) {
    this.inner = new MemoryActivityRepository({ persistPath: null });
    if (snapshot) {
      this.inner.applySnapshot(snapshot);
    }
  }

  static async fromCookies(): Promise<CookieActivityRepository> {
    const snapshot = await readSnapshotFromCookies();
    return new CookieActivityRepository(snapshot);
  }

  /** Test helper — build from an explicit snapshot without reading cookies. */
  static fromSnapshot(
    snapshot: MemoryStoreSnapshot | null,
  ): CookieActivityRepository {
    return new CookieActivityRepository(snapshot);
  }

  private async flush(): Promise<void> {
    await writeSnapshotToCookies(this.inner.exportSnapshot());
  }

  async createDraft(input: CreateDraftInput): Promise<ActivityRecord> {
    const record = await this.inner.createDraft(input);
    await this.flush();
    return record;
  }

  async getOwnerActivity(
    ownerId: string,
    activityId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ActivityDetail | null> {
    return this.inner.getOwnerActivity(ownerId, activityId, options);
  }

  async autosave(input: AutosaveInput): Promise<AutosaveResult> {
    const result = await this.inner.autosave(input);
    await this.flush();
    return result;
  }

  async finalize(input: FinalizeInput): Promise<ActivityRecord> {
    const record = await this.inner.finalize(input);
    await this.flush();
    return record;
  }

  async listOwnerActivities(
    ownerId: string,
    query?: ListActivitiesQuery,
  ): Promise<ActivitySummary[]> {
    return this.inner.listOwnerActivities(ownerId, query);
  }

  async duplicate(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const record = await this.inner.duplicate(ownerId, activityId);
    await this.flush();
    return record;
  }

  async rename(
    ownerId: string,
    activityId: string,
    title: string,
  ): Promise<ActivityRecord> {
    const record = await this.inner.rename(ownerId, activityId, title);
    await this.flush();
    return record;
  }

  async moveFolder(
    ownerId: string,
    activityId: string,
    folderId: string | null,
  ): Promise<ActivityRecord> {
    const record = await this.inner.moveFolder(ownerId, activityId, folderId);
    await this.flush();
    return record;
  }

  async softDelete(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const record = await this.inner.softDelete(ownerId, activityId);
    await this.flush();
    return record;
  }

  async listTrash(ownerId: string): Promise<ActivitySummary[]> {
    return this.inner.listTrash(ownerId);
  }

  async restore(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const record = await this.inner.restore(ownerId, activityId);
    await this.flush();
    return record;
  }

  async publish(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const record = await this.inner.publish(ownerId, activityId);
    await this.flush();
    return record;
  }

  async disablePublic(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const record = await this.inner.disablePublic(ownerId, activityId);
    await this.flush();
    return record;
  }

  async regeneratePublicSlug(
    ownerId: string,
    activityId: string,
  ): Promise<ActivityRecord> {
    const record = await this.inner.regeneratePublicSlug(ownerId, activityId);
    await this.flush();
    return record;
  }

  async resolvePublicSnapshot(
    publicSlug: string,
  ): Promise<PublicActivitySnapshot | null> {
    return this.inner.resolvePublicSnapshot(publicSlug);
  }

  async createFolder(input: CreateFolderInput): Promise<FolderRecord> {
    const folder = await this.inner.createFolder(input);
    await this.flush();
    return folder;
  }

  async listFolders(ownerId: string): Promise<FolderRecord[]> {
    return this.inner.listFolders(ownerId);
  }

  async renameFolder(
    ownerId: string,
    folderId: string,
    name: string,
  ): Promise<FolderRecord> {
    const folder = await this.inner.renameFolder(ownerId, folderId, name);
    await this.flush();
    return folder;
  }

  reset(): void {
    this.inner.reset();
  }

  /** Test helper */
  exportSnapshot(): MemoryStoreSnapshot {
    return this.inner.exportSnapshot();
  }
}
