"use client";

import type { ReactNode } from "react";
import { ProgressStrip } from "@/design-system/ProgressStrip";
import { Button } from "@/design-system/Button";
import { Panel } from "@/design-system/Panel";
import { AutosaveStatus } from "@/features/editor/AutosaveStatus";
import { ValidationSummary } from "@/features/editor/ValidationSummary";
import type { AutosavePhase } from "@/features/editor/autosave/machine";
import type { ValidationIssue } from "@/features/editor/types";

export interface EditorFrameProps {
  templateDisplayName: string;
  title: string;
  instruction?: string;
  showInstruction: boolean;
  onTitleChange: (title: string) => void;
  onInstructionChange: (instruction: string) => void;
  onToggleInstruction: () => void;
  autosavePhase: AutosavePhase;
  autosaveError?: string | null;
  onAutosaveRetry?: () => void;
  validation: ValidationIssue[];
  onDone: () => void;
  doneDisabled?: boolean;
  donePending?: boolean;
  children: ReactNode;
  conflictBanner?: ReactNode;
  recoveryBanner?: ReactNode;
}

const STEPS = [
  { id: "pick", label: "Pick a template" },
  { id: "content", label: "Enter content" },
  { id: "play", label: "Play" },
];

/**
 * Shared editor chrome: progress, title, instruction, autosave, Done.
 * Template-specific fields render via `children` (adapter slot).
 */
export function EditorFrame({
  templateDisplayName,
  title,
  instruction = "",
  showInstruction,
  onTitleChange,
  onInstructionChange,
  onToggleInstruction,
  autosavePhase,
  autosaveError,
  onAutosaveRetry,
  validation,
  onDone,
  doneDisabled,
  donePending,
  children,
  conflictBanner,
  recoveryBanner,
}: EditorFrameProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProgressStrip activeIndex={1} steps={STEPS} />
        <div className="flex flex-wrap items-center gap-3">
          <AutosaveStatus
            phase={autosavePhase}
            errorMessage={autosaveError}
            onRetry={onAutosaveRetry}
          />
          <span
            className="rounded-[var(--fw-radius-sm)] bg-[var(--fw-color-primary-subtle)] px-2 py-1 text-sm font-semibold text-[var(--fw-color-primary)]"
            data-testid="template-indicator"
          >
            {templateDisplayName}
          </span>
        </div>
      </div>

      {recoveryBanner}
      {conflictBanner}

      <Panel className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="activity-title"
            className="text-sm font-semibold text-[var(--fw-color-ink-secondary)]"
          >
            Activity title
          </label>
          <input
            id="activity-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter an activity title"
            maxLength={200}
            className={[
              "w-full rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)]",
              "bg-[var(--fw-color-surface)] px-3 py-2 text-base",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-[var(--fw-color-focus-ring)]",
            ].join(" ")}
          />
        </div>

        {showInstruction ? (
          <div className="space-y-1">
            <label
              htmlFor="activity-instruction"
              className="text-sm font-semibold text-[var(--fw-color-ink-secondary)]"
            >
              Instruction
            </label>
            <textarea
              id="activity-instruction"
              value={instruction}
              onChange={(e) => onInstructionChange(e.target.value)}
              placeholder="Optional instructions for players"
              rows={2}
              maxLength={2000}
              className={[
                "w-full resize-y rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)]",
                "bg-[var(--fw-color-surface)] px-3 py-2 text-base",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-[var(--fw-color-focus-ring)]",
              ].join(" ")}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleInstruction}
            className="text-sm font-semibold text-[var(--fw-color-link)] hover:text-[var(--fw-color-link-hover)]"
          >
            + Instruction
          </button>
        )}

        <div className="border-t border-[var(--fw-color-border)] pt-4">
          {children}
        </div>
      </Panel>

      <div className="sticky bottom-4 flex flex-col gap-3">
        <ValidationSummary issues={validation} />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="primary"
            onClick={onDone}
            disabled={doneDisabled || donePending}
            data-testid="editor-done"
          >
            {donePending ? "Saving…" : "Done"}
          </Button>
        </div>
      </div>
    </div>
  );
}
