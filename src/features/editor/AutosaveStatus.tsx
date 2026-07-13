"use client";

import type { AutosavePhase } from "@/features/editor/autosave/machine";
import { autosaveStatusLabel } from "@/features/editor/autosave/machine";
import { Button } from "@/design-system/Button";

export interface AutosaveStatusProps {
  phase: AutosavePhase;
  errorMessage?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function AutosaveStatus({
  phase,
  errorMessage,
  onRetry,
  className = "",
}: AutosaveStatusProps) {
  const label = autosaveStatusLabel(phase);
  if (!label && phase !== "error" && phase !== "conflict") {
    return (
      <span
        className={`text-sm text-[var(--fw-color-muted)] ${className}`}
        data-autosave-phase={phase}
        aria-live="polite"
      />
    );
  }

  const color =
    phase === "error" || phase === "conflict"
      ? "text-[var(--fw-color-danger-text)]"
      : phase === "saving"
        ? "text-[var(--fw-color-muted-strong)]"
        : "text-[var(--fw-color-success)]";

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${color} ${className}`}
      data-autosave-phase={phase}
      aria-live="polite"
    >
      <span>{label}</span>
      {phase === "error" && onRetry ? (
        <Button
          type="button"
          variant="ghost"
          className="min-h-0 px-2 py-0 text-sm"
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
      {phase === "error" && errorMessage ? (
        <span className="sr-only">{errorMessage}</span>
      ) : null}
    </span>
  );
}
