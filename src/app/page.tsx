import Link from "next/link";
import { Button } from "@/design-system/Button";
import { Panel } from "@/design-system/Panel";
import { getOwnerSession, isLocalDevAuthEnabled } from "@/features/auth/session";
import { isSupabaseConfigured } from "@/services/db";

export default async function HomePage() {
  const session = await getOwnerSession();
  const localDev = isLocalDevAuthEnabled();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--fw-font-heading)] text-3xl font-bold tracking-tight">
          Funwall
        </h1>
        <p className="text-[var(--fw-color-muted-strong)]">
          Create classroom activities in about a minute. Foundation includes
          auth, durable activities, and the My Activities dashboard.
        </p>
      </header>

      {localDev ? (
        <Panel className="border-[var(--fw-color-warning)] bg-[var(--fw-color-warning-subtle)]">
          <p className="text-sm font-semibold text-[var(--fw-color-warning)]">
            Local dev mode
          </p>
          <p className="mt-1 text-sm text-[var(--fw-color-muted-strong)]">
            Supabase env is not configured (
            {isSupabaseConfigured() ? "configured" : "memory repository"}). Use
            the login page for a single local owner session. Never ship this as
            the production default.
          </p>
        </Panel>
      ) : null}

      <Panel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Owner</h2>
          <p className="text-sm text-[var(--fw-color-muted)]">
            {session
              ? `Signed in as ${session.email ?? session.ownerId}`
              : "Sign in, manage activities, pick a template."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!session ? (
            <Link href="/login">
              <Button variant="primary">Log in</Button>
            </Link>
          ) : null}
          <Link href="/activities">
            <Button variant={session ? "primary" : "secondary"}>
              My activities
            </Button>
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
