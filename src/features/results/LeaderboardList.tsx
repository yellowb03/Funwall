import type { LeaderboardEntry } from "@/features/player/session/types";

export interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  /** When false, render nothing (Wheel). */
  hasLeaderboard: boolean;
}

/**
 * Sorted leaderboard display (score desc, duration asc, earliest completion).
 */
export function LeaderboardList({
  entries,
  hasLeaderboard,
}: LeaderboardListProps) {
  if (!hasLeaderboard) return null;

  return (
    <ol
      className="mx-auto w-full max-w-md divide-y divide-[var(--fw-color-border)] rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] text-left"
      data-testid="leaderboard-list"
    >
      {entries.length === 0 ? (
        <li className="px-4 py-3 text-sm text-[var(--fw-color-muted-strong)]">
          No scores yet. Be the first!
        </li>
      ) : (
        entries.map((entry, index) => (
          <li
            key={entry.sessionId}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            data-testid="leaderboard-entry"
          >
            <span className="font-semibold text-[var(--fw-color-muted-strong)]">
              {index + 1}.
            </span>
            <span className="flex-1 font-semibold">{entry.displayName}</span>
            <span className="tabular-nums">{entry.score}</span>
          </li>
        ))
      )}
    </ol>
  );
}
