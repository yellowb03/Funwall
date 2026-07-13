"use client";

import type { ReactElement } from "react";
import {
  tileCssPlacement,
  type TileGridSize,
} from "@/features/templates/image-quiz/reveal";

export interface RevealStageProps {
  grid: TileGridSize;
  revealOrder: readonly number[];
  revealedCount: number;
  imageAlt: string;
  /** Resolved image URL when available; otherwise a decorative placeholder. */
  imageUrl?: string | null;
  reducedMotion?: boolean;
  /** Progress 0–1 for reduced-motion bar mode. */
  progress?: number;
  fullyRevealed?: boolean;
}

/**
 * Logical tile overlays on top of the reveal image.
 * Visual resize only changes geometry; revealed set/order are props.
 */
export function RevealStage({
  grid,
  revealOrder,
  revealedCount,
  imageAlt,
  imageUrl,
  reducedMotion = false,
  progress = 0,
  fullyRevealed = false,
}: RevealStageProps): ReactElement {
  const { cols, rows } = grid;
  const revealed = new Set(revealOrder.slice(0, revealedCount));
  const showAll = fullyRevealed || revealedCount >= revealOrder.length;

  if (reducedMotion && !showAll) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-tile-pale)]"
        style={{ aspectRatio: `${cols} / ${rows}` }}
        data-testid="image-quiz-reveal-stage"
        data-reduced-motion="true"
        data-revealed={revealedCount}
        data-tile-count={revealOrder.length}
      >
        <div
          className="absolute inset-0 flex items-center justify-center bg-[var(--fw-color-surface-sunken)] text-sm text-[var(--fw-color-muted)]"
          aria-hidden={Boolean(imageUrl)}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              className="h-full w-full object-contain opacity-30"
              draggable={false}
            />
          ) : (
            <span>{imageAlt}</span>
          )}
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-3 bg-[var(--fw-color-border)]"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Image reveal progress"
          data-testid="image-quiz-reveal-progress"
        >
          <div
            className="h-full bg-[var(--fw-color-primary)] transition-[width] duration-100"
            style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-tile-pale)]"
      style={{ aspectRatio: `${cols} / ${rows}` }}
      data-testid="image-quiz-reveal-stage"
      data-reduced-motion="false"
      data-revealed={showAll ? revealOrder.length : revealedCount}
      data-tile-count={revealOrder.length}
      data-cols={cols}
      data-rows={rows}
    >
      <div className="absolute inset-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--fw-color-tile-pale)] to-[var(--fw-color-primary-light,#35B7FF)] p-4 text-center text-sm font-semibold text-[var(--fw-color-ink)]"
            role="img"
            aria-label={imageAlt}
          >
            {imageAlt}
          </div>
        )}
      </div>

      {!showAll ? (
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
          aria-hidden="true"
          data-testid="image-quiz-tile-grid"
        >
          {Array.from({ length: cols * rows }, (_, tileIndex) => {
            const isRevealed = revealed.has(tileIndex);
            const { col, row } = tileCssPlacement(tileIndex, cols);
            return (
              <div
                key={tileIndex}
                data-tile-index={tileIndex}
                data-revealed={isRevealed ? "true" : "false"}
                className={
                  isRevealed
                    ? "pointer-events-none opacity-0"
                    : "bg-[var(--fw-color-surface)] opacity-100 shadow-[inset_0_0_0_1px_var(--fw-color-border)]"
                }
                style={{ gridColumn: col, gridRow: row }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
