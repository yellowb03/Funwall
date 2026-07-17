import Link from "next/link";
import { Button } from "@/design-system/Button";
import { FunwallBrand } from "@/design-system/FunwallBrand";
import { Panel } from "@/design-system/Panel";
import { TemplateArtwork } from "@/design-system/TemplateArtwork";
import { ActivityCard } from "@/features/activities/components/ActivityCard";
import type { ActivitySummary } from "@/services/db/types";
import type { OwnerSession } from "@/features/auth/types";
import { signOut } from "@/features/auth/actions";
import { getProductRegistry } from "@/features/templates/registry";
import { TEMPLATE_CATALOG } from "@/features/editor/template-catalog";

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
    <main id="main-content" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 sm:px-8">
      <nav className="flex items-center justify-between border-b border-[var(--fw-color-border)]/70 py-5">
        <FunwallBrand href="/activities" />
        <div className="flex items-center gap-2">
          <Link href="/trash" className="hidden rounded-[var(--fw-radius-md)] px-3 py-2 text-sm font-semibold text-[var(--fw-color-muted-strong)] hover:bg-white/70 sm:block">
            Trash
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="text-sm">
              Sign out
            </Button>
          </form>
        </div>
      </nav>

      <header className="flex flex-col gap-6 pb-8 pt-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="fw-eyebrow">Your activity shelf</p>
          <h1 className="fw-page-title mt-2 text-4xl sm:text-5xl">My activities</h1>
          <p className="mt-3 text-sm text-[var(--fw-color-muted-strong)]">
            {session.email}
            {session.label ? (
              <span className="ml-2 rounded-full bg-[var(--fw-color-warning-subtle)] px-2.5 py-1 text-xs font-bold text-[var(--fw-color-warning)]">
                local workspace
              </span>
            ) : null}
          </p>
        </div>
        <Link href="/activities/new">
          <Button variant="primary" className="min-h-12 px-5">
            <span className="text-lg" aria-hidden="true">＋</span>
            Create activity
          </Button>
        </Link>
      </header>

      <form method="get" className="mb-7 flex gap-2 rounded-[var(--fw-radius-lg)] border border-white/80 bg-white/70 p-2 shadow-[0_8px_24px_rgba(37,91,114,.08)] backdrop-blur-sm">
        <label className="sr-only" htmlFor="activity-search">Search activities</label>
        <span className="grid w-10 place-items-center text-[var(--fw-color-muted)]" aria-hidden="true">⌕</span>
        <input
          id="activity-search"
          name="q"
          defaultValue={search}
          placeholder="Search your activities"
          className="min-h-[var(--fw-touch-min)] min-w-0 flex-1 bg-transparent px-1 text-base outline-none"
        />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {errorMessage ? (
        <Panel className="border-[var(--fw-color-coral)] bg-[var(--fw-color-coral-subtle)]">
          <p className="text-sm text-[var(--fw-color-danger-text)]" role="alert">{errorMessage}</p>
        </Panel>
      ) : null}

      {isEmpty ? (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-[-.025em]">Start with a play style</h2>
              <p className="mt-1 text-sm text-[var(--fw-color-muted-strong)]">Choose a template now. Your content stays editable.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATE_CATALOG.map((entry) => {
              const available = registry.has(entry.key);
              const card = (
                <div className={`group h-full overflow-hidden rounded-[var(--fw-radius-lg)] border bg-white text-left ${available ? "fw-card-hover border-[var(--fw-color-border)]" : "border-[var(--fw-color-border)] opacity-60"}`}>
                  <TemplateArtwork templateKey={entry.key} className="w-full" />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold tracking-[-.02em]">{entry.displayName}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-[.1em] ${available ? "text-[var(--fw-color-success)]" : "text-[var(--fw-color-muted)]"}`}>
                        {available ? "ready" : "in progress"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-[var(--fw-color-muted-strong)]">{entry.description}</p>
                  </div>
                </div>
              );
              return available ? (
                <Link key={entry.key} href={`/activities/new/${entry.key}`} aria-label={`Create ${entry.displayName}`}>{card}</Link>
              ) : (
                <div key={entry.key} aria-disabled="true">{card}</div>
              );
            })}
          </div>
        </section>
      ) : activities.length === 0 ? (
        <Panel className="py-10 text-center">
          <p className="font-semibold">No activities match “{search}”.</p>
          <Link href="/activities" className="mt-2 inline-block text-sm font-semibold text-[var(--fw-color-link)]">Clear search</Link>
        </Panel>
      ) : (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recently updated</h2>
            <span className="text-sm text-[var(--fw-color-muted-strong)]">{activities.length} {activities.length === 1 ? "activity" : "activities"}</span>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => {
              const displayName = registry.has(activity.templateKey)
                ? registry.get(activity.templateKey).metadata.displayName
                : undefined;
              return <li key={activity.id}><ActivityCard activity={activity} displayName={displayName} /></li>;
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
