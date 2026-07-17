import Link from "next/link";
import { Button } from "@/design-system/Button";
import { TemplateArtwork } from "@/design-system/TemplateArtwork";
import type { ActivitySummary } from "@/services/db/types";
import { softDeleteActivityFormAction } from "@/features/activities/actions";

function formatUpdated(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function templateLabel(key: string): string {
  return key.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function ActivityCard({ activity, displayName }: { activity: ActivitySummary; displayName?: string }) {
  return (
    <article className="fw-card-hover group flex h-full flex-col overflow-hidden rounded-[var(--fw-radius-lg)] border border-[var(--fw-color-border)] bg-white">
      <Link href={`/activities/${activity.id}`} className="block p-3 pb-0">
        <TemplateArtwork templateKey={activity.templateKey} className="w-full" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-bold uppercase tracking-[.1em] text-[var(--fw-color-primary)]">{displayName ?? templateLabel(activity.templateKey)}</p>
        <Link href={`/activities/${activity.id}`} className="mt-2 line-clamp-2 text-lg font-bold tracking-[-.025em] text-[var(--fw-color-ink)] hover:text-[var(--fw-color-link)]">
          {activity.title}
        </Link>
        <p className="mt-2 text-xs text-[var(--fw-color-muted)]">Updated {formatUpdated(activity.updatedAt)}</p>
        <div className="mt-auto flex items-center gap-2 pt-5">
          <Link href={`/activities/${activity.id}`} className="flex-1">
            <Button variant="secondary" className="w-full text-sm">Open</Button>
          </Link>
          {activity.publicSlug ? (
            <Link href={`/play/${activity.publicSlug}`}>
              <Button variant="primary" className="text-sm">Play</Button>
            </Link>
          ) : null}
          <form action={softDeleteActivityFormAction.bind(null, activity.id)}>
            <Button type="submit" variant="ghost" className="px-2 text-sm text-[var(--fw-color-danger-text)]" aria-label={`Move ${activity.title} to trash`}>•••</Button>
          </form>
        </div>
      </div>
    </article>
  );
}
