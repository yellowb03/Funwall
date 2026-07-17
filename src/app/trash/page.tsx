import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/design-system/Button";
import { FunwallBrand } from "@/design-system/FunwallBrand";
import { Panel } from "@/design-system/Panel";
import { getOwnerSession } from "@/features/auth/session";
import { getRequestActivityService } from "@/features/activities/repository";
import { restoreActivityAction } from "@/features/activities/actions";

export default async function TrashPage() {
  const session = await getOwnerSession();
  if (!session) redirect("/login?next=/trash");

  const service = await getRequestActivityService();
  const activities = await service.listTrash(session.ownerId);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 pb-16 sm:px-8">
      <nav className="flex items-center justify-between border-b border-[var(--fw-color-border)]/70 py-5">
        <FunwallBrand href="/activities" />
        <Link href="/activities" className="text-sm font-semibold text-[var(--fw-color-link)]">Back to activities</Link>
      </nav>
      <header className="pb-8 pt-10">
        <p className="fw-eyebrow">Recoverable for now</p>
        <h1 className="fw-page-title mt-2 text-4xl">Trash</h1>
        <p className="mt-3 text-[var(--fw-color-muted-strong)]">Restore an activity to put it back on your shelf.</p>
      </header>
      {activities.length === 0 ? (
        <Panel className="py-12 text-center">
          <p className="text-lg font-bold">Nothing in the trash</p>
          <p className="mt-2 text-sm text-[var(--fw-color-muted-strong)]">Deleted activities will appear here.</p>
        </Panel>
      ) : (
        <ul className="grid gap-3">
          {activities.map((activity) => (
            <li key={activity.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--fw-radius-lg)] border border-[var(--fw-color-border)] bg-white p-4">
              <div>
                <p className="font-bold">{activity.title}</p>
                <p className="mt-1 text-sm capitalize text-[var(--fw-color-muted-strong)]">{activity.templateKey.replaceAll("-", " ")}</p>
              </div>
              <form action={async () => {
                "use server";
                const result = await restoreActivityAction(activity.id);
                if (!result.ok) notFound();
              }}>
                <Button type="submit" variant="secondary">Restore</Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
