/**
 * Client-safe service surface.
 * Do not re-export Node-only modules (fs-backed memory repo, service-role client)
 * from this barrel — they break the client bundle.
 */
export * from "@/services/rng/seeded-rng";
export * from "@/services/timer/clock";
export * from "@/services/audio";
export {
  createBrowserSupabaseClient,
  getSupabaseEnv,
  SupabaseConfigError,
} from "@/services/supabase/client";
