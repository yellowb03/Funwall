"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TemplateKey } from "@/domain/template-keys";
import { createActivityJsonAction } from "@/features/activities/actions";
import { Button } from "@/design-system/Button";
import { Panel } from "@/design-system/Panel";
import { getCatalogEntry } from "@/features/editor/template-catalog";

export interface CreateDraftClientProps {
  templateKey: TemplateKey;
}

/**
 * Creates a durable draft via server action (so cookie-backed storage can
 * write on Vercel) then navigates to the editor. Replaces the old RSC
 * create+redirect path that could not set cookies and lost drafts across
 * serverless instances.
 */
export function CreateDraftClient({ templateKey }: CreateDraftClientProps) {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const meta = getCatalogEntry(templateKey);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;

    void (async () => {
      const result = await createActivityJsonAction({ templateKey });
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message || "Could not create activity.");
        return;
      }
      router.replace(`/activities/${result.data.id}/edit`);
    })();

    return () => {
      cancelled = true;
    };
  }, [templateKey, router]);

  if (error) {
    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-5 py-12"
      >
        <Panel className="space-y-4 border-white/80 p-6 shadow-[var(--fw-shadow-card)]">
          <h1 className="text-xl font-bold tracking-[-.02em]">
            Could not start {meta?.displayName ?? "activity"}
          </h1>
          <p className="text-sm text-[var(--fw-color-danger-text)]" role="alert">
            {error}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                started.current = false;
                setError(null);
                // Re-run effect by remounting via full navigation
                router.refresh();
                window.location.assign(`/activities/new/${templateKey}`);
              }}
            >
              Try again
            </Button>
            <Link href="/activities/new">
              <Button type="button" variant="secondary">
                Back to templates
              </Button>
            </Link>
          </div>
        </Panel>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-3 px-5 py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="fw-eyebrow">Creating</p>
      <h1 className="fw-page-title text-3xl">
        Starting {meta?.displayName ?? "your activity"}…
      </h1>
      <p className="text-sm text-[var(--fw-color-muted-strong)]">
        Setting up a draft you can edit and play.
      </p>
    </main>
  );
}
