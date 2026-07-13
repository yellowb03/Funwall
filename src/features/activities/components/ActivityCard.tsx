import Link from "next/link";
import { Button } from "@/design-system/Button";
import { Panel } from "@/design-system/Panel";
import type { ActivitySummary } from "@/services/db/types";
import { softDeleteActivityFormAction } from "@/features/activities/actions";

function formatUpdated(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function templateLabel(key: string): string {
  return key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ActivityCard({
  activity,
  displayName,
}: {
  activity: ActivitySummary;
  displayName?: string;
}) {
  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/activities/${activity.id}`}
            className="block truncate text-lg font-semibold text-[var(--fw-color-ink)] hover:text-[var(--fw-color-link)]"
          >
            {activity.title}
          </Link>
          <p className="mt-1 text-sm text-[var(--fw-color-muted-strong)]">
            {displayName ?? templateLabel(activity.templateKey)}
            <span className="mx-2 text-[var(--fw-color-border-strong)]">·</span>
            Updated {formatUpdated(activity.updatedAt)}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--fw-color-muted)]">
            {activity.lifecycleState}
            {activity.publicSlug ? " · public link ready" : ""}
          </p>
        </div>
        <div
          className="h-14 w-14 shrink-0 rounded-[var(--fw-radius-sm)] bg-[var(--fw-color-tile-pale)]"
          aria-hidden
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/activities/${activity.id}`}>
          <Button variant="secondary">Open</Button>
        </Link>
        <form
          action={softDeleteActivityFormAction.bind(null, activity.id)}
        >
          <Button type="submit" variant="danger">
            Delete
          </Button>
        </form>
      </div>
    </Panel>
  );
}
