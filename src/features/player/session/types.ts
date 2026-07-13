import type { TemplateKey } from "@/domain/template-keys";
import type { ResultContract } from "@/domain/result";
import type { SessionEventEnvelope } from "@/domain/session-events";
import type { PublicActivitySnapshot } from "@/domain/snapshot";

/**
 * Play session record owned by the player shell / PublicPlayPort.
 * @see docs/adr/ADR-005-public-snapshot-session-result.md
 */
export type SessionStatus =
  | "active"
  | "completed"
  | "gameOver"
  | "abandoned"
  | "invalid";

export interface PlaySession {
  id: string;
  publicSlug: string;
  activityId: string;
  activityRevision: number;
  templateKey: TemplateKey;
  templateVersion: number;
  /** Deterministic seed for this attempt — never regenerated mid-session. */
  seed: string;
  status: SessionStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface StartSessionInput {
  publicSlug: string;
  /** Optional fixed seed (tests / replay). When omitted, a new seed is generated. */
  seed?: string;
}

export interface LeaderboardEntry {
  sessionId: string;
  displayName: string;
  score: number;
  durationMs: number;
  completedAt: string;
}

/**
 * Server boundary for public play.
 * Activities persistence (Workstream 01) implements this; player shell owns the interface
 * and ships a memory implementation for local dev and tests.
 */
export interface PublicPlayPort {
  resolveSnapshot(publicSlug: string): Promise<PublicActivitySnapshot | null>;
  startSession(input: StartSessionInput): Promise<PlaySession>;
  appendEvents(
    sessionId: string,
    events: SessionEventEnvelope[],
  ): Promise<void>;
  completeSession(sessionId: string, result: ResultContract): Promise<void>;
  /**
   * Submit display name for leaderboard.
   * Must be a no-op (or reject) for unscored / non-leaderboard templates.
   */
  submitLeaderboard(sessionId: string, displayName: string): Promise<void>;
  /** Optional helpers used by result routes / tests. */
  getSession?(sessionId: string): Promise<PlaySession | null>;
  getResult?(sessionId: string): Promise<ResultContract | null>;
  getLeaderboard?(publicSlug: string): Promise<LeaderboardEntry[]>;
}
