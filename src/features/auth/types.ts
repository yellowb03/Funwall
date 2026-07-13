export type AuthMode = "supabase" | "local-dev";

export interface OwnerSession {
  ownerId: string;
  email: string | null;
  mode: AuthMode;
  /** Human-readable banner for local-dev. */
  label: string | null;
}
