import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/design-system/Button";
import { FunwallBrand } from "@/design-system/FunwallBrand";
import { Panel } from "@/design-system/Panel";
import { TemplateArtwork } from "@/design-system/TemplateArtwork";
import { getOwnerSession } from "@/features/auth/session";
import { getRequestActivityService } from "@/features/activities/repository";
import {
  disablePublicActivityAction,
  duplicateActivityAction,
  finalizeActivityAction,
  regenerateSlugAction,
  softDeleteActivityAction,
} from "@/features/activities/actions";
import { getProductRegistry } from "@/features/templates/registry";
import { signOut } from "@/features/auth/actions";

export default async function OwnerActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getOwnerSession();
  if (!session) redirect("/login?next=/activities");

  const { id } = await params;
  const service = await getRequestActivityService();
  const detail = await service.getOwnerActivity(session.ownerId, id);
  if (!detail) notFound();

  const { activity } = detail;
  const registry = getProductRegistry();
  const displayName = registry.has(activity.templateKey)
    ? registry.get(activity.templateKey).metadata.displayName
    : activity.templateKey;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const playUrl = activity.publicSlug ? `${appUrl}/play/${activity.publicSlug}` : null;

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 sm:px-8">
      <nav className="flex items-center justify-between border-b border-[var(--fw-color-border)]/70 py-5">
        <FunwallBrand href="/activities" />
        <form action={signOut}><Button type="submit" variant="ghost" className="text-sm">Sign out</Button></form>
      </nav>

      <header className="flex flex-col gap-5 pb-8 pt-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/activities" className="text-sm font-semibold text-[var(--fw-color-link)]">← My activities</Link>
          <p className="fw-eyebrow mt-6">{displayName}</p>
          <h1 className="fw-page-title mt-2 text-4xl sm:text-5xl">{activity.title}</h1>
          <p className="mt-3 text-sm text-[var(--fw-color-muted-strong)]">
            {activity.lifecycleState === "published" ? "Published and ready to share" : "Draft — finish the content to publish"}
            <span className="mx-2">·</span>revision {activity.revision}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/activities/${activity.id}/edit`}><Button variant="secondary">Edit content</Button></Link>
          {activity.publicSlug ? (
            <Link href={`/play/${activity.publicSlug}`}><Button variant="primary">Play activity <span aria-hidden="true">→</span></Button></Link>
          ) : null}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_.55fr]">
        <section className="overflow-hidden rounded-[var(--fw-radius-xl)] border border-[var(--fw-color-border)] bg-white p-4 shadow-[var(--fw-shadow-card)] sm:p-6">
          <div className="aspect-video overflow-hidden rounded-[var(--fw-radius-lg)] bg-[var(--fw-color-canvas-alt)] p-5 sm:p-9">
            <TemplateArtwork templateKey={activity.templateKey} className="h-full w-full" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-5">
            <div>
              <p className="text-sm font-bold">Activity preview</p>
              <p className="mt-1 text-sm text-[var(--fw-color-muted-strong)]">Open the player to test sound, timing, and the full game.</p>
            </div>
            {activity.publicSlug ? <Link href={`/play/${activity.publicSlug}`}><Button variant="secondary">Open player</Button></Link> : null}
          </div>
        </section>

        <aside className="space-y-4">
          <Panel className="border-white/90 p-5 shadow-[var(--fw-shadow-card)]">
            <p className="fw-eyebrow">Share</p>
            {playUrl ? (
              <>
                <p className="mt-3 break-all rounded-[var(--fw-radius-md)] bg-[var(--fw-color-surface-sunken)] p-3 text-sm text-[var(--fw-color-ink-secondary)]">{playUrl}</p>
                <Link href={`/play/${activity.publicSlug}`} className="mt-3 inline-block text-sm font-bold text-[var(--fw-color-link)]">Open public link ↗</Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-[var(--fw-color-muted-strong)]">Finish the activity to create a player link.</p>
                <form className="mt-4" action={async () => {
                  "use server";
                  await finalizeActivityAction({
                    activityId: activity.id,
                    baseRevision: activity.revision,
                    content: activity.content as never,
                    publish: true,
                  });
                }}><Button type="submit" variant="primary" className="w-full">Publish</Button></form>
              </>
            )}
          </Panel>

          <Panel className="space-y-2 border-white/90 p-4">
            <p className="px-2 pb-1 text-xs font-bold uppercase tracking-[.1em] text-[var(--fw-color-muted)]">Manage</p>
            <form action={async () => {
              "use server";
              const copy = await duplicateActivityAction(activity.id);
              if (copy.ok) redirect(`/activities/${copy.data.id}`);
            }}><Button type="submit" variant="ghost" className="w-full justify-start">Duplicate activity</Button></form>
            {activity.publicSlug ? (
              <>
                <form action={async () => { "use server"; await regenerateSlugAction(activity.id); }}><Button type="submit" variant="ghost" className="w-full justify-start">Create a new share link</Button></form>
                <form action={async () => { "use server"; await disablePublicActivityAction(activity.id); }}><Button type="submit" variant="ghost" className="w-full justify-start">Disable public link</Button></form>
              </>
            ) : null}
            <form action={async () => { "use server"; await softDeleteActivityAction(activity.id); redirect("/activities"); }}>
              <Button type="submit" variant="ghost" className="w-full justify-start text-[var(--fw-color-danger-text)]">Move to trash</Button>
            </form>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
