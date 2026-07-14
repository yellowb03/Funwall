"use client";

export interface PlayerHudProps {
  /** When false, score slot is never rendered (Wheel). */
  isScored: boolean;
  score?: number | null;
  progressLabel?: string | null;
  lives?: number | null;
  timerLabel?: string | null;
  muted: boolean;
  /** 0–1 master volume. */
  volume: number;
  onMuteToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onFullscreen: () => void;
  onRestart: () => void;
  onExit?: () => void;
  showFullscreen?: boolean;
}

/**
 * Classroom-friendly player HUD: progress, optional score, lives, timer, sound, controls.
 */
export function PlayerHud({
  isScored,
  score,
  progressLabel,
  lives,
  timerLabel,
  muted,
  volume,
  onMuteToggle,
  onVolumeChange,
  onFullscreen,
  onRestart,
  onExit,
  showFullscreen = true,
}: PlayerHudProps) {
  const volumePercent = Math.round(Math.min(1, Math.max(0, volume)) * 100);

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

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-2"
          data-testid="hud-volume-group"
        >
          <HudIconButton
            label={muted ? "Unmute" : "Mute"}
            onClick={onMuteToggle}
            testId="hud-mute"
          >
            {muted ? "Unmute" : "Mute"}
          </HudIconButton>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--fw-color-muted-strong)]">
            <span className="sr-only">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={muted ? 0 : volumePercent}
              disabled={muted}
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={muted ? 0 : volumePercent}
              data-testid="hud-volume"
              onChange={(e) => {
                const next = Number(e.target.value) / 100;
                onVolumeChange(next);
              }}
              className="h-2 w-20 cursor-pointer accent-[var(--fw-color-primary)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-28"
            />
          </label>
        </div>
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
