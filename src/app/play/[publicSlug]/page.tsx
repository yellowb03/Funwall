import { Panel } from "@/design-system/Panel";
import { resolvePublicSnapshotAction } from "@/features/activities/actions";

export default async function PublicPlayPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;
  const snapshot = await resolvePublicSnapshotAction(publicSlug);

  if (!snapshot) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-bold">Activity unavailable</h1>
        <Panel>
          <p className="text-sm text-[var(--fw-color-muted-strong)]">
            This play link is invalid, disabled, or the activity was deleted.
            No owner information is available.
          </p>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-bold">{snapshot.title}</h1>
      <Panel className="space-y-2">
        <p className="text-sm text-[var(--fw-color-muted-strong)]">
          Public player shell (Workstream 03) mounts the template player here.
          Snapshot resolved for revision {snapshot.revision} ·{" "}
          {snapshot.templateKey}
          {snapshot.instruction ? ` · ${snapshot.instruction}` : ""}.
        </p>
        <p className="text-xs text-[var(--fw-color-muted)]">
          Sanitized snapshot only — no owner ids. Scored:{" "}
          {snapshot.isScored ? "yes" : "no"}; leaderboard:{" "}
          {snapshot.hasLeaderboard ? "yes" : "no"}.
        </p>
        <pre className="overflow-auto rounded-[var(--fw-radius-sm)] bg-[var(--fw-color-surface-sunken)] p-3 text-xs">
          {JSON.stringify(
            {
              activityId: snapshot.activityId,
              publicSlug: snapshot.publicSlug,
              revision: snapshot.revision,
              templateKey: snapshot.templateKey,
              themeKey: snapshot.themeKey,
              itemCount:
                snapshot.content &&
                typeof snapshot.content === "object" &&
                "items" in snapshot.content &&
                Array.isArray(
                  (snapshot.content as { items?: unknown[] }).items,
                )
                  ? (snapshot.content as { items: unknown[] }).items.length
                  : undefined,
            },
            null,
            2,
          )}
        </pre>
      </Panel>
    </main>
  );
}
