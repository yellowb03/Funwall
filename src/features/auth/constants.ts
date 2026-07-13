/**
 * Local-dev owner identity when Supabase is not configured.
 * Fixed UUID so DB-shaped owner_id fields remain valid.
 * NEVER enable this path in production deployments with real traffic.
 */
export const DEV_OWNER_ID = "00000000-0000-4000-8000-0000000000de";
export const DEV_OWNER_EMAIL = "dev-owner@localhost";
export const DEV_OWNER_LABEL = "Local dev mode";

/** HttpOnly cookie marking a local-dev owner session. */
export const DEV_SESSION_COOKIE = "funwall_dev_session";
export const DEV_SESSION_VALUE = "dev-owner";

/** Cookie lifetime for dev session (7 days). */
export const DEV_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
