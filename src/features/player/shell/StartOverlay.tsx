"use client";

import { Button } from "@/design-system/Button";

export interface StartOverlayProps {
  title: string;
  instruction?: string;
  onPlay: () => void;
  disabled?: boolean;
}

/**
 * Start overlay: title, instruction, large blue Play after user gesture.
 */
export function StartOverlay({
  title,
  instruction,
  onPlay,
  disabled,
}: StartOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[var(--fw-color-overlay)] p-6 text-center"
      data-testid="start-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-start-title"
    >
      <div className="max-w-lg rounded-[var(--fw-radius-lg)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] px-8 py-10 shadow-[var(--fw-shadow-card)]">
        <h1
          id="player-start-title"
          className="font-[family-name:var(--fw-font-heading)] text-2xl font-bold text-[var(--fw-color-ink)] sm:text-3xl"
        >
          {title}
        </h1>
        {instruction ? (
          <p className="mt-3 text-base text-[var(--fw-color-muted-strong)]">
            {instruction}
          </p>
        ) : null}
        <div className="mt-8">
          <Button
            type="button"
            onClick={onPlay}
            disabled={disabled}
            data-testid="play-button"
            className="min-h-14 min-w-[10rem] px-10 text-xl"
          >
            Play
          </Button>
        </div>
      </div>
    </div>
  );
}
