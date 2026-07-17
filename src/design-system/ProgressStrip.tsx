export interface ProgressStripStep {
  id: string;
  label: string;
}

export interface ProgressStripProps {
  steps: ProgressStripStep[];
  /** Zero-based index of the active step. */
  activeIndex: number;
}

/**
 * Pick a template > Enter content > Play style progress header shell.
 */
export function ProgressStrip({ steps, activeIndex }: ProgressStripProps) {
  return (
    <nav aria-label="Creation progress" className="w-full">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;
          return (
            <li key={step.id} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden className="h-px w-5 bg-[var(--fw-color-border-strong)] sm:w-8" /> : null}
              <span
                className={[
                  "inline-flex items-center gap-2 font-semibold",
                  isActive
                    ? "text-[var(--fw-color-primary)]"
                    : isDone
                      ? "text-[var(--fw-color-ink)]"
                      : "text-[var(--fw-color-muted)]",
                ].join(" ")}
                aria-current={isActive ? "step" : undefined}
              >
                <span className={[
                  "grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold",
                  isActive
                    ? "bg-[var(--fw-color-primary)] text-white"
                    : isDone
                      ? "bg-[var(--fw-color-ink)] text-white"
                      : "border border-[var(--fw-color-border-strong)] bg-white text-[var(--fw-color-muted)]",
                ].join(" ")} aria-hidden="true">
                  {isDone ? "✓" : index + 1}
                </span>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
