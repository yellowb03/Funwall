import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/design-system/Button";
import { Panel } from "@/design-system/Panel";
import {
  signInLocalDev,
  signInWithPassword,
} from "@/features/auth/actions";
import {
  getOwnerSession,
  isLocalDevAuthEnabled,
} from "@/features/auth/session";
import { DEV_OWNER_LABEL } from "@/features/auth/constants";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await getOwnerSession();
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/activities";

  if (session) {
    redirect(next);
  }

  const localDev = isLocalDevAuthEnabled();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold">Log in</h1>

      {localDev ? (
        <Panel className="space-y-4 border-[var(--fw-color-warning)]">
          <div>
            <p className="text-sm font-semibold text-[var(--fw-color-warning)]">
              {DEV_OWNER_LABEL}
            </p>
            <p className="mt-2 text-sm text-[var(--fw-color-muted-strong)]">
              Supabase credentials are not configured. This single local owner
              session lets the dashboard and activity CRUD work without a real
              project. It is for development only and must never be the
              production default.
            </p>
          </div>
          <form action={signInLocalDev}>
            <input type="hidden" name="next" value={next} />
            <Button type="submit" variant="primary" className="w-full">
              Continue as local owner
            </Button>
          </form>
        </Panel>
      ) : (
        <Panel className="space-y-4">
          <p className="text-sm text-[var(--fw-color-muted-strong)]">
            Sign in with your Funwall owner account (Supabase Auth).
          </p>
          <form
            className="space-y-3"
            action={async (formData) => {
              "use server";
              const result = await signInWithPassword(formData);
              if (result?.error) {
                redirect(
                  `/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(result.error)}`,
                );
              }
            }}
          >
            <input type="hidden" name="next" value={next} />
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="min-h-[var(--fw-touch-min)] w-full rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-white px-3"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="min-h-[var(--fw-touch-min)] w-full rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-white px-3"
              />
            </div>
            {params.error ? (
              <p className="text-sm text-[var(--fw-color-danger-text)]" role="alert">
                {params.error}
              </p>
            ) : null}
            <Button type="submit" variant="primary" className="w-full">
              Sign in
            </Button>
          </form>
        </Panel>
      )}

      <p className="text-sm">
        <Link
          className="text-[var(--fw-color-link)] hover:text-[var(--fw-color-link-hover)]"
          href="/"
        >
          Back home
        </Link>
      </p>
    </main>
  );
}
