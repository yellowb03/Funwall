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
import { FunwallBrand } from "@/design-system/FunwallBrand";

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
    <main id="main-content" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-5 px-5 py-12">
      <FunwallBrand />
      <div className="mt-4">
        <p className="fw-eyebrow">Your activity shelf</p>
        <h1 className="fw-page-title mt-2 text-4xl">Welcome back.</h1>
        <p className="mt-3 text-[var(--fw-color-ink-secondary)]">
          Sign in to create, edit, and launch your classroom games.
        </p>
      </div>

      {localDev ? (
        <Panel className="space-y-5 border-white/80 p-6 shadow-[var(--fw-shadow-card)]">
          <div>
            <p className="text-sm font-semibold text-[var(--fw-color-warning)]">
              {DEV_OWNER_LABEL}
            </p>
            <p className="mt-2 text-sm text-[var(--fw-color-muted-strong)]">
              Cloud database is not configured yet. You can still create,
              edit, and play activities in this browser — they are saved in
              secure cookies on this device. Add Supabase env vars on the
              host for multi-device cloud storage.
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
        <Panel className="space-y-4 border-white/80 p-6 shadow-[var(--fw-shadow-card)]">
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

      <p className="text-sm text-[var(--fw-color-muted-strong)]">
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
