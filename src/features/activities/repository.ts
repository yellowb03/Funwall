import { createSupabaseServerClient } from "@/features/auth/session";
import {
  createMemoryActivityRepository,
  createSupabaseActivityRepository,
  getActivityRepository,
  isSupabaseConfigured,
} from "@/services/db";
import type { ActivityRepository } from "@/services/db/types";
import { createActivityService, type ActivityService } from "@/features/activities/activity-service";

/**
 * Resolve the activity repository for the current request.
 * Memory adapter is the default when Supabase env is missing.
 */
export async function getRequestActivityRepository(): Promise<ActivityRepository> {
  if (!isSupabaseConfigured()) {
    return getActivityRepository();
  }

  const client = await createSupabaseServerClient();
  return createSupabaseActivityRepository(client);
}

export async function getRequestActivityService(): Promise<ActivityService> {
  const repo = await getRequestActivityRepository();
  return createActivityService(repo);
}

/** Explicit memory service for tests and offline scripts. */
export function createMemoryActivityService(
  persistPath: string | null = null,
): ActivityService {
  return createActivityService(createMemoryActivityRepository(persistPath));
}
