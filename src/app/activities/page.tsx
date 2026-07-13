import Link from "next/link";
import { Button } from "@/design-system/Button";
import { Panel } from "@/design-system/Panel";

export default function ActivitiesPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My activities</h1>
        <Link href="/activities/new">
          <Button>Create activity</Button>
        </Link>
      </div>
      <Panel>
        <p className="text-sm text-[var(--fw-color-muted-strong)]">
          Dashboard cards, search, folders, and soft-delete land in Workstream
          01. Empty state will show the six template shortcuts.
        </p>
      </Panel>
    </main>
  );
}
