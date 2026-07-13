"use client";

export interface PlayerHudProps {
  /** When false, score slot is never rendered (Wheel). */
  isScored: boolean;
  score?: number | null;
  progressLabel?: string | null;
  lives?: number | null;
  timerLabel?: string | null;
  muted: boolean;
  onMuteToggle: () => void;
  onFullscreen: () => void;
  onRestart: () => void;
  onExit?: () => void;
  showFullscreen?: boolean;
}

/**
 * Classroom-friendly player HUD: progress, optional score, lives, timer, controls.
 */
export function PlayerHud({
  isScored,
  score,
  progressLabel,
  lives,
  timerLabel,
  muted,
  onMuteToggle,
  onFullscreen,
  onRestart,
  onExit,
  showFullscreen = true,
}: PlayerHudProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] px-3 py-2"
      data-testid="player-hud"
    >
      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--fw-color-ink-secondary)]">
        {progressLabel ? (
          <span data-testid="hud-progress" aria-label={`Progress: ${progressLabel}`}>
            {progressLabel}
          </span>
        ) : null}
        {isScored && score !== undefined && score !== null ? (
          <span data-testid="hud-score" aria-label={`Score: ${score}`}>
            Score: {score}
          </span>
        ) : null}
        {lives !== undefined && lives !== null ? (
          <span data-testid="hud-lives" aria-label={`Lives: ${lives}`}>
            Lives: {lives}
          </span>
        ) : null}
        {timerLabel ? (
          <span data-testid="hud-timer" aria-label={`Timer: ${timerLabel}`}>
            {timerLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <HudIconButton
          label={muted ? "Unmute" : "Mute"}
          onClick={onMuteToggle}
          testId="hud-mute"
        >
          {muted ? "Unmute" : "Mute"}
        </HudIconButton>
        {showFullscreen ? (
          <HudIconButton
            label="Fullscreen"
            onClick={onFullscreen}
            testId="hud-fullscreen"
          >
            Fullscreen
          </HudIconButton>
        ) : null}
        <HudIconButton label="Restart" onClick={onRestart} testId="hud-restart">
          Restart
        </HudIconButton>
        {onExit ? (
          <HudIconButton label="Exit" onClick={onExit} testId="hud-exit">
            Exit
          </HudIconButton>
        ) : null}
      </div>
    </div>
  );
}

function HudIconButton({
  label,
  onClick,
  children,
  testId,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={testId}
      onClick={onClick}
      className="min-h-[var(--fw-touch-min)] rounded-[var(--fw-radius-sm)] px-2 py-1 text-sm font-semibold text-[var(--fw-color-link)] hover:text-[var(--fw-color-link-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fw-color-focus-ring)]"
    >
      {children}
    </button>
  );
}
