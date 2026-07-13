import Link from "next/link";
import { Button } from "@/design-system/Button";
import { Panel } from "@/design-system/Panel";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--fw-font-heading)] text-3xl font-bold tracking-tight">
          Funwall
        </h1>
        <p className="text-[var(--fw-color-muted-strong)]">
          Create classroom activities in about a minute. Scaffold phase — Wave 1
          agents plug in auth, editor, player, and the wheel vertical slice.
        </p>
      </header>

      <Panel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Owner</h2>
          <p className="text-sm text-[var(--fw-color-muted)]">
            Sign in, manage activities, pick a template.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/login">
            <Button variant="primary">Log in</Button>
          </Link>
          <Link href="/activities">
            <Button variant="secondary">My activities</Button>
          </Link>
          <Link href="/activities/new">
            <Button variant="secondary">Create</Button>
          </Link>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold">Public play</h2>
        <p className="mt-1 text-sm text-[var(--fw-color-muted)]">
          Players open unguessable links at{" "}
          <code className="rounded bg-[var(--fw-color-surface-sunken)] px-1">
            /play/[publicSlug]
          </code>
          . No account required.
        </p>
      </Panel>
    </main>
  );
}
