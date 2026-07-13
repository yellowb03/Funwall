import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/services/db/factory";
import {
  getSupabaseEnv,
  SupabaseConfigError,
} from "@/services/supabase/client";
import {
  DEV_OWNER_EMAIL,
  DEV_OWNER_ID,
  DEV_OWNER_LABEL,
  DEV_SESSION_COOKIE,
  DEV_SESSION_VALUE,
} from "@/features/auth/constants";
import type { OwnerSession } from "@/features/auth/types";

/**
 * Create a cookie-backed Supabase server client for the current request.
 * Only call when `isSupabaseConfigured()` is true.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll from a Server Component can throw; middleware refreshes sessions.
        }
      },
    },
  });
}

/**
 * Resolve the current owner session.
 * - Supabase configured → Auth user
 * - Otherwise → optional local-dev cookie session
 */
export async function getOwnerSession(): Promise<OwnerSession | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return null;
      }
      return {
        ownerId: data.user.id,
        email: data.user.email ?? null,
        mode: "supabase",
        label: null,
      };
    } catch (error) {
      if (error instanceof SupabaseConfigError) {
        // fall through to local-dev
      } else {
        return null;
      }
    }
  }

  const cookieStore = await cookies();
  const dev = cookieStore.get(DEV_SESSION_COOKIE)?.value;
  if (dev === DEV_SESSION_VALUE) {
    return {
      ownerId: DEV_OWNER_ID,
      email: DEV_OWNER_EMAIL,
      mode: "local-dev",
      label: DEV_OWNER_LABEL,
    };
  }

  return null;
}

/**
 * Require an owner session or throw (for server actions).
 */
export async function requireOwnerSession(): Promise<OwnerSession> {
  const session = await getOwnerSession();
  if (!session) {
    const { ActivityError } = await import("@/services/db/errors");
    throw new ActivityError("UNAUTHORIZED", "Sign in required");
  }
  return session;
}

export function isLocalDevAuthEnabled(): boolean {
  return !isSupabaseConfigured();
}
