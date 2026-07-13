"use client";

import { useState } from "react";
import type { ResultContract } from "@/domain/result";
import { Button } from "@/design-system/Button";

export interface ResultReviewProps {
  result: ResultContract;
  isScored: boolean;
  hasLeaderboard: boolean;
  title?: string;
  onPlayAgain?: () => void;
  onSubmitLeaderboard?: (displayName: string) => Promise<void>;
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Common result summary shell.
 * Wheel: simple "Spin complete" / play again — no score or leaderboard.
 */
export function ResultReview({
  result,
  isScored,
  hasLeaderboard,
  title,
  onPlayAgain,
  onSubmitLeaderboard,
}: ResultReviewProps) {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showLeaderboard =
    hasLeaderboard &&
    isScored &&
    result.status === "completed" &&
    result.score !== null &&
    Boolean(onSubmitLeaderboard);

  const isWheelStyle = !isScored;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmitLeaderboard || submitted) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmitLeaderboard(name.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit name");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 overflow-auto p-6 text-center"
      data-testid="result-review"
      data-scored={isScored ? "true" : "false"}
      data-leaderboard={hasLeaderboard ? "true" : "false"}
    >
      <h2 className="font-[family-name:var(--fw-font-heading)] text-2xl font-bold text-[var(--fw-color-ink)]">
        {isWheelStyle
          ? "Spin complete"
          : result.status === "gameOver"
            ? "Game over"
            : "Complete!"}
      </h2>
      {title ? (
        <p className="text-sm text-[var(--fw-color-muted-strong)]">{title}</p>
      ) : null}

      {isScored ? (
        <dl
          className="grid grid-cols-2 gap-x-6 gap-y-2 text-left text-sm"
          data-testid="result-stats"
        >
          <dt className="text-[var(--fw-color-muted-strong)]">Score</dt>
          <dd className="font-semibold" data-testid="result-score">
            {result.score ?? "—"}
          </dd>
          {result.accuracy != null ? (
            <>
              <dt className="text-[var(--fw-color-muted-strong)]">Accuracy</dt>
              <dd className="font-semibold" data-testid="result-accuracy">
                {Math.round(result.accuracy * 100)}%
              </dd>
            </>
          ) : null}
          <dt className="text-[var(--fw-color-muted-strong)]">Duration</dt>
          <dd className="font-semibold" data-testid="result-duration">
            {formatDuration(result.durationMs)}
          </dd>
        </dl>
      ) : (
        <p
          className="text-base text-[var(--fw-color-muted-strong)]"
          data-testid="result-unscored-message"
        >
          Great spin! Play again for a new random pick.
        </p>
      )}

      {showLeaderboard && !submitted ? (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mt-2 flex w-full max-w-xs flex-col gap-2"
          data-testid="leaderboard-form"
        >
          <label
            htmlFor="leaderboard-name"
            className="text-left text-sm font-semibold"
          >
            Enter your name
          </label>
          <input
            id="leaderboard-name"
            name="displayName"
            type="text"
            maxLength={32}
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-[var(--fw-touch-min)] rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] px-3 text-base"
            data-testid="leaderboard-name-input"
          />
          {error ? (
            <p className="text-sm text-[var(--fw-color-danger-text)]" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy || name.trim().length < 1}>
            Submit score
          </Button>
        </form>
      ) : null}

      {submitted ? (
        <p className="text-sm text-[var(--fw-color-success)]" data-testid="leaderboard-submitted">
          Score submitted!
        </p>
      ) : null}

      {onPlayAgain ? (
        <Button
          type="button"
          onClick={onPlayAgain}
          className="mt-2 min-w-[10rem]"
          data-testid="play-again"
        >
          Play again
        </Button>
      ) : null}
    </div>
  );
}
