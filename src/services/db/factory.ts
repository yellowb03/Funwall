import path from "node:path";
import {
  getSupabaseEnv,
  SupabaseConfigError,
} from "@/services/supabase/client";
import { MemoryActivityRepository } from "@/services/db/memory-activity-repository";
import { SupabaseActivityRepository } from "@/services/db/supabase-activity-repository";
import type { ActivityRepository } from "@/services/db/types";

export type ActivityRepositoryMode = "memory" | "supabase";

let singleton: ActivityRepository | null = null;
let singletonMode: ActivityRepositoryMode | null = null;

/**
 * True when real Supabase project env is present (not placeholders).
 * Used by auth + repository factory. Safe to call on the server.
 */
export function isSupabaseConfigured(): boolean {
  try {
    getSupabaseEnv();
    return true;
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return false;
    }
    return false;
  }
}

function defaultMemoryPersistPath(): string | null {
  // Persist only outside tests so unit suites stay isolated.
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return null;
  }
  if (process.env.FUNWALL_MEMORY_PERSIST === "0") {
    return null;
  }
  // Vercel / serverless: filesystem is ephemeral and often read-only.
  // Callers should use CookieActivityRepository instead (see repository.ts).
  if (process.env.VERCEL || process.env.FUNWALL_COOKIE_STORE === "1") {
    return null;
  }
  const root = process.cwd();
  return path.join(root, ".data", "activities.json");
}

/**
 * True when we must not rely on process memory or local disk alone
 * (serverless multi-instance hosts without Supabase).
 */
export function shouldUseCookieActivityStore(): boolean {
  if (isSupabaseConfigured()) return false;
  if (process.env.FUNWALL_COOKIE_STORE === "0") return false;
  if (process.env.FUNWALL_COOKIE_STORE === "1") return true;
  return Boolean(process.env.VERCEL);
}

/**
 * Create a memory repository (always available; default without Supabase).
 */
export function createMemoryActivityRepository(
  persistPath: string | null = defaultMemoryPersistPath(),
): MemoryActivityRepository {
  return new MemoryActivityRepository({ persistPath });
}

/**
 * Create Supabase repository. Throws SupabaseConfigError if env missing.
 * Pass an authenticated or service-role client from the caller.
 */
export function createSupabaseActivityRepository(
  client: ConstructorParameters<typeof SupabaseActivityRepository>[0],
): SupabaseActivityRepository {
  if (!isSupabaseConfigured()) {
    throw new SupabaseConfigError(
      "Supabase is not configured; use createMemoryActivityRepository() for local mode.",
    );
  }
  return new SupabaseActivityRepository(client);
}

/**
 * Process-wide repository for local/dev (memory) path.
 * When Supabase is configured, callers should prefer a per-request
 * SupabaseActivityRepository with the user session client.
 */
export function getActivityRepository(): ActivityRepository {
  if (isSupabaseConfigured()) {
    // Supabase mode requires a request-scoped client; do not cache anon client.
    // Callers that hit this without wiring session should still get a clear error
    // path via createServerActivityRepository in features/activities.
    if (singleton && singletonMode === "supabase") {
      return singleton;
    }
  }

  if (singleton && singletonMode === "memory") {
    return singleton;
  }

  singleton = createMemoryActivityRepository();
  singletonMode = "memory";
  return singleton;
}

export function getActivityRepositoryMode(): ActivityRepositoryMode {
  return isSupabaseConfigured() ? "supabase" : "memory";
}

/** Test helper — reset singleton between suites. */
export function resetActivityRepositoryForTests(): void {
  if (singleton && "reset" in singleton && typeof singleton.reset === "function") {
    singleton.reset();
  }
  singleton = null;
  singletonMode = null;
}

/**
 * Inject a repository (tests).
 */
export function setActivityRepositoryForTests(
  repo: ActivityRepository | null,
): void {
  singleton = repo;
  singletonMode = repo ? "memory" : null;
}
