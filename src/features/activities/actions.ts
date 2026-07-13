"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwnerSession } from "@/features/auth/session";
import { getRequestActivityService } from "@/features/activities/repository";
import {
  ActivityError,
  isActivityError,
} from "@/services/db/errors";
import type {
  ActivityRecord,
  ActivitySummary,
  ListActivitiesQuery,
} from "@/services/db/types";
import type { PublicActivitySnapshot } from "@/domain/snapshot";
import type { ContentPackV1 } from "@/domain/content";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

function fail(error: unknown): ActionResult<never> {
  if (isActivityError(error)) {
    return { ok: false, code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    return { ok: false, code: "CONFIG", message: error.message };
  }
  return { ok: false, code: "CONFIG", message: "Unexpected error" };
}

export async function createActivityAction(formData: FormData): Promise<void> {
  const session = await requireOwnerSession();
  const service = await getRequestActivityService();
  const templateKey = String(formData.get("templateKey") ?? "");
  const title = formData.get("title")?.toString();

  try {
    const activity = await service.createDraft({
      ownerId: session.ownerId,
      templateKey,
      title: title || undefined,
    });
    revalidatePath("/activities");
    redirect(`/activities/${activity.id}`);
  } catch (error) {
    // redirect() throws; rethrow Next redirects
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    throw error instanceof ActivityError
      ? error
      : new ActivityError("CONFIG", "Failed to create activity");
  }
}

export async function createActivityJsonAction(input: {
  templateKey: string;
  title?: string;
}): Promise<ActionResult<ActivityRecord>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const activity = await service.createDraft({
      ownerId: session.ownerId,
      templateKey: input.templateKey,
      title: input.title,
    });
    revalidatePath("/activities");
    return { ok: true, data: activity };
  } catch (error) {
    return fail(error);
  }
}

export async function listActivitiesAction(
  query?: ListActivitiesQuery,
): Promise<ActionResult<ActivitySummary[]>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const rows = await service.listOwnerActivities(session.ownerId, query);
    return { ok: true, data: rows };
  } catch (error) {
    return fail(error);
  }
}

export async function getActivityAction(
  activityId: string,
): Promise<
  ActionResult<{ activity: ActivityRecord; revision: number }>
> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const detail = await service.getOwnerActivity(
      session.ownerId,
      activityId,
    );
    if (!detail) {
      return { ok: false, code: "NOT_FOUND", message: "Activity not found" };
    }
    return {
      ok: true,
      data: {
        activity: detail.activity,
        revision: detail.activity.revision,
      },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function autosaveActivityAction(input: {
  activityId: string;
  baseRevision: number;
  title?: string;
  instruction?: string | null;
  content?: ContentPackV1 | Record<string, unknown>;
  settings?: Record<string, unknown>;
  themeKey?: string;
}): Promise<ActionResult<ActivityRecord>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const result = await service.autosave({
      ownerId: session.ownerId,
      ...input,
    });
    revalidatePath("/activities");
    revalidatePath(`/activities/${input.activityId}`);
    return { ok: true, data: result.activity };
  } catch (error) {
    return fail(error);
  }
}

export async function finalizeActivityAction(input: {
  activityId: string;
  baseRevision: number;
  title?: string;
  instruction?: string | null;
  content?: ContentPackV1 | Record<string, unknown>;
  settings?: Record<string, unknown>;
  themeKey?: string;
  publish?: boolean;
}): Promise<ActionResult<ActivityRecord>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const activity = await service.finalize({
      ownerId: session.ownerId,
      ...input,
    });
    revalidatePath("/activities");
    revalidatePath(`/activities/${input.activityId}`);
    return { ok: true, data: activity };
  } catch (error) {
    return fail(error);
  }
}

export async function softDeleteActivityAction(
  activityId: string,
): Promise<ActionResult<ActivityRecord>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const activity = await service.softDelete(session.ownerId, activityId);
    revalidatePath("/activities");
    revalidatePath(`/activities/${activityId}`);
    return { ok: true, data: activity };
  } catch (error) {
    return fail(error);
  }
}

/** Form-action wrapper (returns void for progressive enhancement). */
export async function softDeleteActivityFormAction(
  activityId: string,
): Promise<void> {
  await softDeleteActivityAction(activityId);
  revalidatePath("/activities");
}

export async function restoreActivityAction(
  activityId: string,
): Promise<ActionResult<ActivityRecord>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const activity = await service.restore(session.ownerId, activityId);
    revalidatePath("/activities");
    return { ok: true, data: activity };
  } catch (error) {
    return fail(error);
  }
}

export async function duplicateActivityAction(
  activityId: string,
): Promise<ActionResult<ActivityRecord>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const activity = await service.duplicate(session.ownerId, activityId);
    revalidatePath("/activities");
    return { ok: true, data: activity };
  } catch (error) {
    return fail(error);
  }
}

export async function renameActivityAction(input: {
  activityId: string;
  title: string;
}): Promise<ActionResult<ActivityRecord>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const activity = await service.rename(
      session.ownerId,
      input.activityId,
      input.title,
    );
    revalidatePath("/activities");
    revalidatePath(`/activities/${input.activityId}`);
    return { ok: true, data: activity };
  } catch (error) {
    return fail(error);
  }
}

export async function publishActivityAction(
  activityId: string,
): Promise<ActionResult<ActivityRecord>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const activity = await service.publish(session.ownerId, activityId);
    revalidatePath(`/activities/${activityId}`);
    return { ok: true, data: activity };
  } catch (error) {
    return fail(error);
  }
}

export async function disablePublicActivityAction(
  activityId: string,
): Promise<ActionResult<ActivityRecord>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const activity = await service.disablePublic(session.ownerId, activityId);
    revalidatePath(`/activities/${activityId}`);
    return { ok: true, data: activity };
  } catch (error) {
    return fail(error);
  }
}

export async function regenerateSlugAction(
  activityId: string,
): Promise<ActionResult<ActivityRecord>> {
  try {
    const session = await requireOwnerSession();
    const service = await getRequestActivityService();
    const activity = await service.regeneratePublicSlug(
      session.ownerId,
      activityId,
    );
    revalidatePath(`/activities/${activityId}`);
    return { ok: true, data: activity };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Public resolve — no auth. Returns sanitized snapshot or null.
 */
export async function resolvePublicSnapshotAction(
  publicSlug: string,
): Promise<PublicActivitySnapshot | null> {
  const service = await getRequestActivityService();
  return service.resolvePublicSnapshot(publicSlug);
}
