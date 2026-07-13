import Link from "next/link";
import { Button } from "@/design-system/Button";
import { Panel } from "@/design-system/Panel";
import { ActivityCard } from "@/features/activities/components/ActivityCard";
import type { ActivitySummary } from "@/services/db/types";
import type { OwnerSession } from "@/features/auth/types";
import { signOut } from "@/features/auth/actions";
import { getProductRegistry } from "@/features/templates/registry";

export function ActivitiesDashboard({
  session,
  activities,
  search,
  errorMessage,
}: {
  session: OwnerSession;
  activities: ActivitySummary[];
  search: string;
  errorMessage?: string | null;
}) {
  const registry = getProductRegistry();
  const isEmpty = activities.length === 0 && !search;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My activities</h1>
          <p className="mt-1 text-sm text-[var(--fw-color-muted-strong)]">
            {session.email}
            {session.label ? (
              <span className="ml-2 rounded-[var(--fw-radius-sm)] bg-[var(--fw-color-warning-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--fw-color-warning)]">
                {session.label}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/activities/new">
            <Button variant="primary">Create activity</Button>
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost">
              Sign out
            </Button>
          </form>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="activity-search">
          Search activities
        </label>
        <input
          id="activity-search"
          name="q"
          defaultValue={search}
          placeholder="Search by title"
          className="min-h-[var(--fw-touch-min)] min-w-[16rem] flex-1 rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] px-3 text-base"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {errorMessage ? (
        <Panel className="border-[var(--fw-color-coral)] bg-[var(--fw-color-coral-subtle)]">
          <p className="text-sm text-[var(--fw-color-danger-text)]" role="alert">
            {errorMessage}
          </p>
        </Panel>
      ) : null}

      {isEmpty ? (
        <Panel className="flex flex-col items-start gap-4">
          <div>
            <h2 className="text-lg font-semibold">No activities yet</h2>
            <p className="mt-1 text-sm text-[var(--fw-color-muted-strong)]">
              Create your first classroom activity from a template.
            </p>
          </div>
          <Link href="/activities/new">
            <Button variant="primary">Create your first activity</Button>
          </Link>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {registry.list().map((reg) => (
              <div
                key={reg.metadata.key}
                className="rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface-sunken)] p-3"
              >
                <p className="font-semibold">{reg.metadata.displayName}</p>
                <p className="mt-1 text-xs text-[var(--fw-color-muted)]">
                  {reg.metadata.description}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      ) : activities.length === 0 ? (
        <Panel>
          <p className="text-sm text-[var(--fw-color-muted-strong)]">
            No activities match “{search}”.
          </p>
        </Panel>
      ) : (
        <ul className="grid gap-4">
          {activities.map((activity) => {
            const displayName = registry.has(activity.templateKey)
              ? registry.get(activity.templateKey).metadata.displayName
              : undefined;
            return (
              <li key={activity.id}>
                <ActivityCard
                  activity={activity}
                  displayName={displayName}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
