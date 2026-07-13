import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseEnv,
  SupabaseConfigError,
} from "@/services/supabase/client";

/**
 * Service-role client for trusted server routes only.
 * Never import this module into client components.
 */
export function createServiceRoleSupabaseClient(): SupabaseClient {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new SupabaseConfigError(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Required for trusted server operations only.",
    );
  }

  if (serviceRoleKey.includes("your-service-role")) {
    throw new SupabaseConfigError(
      "SUPABASE_SERVICE_ROLE_KEY still has a placeholder value from .env.example.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export { SupabaseConfigError };
