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
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[rgba(16,42,58,.72)] p-4 text-center backdrop-blur-[2px]"
      data-testid="start-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-start-title"
    >
      <div className="max-w-lg rounded-[var(--fw-radius-xl)] border border-white/80 bg-[var(--fw-color-surface)] px-8 py-8 shadow-[0_24px_70px_rgba(0,0,0,.24)] sm:px-12 sm:py-10">
        <h1
          id="player-start-title"
          className="font-[family-name:var(--fw-font-heading)] text-3xl font-bold tracking-[-.04em] text-[var(--fw-color-ink)] sm:text-4xl"
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
