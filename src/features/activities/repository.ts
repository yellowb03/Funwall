import { createSupabaseServerClient } from "@/features/auth/session";
import {
  createMemoryActivityRepository,
  createSupabaseActivityRepository,
  getActivityRepository,
  isSupabaseConfigured,
  shouldUseCookieActivityStore,
} from "@/services/db";
import { CookieActivityRepository } from "@/services/db/cookie-activity-repository";
import type { ActivityRepository } from "@/services/db/types";
import { createActivityService, type ActivityService } from "@/features/activities/activity-service";

/**
 * Resolve the activity repository for the current request.
 * - Supabase env present → SupabaseActivityRepository
 * - Vercel / serverless without Supabase → cookie-durable store
 * - Local Node without Supabase → file-backed memory (or singleton when
 *   FUNWALL_MEMORY_PERSIST=0)
 */
export async function getRequestActivityRepository(): Promise<ActivityRepository> {
  if (isSupabaseConfigured()) {
    const client = await createSupabaseServerClient();
    return createSupabaseActivityRepository(client);
  }

  if (shouldUseCookieActivityStore()) {
    // Durable across serverless instances for the same browser (httpOnly cookies).
    // Mutations must run in Server Actions / Route Handlers so cookies can be set.
    return CookieActivityRepository.fromCookies();
  }

  // Next.js may evaluate route handlers and Server Actions in separate module
  // graphs. A process singleton can therefore become a stale fork: one
  // request writes a draft while the redirected request still sees an older
  // in-memory map. The default local mode is file-backed, so load a fresh
  // repository for every request. Tests or explicitly ephemeral local runs
  // can still opt into the singleton with FUNWALL_MEMORY_PERSIST=0.
  return process.env.FUNWALL_MEMORY_PERSIST === "0"
    ? getActivityRepository()
    : createMemoryActivityRepository();
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
