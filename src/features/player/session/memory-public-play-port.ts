import { publicActivitySnapshotSchema } from "@/domain/snapshot";
import type { PublicActivitySnapshot } from "@/domain/snapshot";
import type { ResultContract } from "@/domain/result";
import type { SessionEventEnvelope } from "@/domain/session-events";
import { generateSessionSeed } from "@/services/rng/seeded-rng";
import type {
  LeaderboardEntry,
  PlaySession,
  PublicPlayPort,
  StartSessionInput,
} from "@/features/player/session/types";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Deterministic-enough fallback for non-crypto test environments.
  return `00000000-0000-4000-8000-${String(Date.now()).padStart(12, "0").slice(-12)}`;
}

export interface MemoryPublicPlayPortOptions {
  /** Pre-seed snapshots keyed by publicSlug. */
  snapshots?: Record<string, PublicActivitySnapshot>;
}

/**
 * In-memory PublicPlayPort for local dev and unit tests.
 * Inject snapshots via constructor or `injectSnapshot`.
 */
export class MemoryPublicPlayPort implements PublicPlayPort {
  private readonly snapshots = new Map<string, PublicActivitySnapshot>();
  private readonly sessions = new Map<string, PlaySession>();
  private readonly events = new Map<string, SessionEventEnvelope[]>();
  private readonly results = new Map<string, ResultContract>();
  /** publicSlug → entries */
  private readonly leaderboards = new Map<string, LeaderboardEntry[]>();

  constructor(options?: MemoryPublicPlayPortOptions) {
    if (options?.snapshots) {
      for (const [slug, snap] of Object.entries(options.snapshots)) {
        this.injectSnapshot(slug, snap);
      }
    }
  }

  injectSnapshot(publicSlug: string, snapshot: PublicActivitySnapshot): void {
    const parsed = publicActivitySnapshotSchema.parse({
      ...snapshot,
      publicSlug,
    });
    this.snapshots.set(publicSlug, parsed);
  }

  removeSnapshot(publicSlug: string): void {
    this.snapshots.delete(publicSlug);
  }

  async resolveSnapshot(
    publicSlug: string,
  ): Promise<PublicActivitySnapshot | null> {
    return this.snapshots.get(publicSlug) ?? null;
  }

  async startSession(input: StartSessionInput): Promise<PlaySession> {
    const snapshot = await this.resolveSnapshot(input.publicSlug);
    if (!snapshot) {
      throw new Error("Activity not available");
    }

    const session: PlaySession = {
      id: newId(),
      publicSlug: input.publicSlug,
      activityId: snapshot.activityId,
      activityRevision: snapshot.revision,
      templateKey: snapshot.templateKey,
      templateVersion: snapshot.templateVersion,
      seed: input.seed ?? generateSessionSeed(),
      status: "active",
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this.sessions.set(session.id, session);
    this.events.set(session.id, []);
    return session;
  }

  async appendEvents(
    sessionId: string,
    events: SessionEventEnvelope[],
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    if (session.status !== "active") {
      // Idempotent-ish: ignore late events after completion.
      return;
    }

    const existing = this.events.get(sessionId) ?? [];
    const lastSeq =
      existing.length > 0 ? existing[existing.length - 1]!.sequence : 0;

    for (const event of events) {
      if (event.sessionId !== sessionId) {
        throw new Error("Event sessionId mismatch");
      }
      if (event.sequence <= lastSeq) {
        // Duplicate / out-of-order: skip duplicates, reject regress.
        const dup = existing.some((e) => e.sequence === event.sequence);
        if (dup) continue;
        throw new Error(
          `Event sequence ${event.sequence} is not monotonic after ${lastSeq}`,
        );
      }
      existing.push(event);
    }

    this.events.set(sessionId, existing);
  }

  async completeSession(
    sessionId: string,
    result: ResultContract,
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Idempotent double-complete: keep first result.
    if (this.results.has(sessionId)) {
      return;
    }

    if (result.sessionId !== sessionId) {
      throw new Error("Result sessionId mismatch");
    }
    if (result.seed !== session.seed) {
      throw new Error("Result seed mismatch");
    }

    const nextStatus =
      result.status === "gameOver"
        ? "gameOver"
        : result.status === "abandoned"
          ? "abandoned"
          : result.status === "invalid"
            ? "invalid"
            : "completed";

    this.sessions.set(sessionId, {
      ...session,
      status: nextStatus,
      completedAt: result.completedAt ?? new Date().toISOString(),
    });
    this.results.set(sessionId, result);
  }

  async submitLeaderboard(
    sessionId: string,
    displayName: string,
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    const result = this.results.get(sessionId);
    if (!session || !result) {
      throw new Error("Session or result not found");
    }

    const snapshot = this.snapshots.get(session.publicSlug);
    // Unscored / no-leaderboard: no-op (Wheel path).
    if (!snapshot?.hasLeaderboard || !snapshot.isScored) {
      return;
    }

    if (result.status !== "completed" || result.score === null) {
      throw new Error("Leaderboard requires a completed scored result");
    }

    const name = displayName.trim().slice(0, 32);
    if (name.length < 1) {
      throw new Error("Display name is required");
    }

    const entry: LeaderboardEntry = {
      sessionId,
      displayName: name,
      score: result.score,
      durationMs: result.durationMs,
      completedAt: result.completedAt ?? new Date().toISOString(),
    };

    const list = this.leaderboards.get(session.publicSlug) ?? [];
    // Replace if same session resubmits.
    const without = list.filter((e) => e.sessionId !== sessionId);
    without.push(entry);
    without.sort(compareLeaderboard);
    this.leaderboards.set(session.publicSlug, without);
  }

  async getSession(sessionId: string): Promise<PlaySession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async getResult(sessionId: string): Promise<ResultContract | null> {
    return this.results.get(sessionId) ?? null;
  }

  async getLeaderboard(publicSlug: string): Promise<LeaderboardEntry[]> {
    return [...(this.leaderboards.get(publicSlug) ?? [])];
  }

  /** Test helper. */
  getEvents(sessionId: string): SessionEventEnvelope[] {
    return [...(this.events.get(sessionId) ?? [])];
  }
}

/**
 * Sort: score desc, duration asc, earliest completion first.
 * @see agent-work/03-player-shell/TASK.md §G
 */
export function compareLeaderboard(
  a: LeaderboardEntry,
  b: LeaderboardEntry,
): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.durationMs !== b.durationMs) return a.durationMs - b.durationMs;
  return a.completedAt.localeCompare(b.completedAt);
}

export function createMemoryPublicPlayPort(
  options?: MemoryPublicPlayPortOptions,
): MemoryPublicPlayPort {
  return new MemoryPublicPlayPort(options);
}
