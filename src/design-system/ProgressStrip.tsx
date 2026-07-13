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
              {index > 0 ? (
                <span
                  aria-hidden
                  className="text-[var(--fw-color-muted)]"
                >
                  &gt;
                </span>
              ) : null}
              <span
                className={[
                  "rounded-[var(--fw-radius-sm)] px-2 py-1 font-semibold",
                  isActive
                    ? "bg-[var(--fw-color-primary-subtle)] text-[var(--fw-color-primary)]"
                    : isDone
                      ? "text-[var(--fw-color-ink)]"
                      : "text-[var(--fw-color-muted)]",
                ].join(" ")}
                aria-current={isActive ? "step" : undefined}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
