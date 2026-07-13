import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/design-system/Button";
import { Panel } from "@/design-system/Panel";
import { getOwnerSession } from "@/features/auth/session";
import { getRequestActivityService } from "@/features/activities/repository";
import {
  autosaveActivityAction,
  disablePublicActivityAction,
  duplicateActivityAction,
  finalizeActivityAction,
  publishActivityAction,
  regenerateSlugAction,
  softDeleteActivityAction,
} from "@/features/activities/actions";
import { buildListContent } from "@/test/fixtures/builders";
import { getProductRegistry } from "@/features/templates/registry";
import { signOut } from "@/features/auth/actions";

export default async function OwnerActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getOwnerSession();
  if (!session) {
    redirect("/login?next=/activities");
  }

  const { id } = await params;
  const service = await getRequestActivityService();
  const detail = await service.getOwnerActivity(session.ownerId, id);
  if (!detail) {
    notFound();
  }

  const { activity } = detail;
  const registry = getProductRegistry();
  const displayName = registry.has(activity.templateKey)
    ? registry.get(activity.templateKey).metadata.displayName
    : activity.templateKey;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const playUrl = activity.publicSlug
    ? `${appUrl}/play/${activity.publicSlug}`
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--fw-color-muted)]">
            <Link href="/activities" className="text-[var(--fw-color-link)]">
              My activities
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-bold">{activity.title}</h1>
          <p className="mt-1 text-sm text-[var(--fw-color-muted-strong)]">
            {displayName} · revision {activity.revision} ·{" "}
            {activity.lifecycleState}
            {session.label ? (
              <span className="ml-2 rounded-[var(--fw-radius-sm)] bg-[var(--fw-color-warning-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--fw-color-warning)]">
                {session.label}
              </span>
            ) : null}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>

      <Panel className="space-y-3">
        <h2 className="text-lg font-semibold">Public play</h2>
        {playUrl ? (
          <p className="break-all text-sm">
            <Link
              className="text-[var(--fw-color-link)]"
              href={`/play/${activity.publicSlug}`}
            >
              {playUrl}
            </Link>
          </p>
        ) : (
          <p className="text-sm text-[var(--fw-color-muted-strong)]">
            No public link yet. Use Done / Publish after content is playable.
          </p>
        )}
      </Panel>

      <Panel className="space-y-3">
        <h2 className="text-lg font-semibold">Owner actions</h2>
        <p className="text-sm text-[var(--fw-color-muted-strong)]">
          Full editor arrives in Workstream 02. These actions prove the
          foundation vertical slice: autosave, finalize, publish, slug, delete.
        </p>
        <div className="flex flex-wrap gap-2">
          {/* Seed playable list content + autosave (wheel only helper) */}
          {activity.templateKey === "wheel" ? (
            <form
              action={async () => {
                "use server";
                const content = buildListContent();
                await autosaveActivityAction({
                  activityId: activity.id,
                  baseRevision: activity.revision,
                  content,
                  title: activity.title,
                });
              }}
            >
              <Button type="submit" variant="secondary">
                Fill sample list + autosave
              </Button>
            </form>
          ) : null}

          <form
            action={async () => {
              "use server";
              const content =
                activity.templateKey === "wheel"
                  ? buildListContent()
                  : activity.content;
              await finalizeActivityAction({
                activityId: activity.id,
                baseRevision: activity.revision,
                content: content as never,
                publish: true,
              });
            }}
          >
            <Button type="submit" variant="primary">
              Done (finalize + publish)
            </Button>
          </form>

          <form
            action={async () => {
              "use server";
              await publishActivityAction(activity.id);
            }}
          >
            <Button type="submit" variant="secondary">
              Publish
            </Button>
          </form>

          <form
            action={async () => {
              "use server";
              await disablePublicActivityAction(activity.id);
            }}
          >
            <Button type="submit" variant="secondary">
              Disable public link
            </Button>
          </form>

          <form
            action={async () => {
              "use server";
              await regenerateSlugAction(activity.id);
            }}
          >
            <Button type="submit" variant="secondary">
              Regenerate slug
            </Button>
          </form>

          <form
            action={async () => {
              "use server";
              const copy = await duplicateActivityAction(activity.id);
              if (copy.ok) {
                redirect(`/activities/${copy.data.id}`);
              }
            }}
          >
            <Button type="submit" variant="secondary">
              Duplicate
            </Button>
          </form>

          <Link href={`/activities/${activity.id}/edit`}>
            <Button variant="ghost">Edit content (stub)</Button>
          </Link>

          <form
            action={async () => {
              "use server";
              await softDeleteActivityAction(activity.id);
              redirect("/activities");
            }}
          >
            <Button type="submit" variant="danger">
              Soft-delete
            </Button>
          </form>
        </div>
      </Panel>
    </main>
  );
}
