"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ProgressStrip } from "@/design-system/ProgressStrip";
import { Button } from "@/design-system/Button";
import { Panel } from "@/design-system/Panel";
import { FunwallBrand } from "@/design-system/FunwallBrand";
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
    <div id="main-content" className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 pb-16 sm:px-8">
      <nav className="flex items-center justify-between border-b border-[var(--fw-color-border)]/70 py-5">
        <FunwallBrand href="/activities" />
        <Link href="/activities" className="text-sm font-semibold text-[var(--fw-color-link)]">Save and exit</Link>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 pb-7 pt-7">
        <ProgressStrip activeIndex={1} steps={STEPS} />
        <div className="flex flex-wrap items-center gap-2">
          <AutosaveStatus
            phase={autosavePhase}
            errorMessage={autosaveError}
            onRetry={onAutosaveRetry}
          />
          <span
            className="rounded-full border border-[var(--fw-color-primary)]/20 bg-[var(--fw-color-primary-subtle)] px-3 py-1.5 text-sm font-bold text-[var(--fw-color-primary)]"
            data-testid="template-indicator"
          >
            {templateDisplayName}
          </span>
        </div>
      </div>

      {recoveryBanner}
      {conflictBanner}

      <header className="mb-5">
        <p className="fw-eyebrow">Build the content</p>
        <h1 className="fw-page-title mt-2 text-3xl sm:text-4xl">Make your {templateDisplayName.toLowerCase()}</h1>
        <p className="mt-2 text-sm text-[var(--fw-color-muted-strong)]">Add the essentials now. You can adjust the activity again later.</p>
      </header>

      <Panel className="space-y-5 border-white/90 p-5 shadow-[var(--fw-shadow-card)] sm:p-7">
        <div className="space-y-1">
          <label
            htmlFor="activity-title"
            className="text-xs font-bold uppercase tracking-[.09em] text-[var(--fw-color-muted-strong)]"
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
              "min-h-14 bg-[var(--fw-color-surface)] px-4 py-3 text-xl font-semibold tracking-[-.02em]",
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

        <div className="border-t border-[var(--fw-color-border)] pt-5">
          {children}
        </div>
      </Panel>

      <div className="sticky bottom-3 z-20 mt-5 flex flex-col gap-3 rounded-[var(--fw-radius-lg)] border border-white/90 bg-white/90 p-3 shadow-[0_12px_35px_rgba(37,91,114,.16)] backdrop-blur-md">
        <ValidationSummary issues={validation} />
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-sm text-[var(--fw-color-muted-strong)] sm:block">Your changes save automatically.</p>
          <Button
            type="button"
            variant="primary"
            onClick={onDone}
            disabled={doneDisabled || donePending}
            className="min-w-32"
            data-testid="editor-done"
          >
            {donePending ? "Saving…" : "Done"}
          </Button>
        </div>
      </div>
    </div>
  );
}
