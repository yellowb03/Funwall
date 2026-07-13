import type { ValidationIssue } from "@/features/editor/types";

export interface ValidationSummaryProps {
  issues: ValidationIssue[];
  className?: string;
}

export function ValidationSummary({
  issues,
  className = "",
}: ValidationSummaryProps) {
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      className={[
        "rounded-[var(--fw-radius-md)] border border-[var(--fw-color-coral)]",
        "bg-[var(--fw-color-coral-subtle)] px-3 py-2 text-sm",
        className,
      ].join(" ")}
    >
      <p className="font-semibold text-[var(--fw-color-danger-text)]">
        Fix {errors.length} issue{errors.length === 1 ? "" : "s"} before
        continuing.
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[var(--fw-color-ink-secondary)]">
        {errors.slice(0, 8).map((issue, index) => (
          <li key={`${issue.path.join(".")}-${index}`}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}
