import Link from "next/link";
import { Button } from "@/design-system/Button";
import { FunwallBrand } from "@/design-system/FunwallBrand";
import { TemplateArtwork } from "@/design-system/TemplateArtwork";
import { getOwnerSession, isLocalDevAuthEnabled } from "@/features/auth/session";

export default async function HomePage() {
  const session = await getOwnerSession();
  const localDev = isLocalDevAuthEnabled();

  return (
    <main id="main-content" className="flex min-h-dvh flex-col">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <FunwallBrand />
        <div className="flex items-center gap-2">
          {session ? (
            <Link href="/activities">
              <Button variant="primary">Open my activities</Button>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-[var(--fw-radius-md)] px-3 py-2 text-sm font-semibold text-[var(--fw-color-ink-secondary)] hover:bg-white/70"
              >
                Log in
              </Link>
              <Link href="/login">
                <Button variant="primary">Start creating</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:py-20">
        <div className="max-w-2xl">
          <p className="fw-eyebrow">Made for the next lesson</p>
          <h1 className="fw-page-title mt-5 text-5xl sm:text-6xl lg:text-[4.6rem]">
            Turn any topic into a game in minutes.
          </h1>
          <p className="mt-6 max-w-[58ch] text-lg leading-8 text-[var(--fw-color-ink-secondary)] sm:text-xl">
            Build bright, classroom-ready activities without wrestling with a
            design tool. Add the content, choose how it plays, and share.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={session ? "/activities/new" : "/login?next=/activities/new"}>
              <Button variant="primary" className="min-h-14 px-6 text-lg">
                Create an activity
                <span aria-hidden="true">→</span>
              </Button>
            </Link>
            <Link
              href="/play/demo-wheel"
              className="rounded-[var(--fw-radius-md)] px-4 py-3 font-semibold text-[var(--fw-color-link)] hover:bg-white/70"
            >
              Try a demo
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[var(--fw-color-muted-strong)]">
            <span>Six focused templates</span>
            <span>No student login</span>
            <span>Autosaves while you type</span>
          </div>
        </div>

        <div className="relative min-h-[430px]" aria-label="Funwall activity preview">
          <div className="absolute inset-x-4 top-4 rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_30px_80px_rgba(37,91,114,0.16)] backdrop-blur-sm sm:inset-x-10">
            <div className="flex items-center justify-between border-b border-[var(--fw-color-border)] pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.13em] text-[var(--fw-color-muted)]">
                  Today’s warm-up
                </p>
                <p className="mt-1 text-lg font-bold">Vocabulary sprint</p>
              </div>
              <span className="rounded-full bg-[var(--fw-color-success-subtle)] px-3 py-1 text-xs font-bold text-[var(--fw-color-success)]">
                ready to play
              </span>
            </div>
            <div className="mt-5 grid grid-cols-[1.35fr_.65fr] gap-4">
              <TemplateArtwork templateKey="wheel" className="h-full w-full drop-shadow-sm" />
              <div className="grid gap-3">
                <TemplateArtwork templateKey="matching-pairs" className="w-full" />
                <TemplateArtwork templateKey="true-false" className="w-full" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-0 rounded-[18px] border border-[var(--fw-color-border)] bg-white px-5 py-4 shadow-[var(--fw-shadow-card)] sm:left-3">
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--fw-color-muted)]">Fast setup</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.04em]">idea → play</p>
          </div>
          <div className="absolute bottom-0 right-0 h-24 w-24 rounded-[30px] bg-[var(--fw-color-coral)] opacity-90 sm:right-5" aria-hidden="true" />
        </div>
      </section>

      {localDev ? (
        <aside className="mx-auto mb-8 w-[calc(100%-2.5rem)] max-w-6xl rounded-[var(--fw-radius-lg)] border border-[var(--fw-color-warning)]/40 bg-[var(--fw-color-warning-subtle)] px-4 py-3 text-sm text-[var(--fw-color-ink-secondary)]">
          <span className="font-bold text-[var(--fw-color-warning)]">Local workspace</span>
          <span className="ml-2">Activities are stored on this computer until Supabase is connected.</span>
        </aside>
      ) : null}
    </main>
  );
}
